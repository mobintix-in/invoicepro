-- Security and integrity corrections for subscriptions, invoices, and RPCs.

alter table public.invoices
  add column if not exists seller_pan        text not null default '',
  add column if not exists bank_account_name text not null default '',
  add column if not exists bank_name         text not null default '',
  add column if not exists account_number    text not null default '',
  add column if not exists ifsc_code         text not null default '',
  add column if not exists bank_branch       text not null default '',
  add column if not exists jurisdiction      text not null default '',
  add column if not exists gst_type          text not null default 'cgst_sgst',
  add column if not exists delivery_note     text not null default '',
  add column if not exists buyer_order_no    text not null default '',
  add column if not exists dispatch_through  text not null default '',
  add column if not exists destination       text not null default '';

update public.subscriptions s
set plan_key = 'starter'
where plan_key is null
   or not exists (select 1 from public.packages p where p.key = s.plan_key);

alter table public.subscriptions alter column plan_key set not null;
create index if not exists subscriptions_plan_key_idx
  on public.subscriptions (plan_key);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'subscriptions_plan_key_fkey'
      and conrelid = 'public.subscriptions'::regclass
  ) then
    alter table public.subscriptions
      add constraint subscriptions_plan_key_fkey
      foreign key (plan_key) references public.packages(key)
      on update cascade on delete restrict;
  end if;
end $$;

drop policy if exists "Users submit own subscription" on public.subscriptions;
drop policy if exists "Users resubmit own subscription" on public.subscriptions;

create or replace function public.submit_subscription_payment(
  p_utr text,
  p_plan_key text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_price integer;
  v_written uuid;
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  if char_length(trim(coalesce(p_utr, ''))) not between 6 and 200 then
    raise exception 'INVALID_UTR';
  end if;

  select price_inr into v_price
  from public.packages
  where key = p_plan_key and active = true;

  if not found then
    raise exception 'INVALID_PLAN';
  end if;

  insert into public.subscriptions (
    user_id, status, utr, amount, plan_key, plan_months,
    submitted_at, activated_at, expires_at, updated_at
  ) values (
    v_uid, 'pending', trim(p_utr), v_price, p_plan_key, 1,
    now(), null, null, now()
  )
  on conflict (user_id) do update
    set status = 'pending',
        utr = excluded.utr,
        amount = excluded.amount,
        plan_key = excluded.plan_key,
        plan_months = excluded.plan_months,
        submitted_at = excluded.submitted_at,
        activated_at = null,
        expires_at = null,
        updated_at = excluded.updated_at
  where public.subscriptions.status in ('rejected', 'expired')
     or (
       public.subscriptions.status = 'active'
       and public.subscriptions.expires_at <= now()
     )
  returning user_id into v_written;

  if v_written is null then
    raise exception 'SUBSCRIPTION_NOT_RENEWABLE';
  end if;
end;
$$;

revoke execute on function public.submit_subscription_payment(text, text)
  from public, anon;
grant execute on function public.submit_subscription_payment(text, text)
  to authenticated;

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select uid = (select auth.uid())
     and exists (select 1 from public.admins where user_id = uid);
$$;

create or replace function public.has_active_subscription(uid uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select uid = (select auth.uid())
     and exists (
       select 1 from public.subscriptions
       where user_id = uid and status = 'active' and expires_at > now()
     );
$$;

create or replace function public.my_access()
returns table (is_admin boolean, is_active boolean)
language sql
security definer
stable
set search_path = ''
as $$
  select
    public.is_admin((select auth.uid())),
    public.has_active_subscription((select auth.uid()));
$$;

revoke execute on function public.is_admin(uuid) from public;
revoke execute on function public.has_active_subscription(uuid) from public, anon;
revoke execute on function public.my_access() from public, anon;
grant execute on function public.is_admin(uuid) to anon, authenticated;
grant execute on function public.has_active_subscription(uuid) to authenticated;
grant execute on function public.my_access() to authenticated;

create or replace function public.set_invoice_timestamps()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := now();
  else
    new.created_at := old.created_at;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists a_set_invoice_timestamps_trg on public.invoices;
create trigger a_set_invoice_timestamps_trg
  before insert or update on public.invoices
  for each row execute function public.set_invoice_timestamps();

revoke execute on function public.set_invoice_timestamps()
  from public, anon, authenticated;

create or replace function public.enforce_invoice_quota()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_limit integer;
  v_count integer;
  v_plan_found boolean := false;
begin
  select p.invoice_limit, true into v_limit, v_plan_found
    from public.subscriptions s
    join public.packages p on p.key = s.plan_key and p.active = true
   where s.user_id = new.user_id
     and s.status = 'active'
     and s.expires_at > now()
   limit 1;

  if not v_plan_found then
    raise exception 'ACTIVE_PLAN_REQUIRED';
  end if;

  if v_limit is null then
    return new;
  end if;

  select count(*) into v_count
    from public.invoices
   where user_id = new.user_id
     and created_at >= date_trunc('month', now())
     and created_at < date_trunc('month', now()) + interval '1 month';

  if v_count >= v_limit then
    raise exception 'INVOICE_LIMIT_REACHED'
      using hint = 'Monthly invoice limit reached for the current plan.';
  end if;

  return new;
end;
$$;

revoke execute on function public.enforce_invoice_quota()
  from public, anon, authenticated;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.invoice_counters (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_number integer not null check (last_number > 0)
);

create or replace function public.next_invoice_number()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_number integer;
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  insert into private.invoice_counters (user_id, last_number)
  values (
    v_uid,
    coalesce((
      select max(substring(invoice_number from '[0-9]+$')::integer)
      from public.invoices
      where user_id = v_uid and invoice_number ~ '[0-9]+$'
    ), 0) + 1
  )
  on conflict (user_id) do update
    set last_number = private.invoice_counters.last_number + 1
  returning last_number into v_number;

  return 'INV-' || lpad(v_number::text, 4, '0');
end;
$$;

revoke execute on function public.next_invoice_number() from public, anon;
grant execute on function public.next_invoice_number() to authenticated;

create unique index if not exists invoices_user_number_unique_idx
  on public.invoices (user_id, invoice_number);

alter function public.handle_new_user() set search_path = '';
revoke execute on function public.handle_new_user()
  from public, anon, authenticated;
alter function public.my_invoice_quota() set search_path = '';
revoke execute on function public.my_invoice_quota() from public, anon;
grant execute on function public.my_invoice_quota() to authenticated;

create or replace function public.adjust_inventory_stock(
  p_id text,
  p_delta numeric
)
returns numeric
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_quantity numeric;
begin
  if v_uid is null or not public.has_active_subscription(v_uid) then
    raise exception 'ACTIVE_SUBSCRIPTION_REQUIRED';
  end if;

  update public.inventory_items
  set quantity = greatest(0, quantity + p_delta),
      updated_at = now()
  where id = p_id and user_id = v_uid
  returning quantity into v_quantity;

  if v_quantity is null then
    raise exception 'INVENTORY_ITEM_NOT_FOUND';
  end if;

  return v_quantity;
end;
$$;

revoke execute on function public.adjust_inventory_stock(text, numeric)
  from public, anon;
grant execute on function public.adjust_inventory_stock(text, numeric)
  to authenticated;

-- Rate-limit the public contact endpoint inside Postgres so callers cannot
-- bypass the protection by invoking the Data API directly.
create table if not exists private.contact_rate_limits (
  fingerprint text primary key,
  window_started timestamptz not null,
  submissions integer not null
);

drop policy if exists "Anyone can submit a message" on public.contact_messages;

create or replace function public.submit_contact_message(
  p_name text,
  p_email text,
  p_message text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_headers jsonb := coalesce(
    nullif(current_setting('request.headers', true), '')::jsonb,
    '{}'::jsonb
  );
  v_fingerprint text;
  v_submissions integer;
begin
  if char_length(trim(coalesce(p_name, ''))) not between 1 and 200
     or char_length(trim(coalesce(p_email, ''))) not between 3 and 200
     or char_length(trim(coalesce(p_message, ''))) not between 1 and 5000 then
    raise exception 'INVALID_CONTACT_MESSAGE';
  end if;

  v_fingerprint := pg_catalog.md5(
    coalesce(v_headers ->> 'x-forwarded-for', 'unknown') || '|' ||
    coalesce(v_headers ->> 'user-agent', 'unknown')
  );

  insert into private.contact_rate_limits as limits (
    fingerprint, window_started, submissions
  ) values (
    v_fingerprint, now(), 1
  )
  on conflict (fingerprint) do update
    set submissions = case
          when limits.window_started <= now() - interval '10 minutes' then 1
          else limits.submissions + 1
        end,
        window_started = case
          when limits.window_started <= now() - interval '10 minutes' then now()
          else limits.window_started
        end
  returning submissions into v_submissions;

  if v_submissions > 5 then
    raise exception 'CONTACT_RATE_LIMITED';
  end if;

  insert into public.contact_messages (name, email, message, handled)
  values (trim(p_name), trim(p_email), trim(p_message), false);
end;
$$;

revoke execute on function public.submit_contact_message(text, text, text)
  from public;
grant execute on function public.submit_contact_message(text, text, text)
  to anon, authenticated;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update on public.subscriptions to authenticated;
grant select, insert, update, delete on public.invoices to authenticated;
grant select, insert, update, delete on public.clients to authenticated;
grant select, insert, update, delete on public.inventory_items to authenticated;
grant select on public.packages to anon, authenticated;
grant insert, update, delete on public.packages to authenticated;
grant select on public.blog_posts to anon, authenticated;
grant insert, update, delete on public.blog_posts to authenticated;
revoke insert on public.contact_messages from anon, authenticated;
grant select, update, delete on public.contact_messages to authenticated;
