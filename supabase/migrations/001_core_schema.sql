-- ============================================================================
-- 001_core_schema.sql
-- InvoicePro – Core Database Schema
--
-- Tables:
--   • admins                  – Whitelist of administrator user IDs
--   • packages                – Subscription tiers / plans
--   • profiles                – Extended user profile, business, & tax details
--   • subscriptions           – User subscription records & payment status
--   • clients                 – Customer address book (Bill-To details)
--   • inventory_items         – Product & service catalog with stock tracking
--   • invoices                – GST / Tax invoices with items & payment details
--   • fabric_lots             – Textile manufacturing batch tracking
--   • fabric_rolls            – Individual fabric roll items per lot
--   • sessions                – Real-time storefront & user tracking sessions
--   • page_views              – Individual page analytics
--   • private.invoice_counters– Sequential invoice number generator
-- ============================================================================

-- ── Extensions & Private Schema ─────────────────────────────────────────────
create extension if not exists pgcrypto; -- gen_random_uuid()

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- ── Admins ──────────────────────────────────────────────────────────────────
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

-- Auto-seed recognized administrators if they already exist in auth.users
insert into public.admins (user_id)
select id from auth.users
where lower(email) in ('aryanbhimani0011@gmail.com')
on conflict (user_id) do nothing;

-- ── Packages (Subscription Plans) ───────────────────────────────────────────
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

-- ── Profiles ────────────────────────────────────────────────────────────────
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

-- ── Subscriptions ───────────────────────────────────────────────────────────
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

-- ── Clients ─────────────────────────────────────────────────────────────────
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

-- ── Inventory Items ─────────────────────────────────────────────────────────
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

-- ── Invoices ────────────────────────────────────────────────────────────────
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

-- ── Fabric Production Lots & Rolls ──────────────────────────────────────────
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

-- ── Real-Time Live Sessions & Page Views ────────────────────────────────────
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

-- ── Private Invoice Sequence Counters ───────────────────────────────────────
create table if not exists private.invoice_counters (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  last_number integer not null check (last_number > 0)
);
