-- ============================================================================
-- 002_functions_and_triggers.sql
-- InvoicePro – Core Functions, Triggers, and Stored Procedures
--
-- Functions & Triggers:
--   • is_admin()                     – Verify admin status safely
--   • has_active_subscription()      – Check subscription validity
--   • my_access()                    – Single round-trip auth/paywall helper
--   • handle_new_user()              – Auto-populate profile on signup
--   • set_invoice_timestamps()       – Enforce created_at / updated_at
--   • enforce_invoice_quota()        – Plan-based monthly invoice limit trigger
--   • my_invoice_quota()             – Current user's monthly invoice usage
--   • next_invoice_number()          – Atomic per-user invoice numbering
--   • submit_subscription_payment_v2()– Payment submission & renewal receipt
--   • adjust_inventory_stock()       – Atomic stock quantity updates
--   • save_fabric_lot()              – Atomic fabric lot & rolls upsert
--   • list_user_auth_providers()     – Admin-only sign-in methods audit
-- ============================================================================

-- ── Admin and Access Helpers ────────────────────────────────────────────────
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.admins where user_id = uid
  ) or exists (
    select 1 from auth.users
    where id = uid and lower(email) in ('aryanbhimani0011@gmail.com')
  );
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

-- ── Auto-Create Profile on Signup ───────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone, company_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.raw_user_meta_data ->> 'company_name', ''),
    coalesce(new.email, '')
  )
  on conflict (id) do nothing;

  -- Auto-grant admin role to recognized administrators
  if lower(coalesce(new.email, '')) in ('aryanbhimani0011@gmail.com') then
    insert into public.admins (user_id)
    values (new.id)
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Invoices Timestamps & Sequence Numbering ────────────────────────────────
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

-- ── Invoice Quota Enforcement ───────────────────────────────────────────────
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
    return new; -- unlimited invoices
  end if;

  select count(*) into v_count
    from public.invoices
   where user_id = new.user_id
     and created_at::timestamptz >= date_trunc('month', now())
     and created_at::timestamptz < date_trunc('month', now()) + interval '1 month';

  if v_count >= v_limit then
    raise exception 'INVOICE_LIMIT_REACHED'
      using hint = 'Monthly invoice limit reached for the current plan.';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_invoice_quota_trg on public.invoices;
create trigger enforce_invoice_quota_trg
  before insert on public.invoices
  for each row execute function public.enforce_invoice_quota();

create or replace function public.my_invoice_quota()
returns table (invoice_limit integer, used integer)
language sql
security definer
stable
set search_path = ''
as $$
  select
    (select p.invoice_limit
       from public.subscriptions s
       join public.packages p on p.key = s.plan_key
      where s.user_id = (select auth.uid())
        and s.status = 'active'
        and s.expires_at > now()
      limit 1) as invoice_limit,
    (select count(*)::int
       from public.invoices
      where user_id = (select auth.uid())
        and created_at::timestamptz >= date_trunc('month', now())
        and created_at::timestamptz < date_trunc('month', now()) + interval '1 month') as used;
$$;

-- ── Payment Submission & Renewal ────────────────────────────────────────────
create or replace function public.submit_subscription_payment_v2(
  p_utr text,
  p_plan_key text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_price integer;
  v_duration integer;
  v_subscription public.subscriptions%rowtype;
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  if char_length(trim(coalesce(p_utr, ''))) not between 6 and 200 then
    raise exception 'INVALID_UTR';
  end if;

  select price_inr, coalesce(duration_months, 1)
    into v_price, v_duration
  from public.packages
  where key = p_plan_key and active = true;

  if not found then
    raise exception 'INVALID_PLAN';
  end if;

  insert into public.subscriptions (
    user_id, status, utr, amount, plan_key, plan_months,
    submitted_at, activated_at, expires_at, updated_at
  ) values (
    v_uid, 'pending', trim(p_utr), v_price, p_plan_key, coalesce(v_duration, 1),
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
       and (
         public.subscriptions.expires_at is null
         or public.subscriptions.expires_at <= now()
       )
     )
  returning * into v_subscription;

  if v_subscription.user_id is null then
    raise exception 'SUBSCRIPTION_NOT_RENEWABLE';
  end if;

  return to_jsonb(v_subscription);
end;
$$;

-- Backward compatibility alias
create or replace function public.submit_subscription_payment(
  p_utr text,
  p_plan_key text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.submit_subscription_payment_v2(p_utr, p_plan_key);
end;
$$;

-- ── Inventory Stock Adjustments ─────────────────────────────────────────────
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

-- ── Fabric Production Atomic Lot & Rolls Save ───────────────────────────────
create or replace function public.save_fabric_lot(
  p_id text,
  p_production_company text,
  p_party_name text,
  p_challan_number text,
  p_challan_date date,
  p_lot_number text,
  p_category text,
  p_quality text,
  p_shade text,
  p_variation text,
  p_construction text,
  p_width_inches numeric,
  p_gsm numeric,
  p_hsn_code text,
  p_rate_per_meter numeric,
  p_gst_rate numeric,
  p_status text,
  p_challan_file_path text,
  p_notes text,
  p_rolls jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  if jsonb_typeof(coalesce(p_rolls, '[]'::jsonb)) <> 'array' then
    raise exception 'ROLLS_MUST_BE_AN_ARRAY';
  end if;

  if coalesce(p_challan_file_path, '') <> ''
     and split_part(p_challan_file_path, '/', 1) <> v_uid::text then
    raise exception 'INVALID_CHALLAN_PATH';
  end if;

  insert into public.fabric_lots (
    id, user_id, production_company, party_name, challan_number,
    challan_date, lot_number, category, quality, shade, variation,
    construction, width_inches, gsm, hsn_code, rate_per_meter,
    gst_rate, status, challan_file_path, notes, updated_at
  )
  values (
    p_id, v_uid, trim(coalesce(p_production_company, '')),
    trim(coalesce(p_party_name, '')), trim(coalesce(p_challan_number, '')),
    p_challan_date, trim(coalesce(p_lot_number, '')),
    trim(coalesce(p_category, '')), trim(coalesce(p_quality, '')),
    trim(coalesce(p_shade, '')), trim(coalesce(p_variation, '')),
    trim(coalesce(p_construction, '')), p_width_inches, p_gsm,
    trim(coalesce(p_hsn_code, '')), coalesce(p_rate_per_meter, 0),
    coalesce(p_gst_rate, 0), p_status, coalesce(p_challan_file_path, ''),
    trim(coalesce(p_notes, '')), now()
  )
  on conflict (id) do update
    set production_company = excluded.production_company,
        party_name = excluded.party_name,
        challan_number = excluded.challan_number,
        challan_date = excluded.challan_date,
        lot_number = excluded.lot_number,
        category = excluded.category,
        quality = excluded.quality,
        shade = excluded.shade,
        variation = excluded.variation,
        construction = excluded.construction,
        width_inches = excluded.width_inches,
        gsm = excluded.gsm,
        hsn_code = excluded.hsn_code,
        rate_per_meter = excluded.rate_per_meter,
        gst_rate = excluded.gst_rate,
        status = excluded.status,
        challan_file_path = excluded.challan_file_path,
        notes = excluded.notes,
        updated_at = now()
    where public.fabric_lots.user_id = v_uid;

  if not found then
    raise exception 'FABRIC_LOT_NOT_FOUND_OR_FORBIDDEN';
  end if;

  delete from public.fabric_rolls
   where lot_id = p_id and user_id = v_uid;

  insert into public.fabric_rolls (
    id, lot_id, user_id, roll_number, meters, grade, shade_variation
  )
  select
    roll->>'id',
    p_id,
    v_uid,
    trim(coalesce(roll->>'rollNumber', '')),
    (roll->>'meters')::numeric,
    coalesce(nullif(roll->>'grade', ''), 'A'),
    trim(coalesce(roll->>'shadeVariation', ''))
  from jsonb_array_elements(coalesce(p_rolls, '[]'::jsonb)) as roll;
end;
$$;

-- ── Admin Provider Roster ───────────────────────────────────────────────────
create or replace function public.list_user_auth_providers()
returns table (user_id uuid, providers text[])
language plpgsql
security definer
stable
set search_path = ''
as $$
begin
  if not public.is_admin((select auth.uid())) then
    raise exception 'ADMIN_REQUIRED' using errcode = '42501';
  end if;

  return query
  select
    u.id as user_id,
    array(
      select distinct provider_name
      from (
        select jsonb_array_elements_text(
          coalesce(u.raw_app_meta_data -> 'providers', '[]'::jsonb)
        ) as provider_name
        union all
        select u.raw_app_meta_data ->> 'provider'
      ) provider_list
      where provider_name is not null and provider_name <> ''
      order by provider_name
    )::text[] as providers
  from auth.users u;
end;
$$;
