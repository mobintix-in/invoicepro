-- ============================================================================
-- 006 – Subscription packages (plans) + invoice-quota enforcement
--
-- Run in the Supabase SQL editor (or `supabase db push`) AFTER 002 (needs
-- is_admin()) and with the `invoices` table already present. Adds:
--   • packages          – editable plans shown on /welcome and picked at /subscribe
--   • subscriptions.plan_key – which package a user is on (null = legacy/unlimited)
--   • my_invoice_quota() – the current user's monthly invoice limit + usage
--   • a BEFORE INSERT trigger on invoices that enforces the monthly cap
-- Safe to re-run.
-- ============================================================================

create extension if not exists pgcrypto; -- gen_random_uuid()

-- ── packages ─────────────────────────────────────────────────────────────────
create table if not exists public.packages (
  id            uuid primary key default gen_random_uuid(),
  key           text unique not null,               -- stable id, e.g. 'monthly'
  name          text not null default '',
  price_inr     integer not null default 0,
  duration_months integer not null default 1,
  tagline       text not null default '',
  features      jsonb not null default '[]'::jsonb,  -- array of feature strings
  invoice_limit integer,                             -- null = unlimited (per month)
  cta           text not null default 'Get started',
  highlighted   boolean not null default false,
  sort_order    integer not null default 0,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.packages enable row level security;

-- Anyone (logged-out visitors included) can read active packages.
drop policy if exists "Anyone reads active packages" on public.packages;
create policy "Anyone reads active packages" on public.packages
  for select using (active = true);

-- Admins manage every package (including inactive ones).
drop policy if exists "Admins manage packages" on public.packages;
create policy "Admins manage packages" on public.packages
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- Seed the active launch plans (skipped if their keys already exist).
insert into public.packages (key, name, price_inr, duration_months, tagline, features, invoice_limit, cta, highlighted, sort_order, active) values
  ('monthly', '1 Month Plan', 299, 1, 'Flexible month-to-month access with all essentials.',
   '["Unlimited invoices & clients","GST-ready invoice templates","UPI QR code on every invoice","Professional PDF & thermal receipt export","Email & WhatsApp support"]'::jsonb,
   null, 'Get 1 Month Plan', false, 1, true),
  ('half-yearly', '6 Months Plan', 1499, 6, 'Great value for active businesses — Save ~16%.',
   '["Everything in Monthly plan","Save ₹295 compared to monthly","GST & HSN automatic calculations","Priority customer support","Data backup & multi-device sync"]'::jsonb,
   null, 'Get 6 Months Plan', true, 2, true),
  ('yearly', '1 Year Plan', 2699, 12, 'Best long-term value — Save ~25% (₹225 / month).',
   '["Everything in 6 Months plan","Save ₹889 compared to monthly","Custom business logo & watermark","Priority VIP support & early features","Full year uninterrupted invoicing"]'::jsonb,
   null, 'Get 1 Year Plan', false, 3, true)
on conflict (key) do nothing;

-- ── link a subscription to its plan ──────────────────────────────────────────
-- Nullable & no FK on purpose: legacy rows stay null (treated as unlimited), and
-- an admin can delete/rename a package without breaking existing subscriptions.
alter table public.subscriptions add column if not exists plan_key text;

-- ── quota: current user's monthly invoice limit and usage ────────────────────
create or replace function public.my_invoice_quota()
returns table (invoice_limit integer, used integer)
language sql security definer stable
set search_path = public as $$
  select
    (select p.invoice_limit
       from public.subscriptions s
       join public.packages p on p.key = s.plan_key
      where s.user_id = auth.uid()
        and s.status = 'active'
        and s.expires_at > now()
      limit 1) as invoice_limit,
    (select count(*)::int
       from public.invoices
      where user_id = auth.uid()
        and date_trunc('month', created_at::timestamptz) = date_trunc('month', now())) as used;
$$;

-- ── enforcement: block inserts once the monthly cap is reached ───────────────
create or replace function public.enforce_invoice_quota()
returns trigger language plpgsql security definer
set search_path = public as $$
declare
  v_limit integer;
  v_count integer;
begin
  -- The invoice_limit of the inserting user's active plan (null → unlimited).
  select p.invoice_limit into v_limit
    from public.subscriptions s
    join public.packages p on p.key = s.plan_key
   where s.user_id = new.user_id
     and s.status = 'active'
     and s.expires_at > now()
   limit 1;

  if v_limit is null then
    return new; -- no plan limit → unlimited
  end if;

  select count(*) into v_count
    from public.invoices
   where user_id = new.user_id
     and date_trunc('month', created_at::timestamptz) = date_trunc('month', now());

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
