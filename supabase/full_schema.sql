-- ============================================================================
-- full_schema.sql
-- InvoicePro – Complete Consolidated Database Schema & Security
--
-- Can be run in full in the Supabase SQL Editor.
-- Safe to re-run (idempotent with CREATE IF NOT EXISTS / ON CONFLICT).
-- ============================================================================

-- ============================================================================
-- PART 1: EXTENSIONS, SCHEMAS & TABLES
-- ============================================================================

create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- Admins
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

-- Auto-seed recognized administrators if they already exist in auth.users
insert into public.admins (user_id)
select id from auth.users
where lower(email) in ('aryanbhimani0011@gmail.com')
on conflict (user_id) do nothing;

-- Packages
create table if not exists public.packages (
  id              uuid primary key default gen_random_uuid(),
  key             text unique not null,
  name            text not null default '',
  price_inr       integer not null default 0,
  duration_months integer not null default 1 check (duration_months >= 1),
  tagline         text not null default '',
  features        jsonb not null default '[]'::jsonb,
  invoice_limit   integer check (invoice_limit is null or invoice_limit > 0),
  cta             text not null default 'Get started',
  highlighted     boolean not null default false,
  sort_order      integer not null default 0,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Profiles
create table if not exists public.profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  full_name             text not null default '',
  phone                 text not null default '',
  company_name          text not null default '',
  email                 text not null default '',
  business_name         text not null default '',
  address               text not null default '',
  gstin                 text not null default '',
  state_name            text not null default '',
  state_code            text not null default '',
  pan                   text not null default '',
  bank_account_name     text not null default '',
  bank_name             text not null default '',
  account_number        text not null default '',
  ifsc_code             text not null default '',
  bank_branch           text not null default '',
  jurisdiction          text not null default '',
  terms_conditions      text not null default '',
  default_invoice_notes text not null default '',
  upi_id                text not null default '',
  invoice_theme         text not null default 'indigo',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Subscriptions
create table if not exists public.subscriptions (
  user_id      uuid primary key references public.profiles(id) on delete cascade,
  status       text not null default 'pending'
                 check (status in ('pending', 'active', 'rejected', 'expired')),
  utr          text,
  amount       numeric,
  plan_key     text not null references public.packages(key) on update cascade on delete restrict,
  plan_months  integer not null default 1 check (plan_months >= 1),
  submitted_at timestamptz,
  activated_at timestamptz,
  expires_at   timestamptz,
  updated_at   timestamptz not null default now()
);

create index if not exists subscriptions_plan_key_idx on public.subscriptions (plan_key);

-- Clients
create table if not exists public.clients (
  id          text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null default '',
  email       text not null default '',
  phone       text not null default '',
  address     text not null default '',
  gstin       text not null default '',
  state_name  text not null default '',
  state_code  text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists clients_user_id_idx on public.clients (user_id);

-- Inventory Items
create table if not exists public.inventory_items (
  id             text primary key,
  user_id        uuid not null references auth.users(id) on delete cascade,
  name           text not null default '',
  sku            text not null default '',
  description    text not null default '',
  hsn_code       text not null default '',
  unit           text not null default '',
  quantity       numeric not null default 0 check (quantity >= 0),
  reorder_level  numeric not null default 0,
  unit_price     numeric not null default 0 check (unit_price >= 0),
  gst_rate       numeric not null default 0 check (gst_rate between 0 and 100),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists inventory_items_user_id_idx on public.inventory_items (user_id);

-- Invoices
create table if not exists public.invoices (
  id                text primary key,
  user_id           uuid not null references auth.users(id) on delete cascade,
  invoice_number    text not null,
  status            text not null default 'draft'
                      check (status in ('draft', 'sent', 'paid', 'overdue')),
  issue_date        date not null,
  due_date          date not null,
  from_party        jsonb not null default '{}'::jsonb,
  to_party          jsonb not null default '{}'::jsonb,
  line_items        jsonb not null default '[]'::jsonb,
  notes             text not null default '',
  tax_rate          numeric not null default 0 check (tax_rate >= 0),
  subtotal          numeric not null default 0 check (subtotal >= 0),
  tax               numeric not null default 0 check (tax >= 0),
  total             numeric not null default 0 check (total >= 0),
  template          text not null default 'classic',
  seller_pan        text not null default '',
  bank_account_name text not null default '',
  bank_name         text not null default '',
  account_number    text not null default '',
  ifsc_code         text not null default '',
  bank_branch       text not null default '',
  jurisdiction      text not null default '',
  gst_type          text not null default 'cgst_sgst'
                      check (gst_type in ('cgst_sgst', 'igst')),
  delivery_note     text not null default '',
  buyer_order_no    text not null default '',
  dispatch_through  text not null default '',
  destination       text not null default '',
  upi_id            text not null default '',
  invoice_theme     text not null default 'indigo',
  order_id          text,
  challan_no        text not null default '',
  lot_no            text not null default '',
  design_no         text not null default '',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create unique index if not exists invoices_user_number_unique_idx
  on public.invoices (user_id, invoice_number);
create index if not exists invoices_user_created_idx
  on public.invoices (user_id, created_at desc);

-- Fabric Production Lots & Rolls
create table if not exists public.fabric_lots (
  id                  text primary key check (length(id) > 0),
  user_id             uuid not null references auth.users(id) on delete cascade,
  production_company  text not null default '',
  party_name          text not null default '',
  challan_number      text not null default '',
  challan_date        date,
  lot_number          text not null default '',
  category            text not null default '',
  quality             text not null default '',
  shade               text not null default '',
  variation           text not null default '',
  construction        text not null default '',
  width_inches        numeric(8, 2) check (width_inches is null or width_inches > 0),
  gsm                 numeric(8, 2) check (gsm is null or gsm > 0),
  hsn_code            text not null default '',
  rate_per_meter      numeric(14, 2) not null default 0 check (rate_per_meter >= 0),
  gst_rate            numeric(5, 2) not null default 0 check (gst_rate between 0 and 100),
  status              text not null default 'inward'
    check (status in ('inward', 'in_production', 'completed', 'dispatched')),
  challan_file_path   text not null default '',
  notes               text not null default '',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (id, user_id)
);

create index if not exists fabric_lots_user_updated_idx
  on public.fabric_lots (user_id, updated_at desc);
create index if not exists fabric_lots_user_lot_idx
  on public.fabric_lots (user_id, lot_number);

create table if not exists public.fabric_rolls (
  id               text primary key check (length(id) > 0),
  lot_id           text not null,
  user_id          uuid not null,
  roll_number      text not null default '',
  meters           numeric(12, 2) not null check (meters > 0),
  grade            text not null default 'A'
    check (grade in ('A', 'B', 'C', 'rejected')),
  shade_variation  text not null default '',
  created_at       timestamptz not null default now(),
  constraint fabric_rolls_lot_owner_fkey
    foreign key (lot_id, user_id)
    references public.fabric_lots(id, user_id)
    on delete cascade
);

create index if not exists fabric_rolls_lot_idx on public.fabric_rolls (lot_id);
create index if not exists fabric_rolls_user_idx on public.fabric_rolls (user_id);

-- Real-Time Sessions & Page Views
create table if not exists public.sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete cascade,
  started_at       timestamptz not null default now(),
  last_seen_at     timestamptz not null default now(),
  is_new           boolean not null default true,
  country          text default 'India',
  country_code     text default 'IN',
  city             text default 'Mumbai',
  latitude         double precision default 19.0760,
  longitude        double precision default 72.8777,
  entry_path       text not null default '/',
  exit_path        text not null default '/',
  duration_seconds integer not null default 0,
  page_view_count  integer not null default 1,
  referrer         text default '',
  device_type      text default 'desktop',
  browser          text default 'Chrome',
  os               text default 'Windows',
  utm_source       text default '',
  utm_medium       text default '',
  utm_campaign     text default ''
);

create index if not exists sessions_last_seen_idx on public.sessions (last_seen_at desc);

create table if not exists public.page_views (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.sessions(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete cascade,
  path        text not null,
  action_name text default '',
  viewed_at   timestamptz not null default now()
);

create index if not exists page_views_session_idx on public.page_views (session_id, viewed_at desc);
create index if not exists page_views_viewed_at_idx on public.page_views (viewed_at desc);

-- Private Sequence Counters
create table if not exists private.invoice_counters (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  last_number integer not null check (last_number > 0)
);

-- ============================================================================
-- PART 2: FUNCTIONS & TRIGGERS
-- ============================================================================

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

-- ============================================================================
-- PART 3: SECURITY, RLS & STORAGE
-- ============================================================================

alter table public.admins          enable row level security;
alter table public.packages        enable row level security;
alter table public.profiles        enable row level security;
alter table public.subscriptions   enable row level security;
alter table public.clients         enable row level security;
alter table public.inventory_items enable row level security;
alter table public.invoices        enable row level security;
alter table public.fabric_lots     enable row level security;
alter table public.fabric_rolls    enable row level security;
alter table public.sessions        enable row level security;
alter table public.page_views      enable row level security;

-- Profiles Policies
drop policy if exists "Users read own profile"   on public.profiles;
drop policy if exists "Users insert own profile" on public.profiles;
drop policy if exists "Users update own profile" on public.profiles;
drop policy if exists "Admins read all profiles" on public.profiles;

create policy "Users read own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users insert own profile"
  on public.profiles for insert with check (auth.uid() = id);
create policy "Users update own profile"
  on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "Admins read all profiles"
  on public.profiles for select using (public.is_admin(auth.uid()));

-- Packages Policies
drop policy if exists "Anyone reads active packages" on public.packages;
drop policy if exists "Admins manage packages"       on public.packages;

create policy "Anyone reads active packages"
  on public.packages for select using (active = true);
create policy "Admins manage packages"
  on public.packages for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- Subscriptions Policies
drop policy if exists "Users read own subscription" on public.subscriptions;
drop policy if exists "Admins manage subscriptions" on public.subscriptions;

create policy "Users read own subscription"
  on public.subscriptions for select using (auth.uid() = user_id);
create policy "Admins manage subscriptions"
  on public.subscriptions for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- Invoices Policies (Paywall Gated)
drop policy if exists "Subscribed users manage own invoices" on public.invoices;

create policy "Subscribed users manage own invoices"
  on public.invoices for all
  using (auth.uid() = user_id and public.has_active_subscription(auth.uid()))
  with check (auth.uid() = user_id and public.has_active_subscription(auth.uid()));

-- Clients Policies (Paywall Gated)
drop policy if exists "Subscribed users manage own clients" on public.clients;

create policy "Subscribed users manage own clients"
  on public.clients for all
  using (auth.uid() = user_id and public.has_active_subscription(auth.uid()))
  with check (auth.uid() = user_id and public.has_active_subscription(auth.uid()));

-- Inventory Policies (Paywall Gated)
drop policy if exists "Subscribed users manage own inventory" on public.inventory_items;

create policy "Subscribed users manage own inventory"
  on public.inventory_items for all
  using (auth.uid() = user_id and public.has_active_subscription(auth.uid()))
  with check (auth.uid() = user_id and public.has_active_subscription(auth.uid()));

-- Fabric Lots Policies
drop policy if exists "Users read own fabric lots"   on public.fabric_lots;
drop policy if exists "Users create own fabric lots" on public.fabric_lots;
drop policy if exists "Users update own fabric lots" on public.fabric_lots;
drop policy if exists "Users delete own fabric lots" on public.fabric_lots;

create policy "Users read own fabric lots"
  on public.fabric_lots for select to authenticated
  using ((select auth.uid()) = user_id and public.has_active_subscription((select auth.uid())));
create policy "Users create own fabric lots"
  on public.fabric_lots for insert to authenticated
  with check ((select auth.uid()) = user_id and public.has_active_subscription((select auth.uid())));
create policy "Users update own fabric lots"
  on public.fabric_lots for update to authenticated
  using ((select auth.uid()) = user_id and public.has_active_subscription((select auth.uid())))
  with check ((select auth.uid()) = user_id and public.has_active_subscription((select auth.uid())));
create policy "Users delete own fabric lots"
  on public.fabric_lots for delete to authenticated
  using ((select auth.uid()) = user_id and public.has_active_subscription((select auth.uid())));

-- Fabric Rolls Policies
drop policy if exists "Users read own fabric rolls"   on public.fabric_rolls;
drop policy if exists "Users create own fabric rolls" on public.fabric_rolls;
drop policy if exists "Users update own fabric rolls" on public.fabric_rolls;
drop policy if exists "Users delete own fabric rolls" on public.fabric_rolls;

create policy "Users read own fabric rolls"
  on public.fabric_rolls for select to authenticated
  using ((select auth.uid()) = user_id and public.has_active_subscription((select auth.uid())));
create policy "Users create own fabric rolls"
  on public.fabric_rolls for insert to authenticated
  with check ((select auth.uid()) = user_id and public.has_active_subscription((select auth.uid())));
create policy "Users update own fabric rolls"
  on public.fabric_rolls for update to authenticated
  using ((select auth.uid()) = user_id and public.has_active_subscription((select auth.uid())))
  with check ((select auth.uid()) = user_id and public.has_active_subscription((select auth.uid())));
create policy "Users delete own fabric rolls"
  on public.fabric_rolls for delete to authenticated
  using ((select auth.uid()) = user_id and public.has_active_subscription((select auth.uid())));

-- Sessions & Page Views Policies
drop policy if exists "Anyone can insert sessions" on public.sessions;
drop policy if exists "Anyone can update sessions" on public.sessions;
drop policy if exists "Anyone can select sessions" on public.sessions;

create policy "Anyone can insert sessions" on public.sessions for insert with check (true);
create policy "Anyone can update sessions" on public.sessions for update using (true);
create policy "Anyone can select sessions" on public.sessions for select using (true);

drop policy if exists "Anyone can insert page views" on public.page_views;
drop policy if exists "Anyone can select page views" on public.page_views;

create policy "Anyone can insert page views" on public.page_views for insert with check (true);
create policy "Anyone can select page views" on public.page_views for select using (true);

-- Storage Setup
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'fabric-challans',
  'fabric-challans',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users read own fabric challans"   on storage.objects;
drop policy if exists "Users upload own fabric challans" on storage.objects;
drop policy if exists "Users update own fabric challans" on storage.objects;
drop policy if exists "Users delete own fabric challans" on storage.objects;

create policy "Users read own fabric challans"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'fabric-challans'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.has_active_subscription((select auth.uid()))
  );

create policy "Users upload own fabric challans"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'fabric-challans'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.has_active_subscription((select auth.uid()))
  );

create policy "Users update own fabric challans"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'fabric-challans'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.has_active_subscription((select auth.uid()))
  )
  with check (
    bucket_id = 'fabric-challans'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.has_active_subscription((select auth.uid()))
  );

create policy "Users delete own fabric challans"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'fabric-challans'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.has_active_subscription((select auth.uid()))
  );

-- Grants & Permissions
grant select, insert, update, delete on public.profiles        to authenticated;
grant select, insert, update         on public.subscriptions   to authenticated;
grant select, insert, update, delete on public.invoices        to authenticated;
grant select, insert, update, delete on public.clients         to authenticated;
grant select, insert, update, delete on public.inventory_items to authenticated;
grant select, insert, update, delete on public.fabric_lots     to authenticated;
grant select, insert, update, delete on public.fabric_rolls    to authenticated;
grant select, insert, update         on public.sessions        to anon, authenticated;
grant select, insert                 on public.page_views      to anon, authenticated;
grant select                         on public.packages        to anon, authenticated;
grant insert, update, delete         on public.packages        to authenticated;

revoke execute on function public.is_admin(uuid) from public;
grant  execute on function public.is_admin(uuid) to anon, authenticated;

revoke execute on function public.has_active_subscription(uuid) from public, anon;
grant  execute on function public.has_active_subscription(uuid) to authenticated;

revoke execute on function public.my_access() from public, anon;
grant  execute on function public.my_access() to authenticated;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_invoice_timestamps() from public, anon, authenticated;
revoke execute on function public.enforce_invoice_quota() from public, anon, authenticated;

revoke execute on function public.my_invoice_quota() from public, anon;
grant  execute on function public.my_invoice_quota() to authenticated;

revoke execute on function public.next_invoice_number() from public, anon;
grant  execute on function public.next_invoice_number() to authenticated;

revoke execute on function public.submit_subscription_payment_v2(text, text) from public, anon;
grant  execute on function public.submit_subscription_payment_v2(text, text) to authenticated;

revoke execute on function public.submit_subscription_payment(text, text) from public, anon;
grant  execute on function public.submit_subscription_payment(text, text) to authenticated;

revoke execute on function public.adjust_inventory_stock(text, numeric) from public, anon;
grant  execute on function public.adjust_inventory_stock(text, numeric) to authenticated;

revoke execute on function public.save_fabric_lot(
  text, text, text, text, date, text, text, text, text, text, text,
  numeric, numeric, text, numeric, numeric, text, text, text, jsonb
) from public, anon;
grant  execute on function public.save_fabric_lot(
  text, text, text, text, date, text, text, text, text, text, text,
  numeric, numeric, text, numeric, numeric, text, text, text, jsonb
) to authenticated;

revoke execute on function public.list_user_auth_providers() from public, anon;
grant  execute on function public.list_user_auth_providers() to authenticated;

-- ============================================================================
-- PART 4: SEED PACKAGES
-- ============================================================================

insert into public.packages (
  key, name, price_inr, duration_months, tagline, features,
  invoice_limit, cta, highlighted, sort_order, active
) values
  ('monthly', '1 Month Plan', 299, 1,
   'Flexible month-to-month access with all essentials.',
   '["Unlimited invoices & clients","GST-ready invoice templates","UPI QR code on every invoice","Professional PDF & thermal receipt export","Email & WhatsApp support"]'::jsonb,
   null, 'Get 1 Month Plan', false, 1, true),

  ('half-yearly', '6 Months Plan', 1499, 6,
   'Great value for active businesses — Save ~16%.',
   '["Everything in Monthly plan","Save ₹295 compared to monthly","GST & HSN automatic calculations","Priority customer support","Data backup & multi-device sync"]'::jsonb,
   null, 'Get 6 Months Plan', true, 2, true),

  ('yearly', '1 Year Plan', 2699, 12,
   'Best long-term value — Save ~25% (₹225 / month).',
   '["Everything in 6 Months plan","Save ₹889 compared to monthly","Custom business logo & watermark","Priority VIP support & early features","Full year uninterrupted invoicing"]'::jsonb,
   null, 'Get 1 Year Plan', false, 3, true)

on conflict (key) do update
  set name            = excluded.name,
      price_inr       = excluded.price_inr,
      duration_months = excluded.duration_months,
      tagline         = excluded.tagline,
      features        = excluded.features,
      invoice_limit   = excluded.invoice_limit,
      cta             = excluded.cta,
      highlighted     = excluded.highlighted,
      sort_order      = excluded.sort_order,
      active          = excluded.active;

-- Auto-seed recognized administrators if they already exist in auth.users
insert into public.admins (user_id)
select id from auth.users
where lower(email) in ('aryanbhimani0011@gmail.com')
on conflict (user_id) do nothing;
