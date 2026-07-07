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
  key           text unique not null,               -- stable id, e.g. 'starter'
  name          text not null default '',
  price_inr     integer not null default 0,
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

-- Seed the three launch plans (skipped if their keys already exist).
insert into public.packages (key, name, price_inr, tagline, features, invoice_limit, cta, highlighted, sort_order) values
  ('starter', 'Starter', 299, 'For freelancers & solo founders getting started.',
   '["Up to 50 invoices / month","Professional PDF export","UPI QR on every invoice","Single user","Email support"]'::jsonb,
   50, 'Start with Starter', false, 1),
  ('business', 'Business', 799, 'For growing teams that bill clients every day.',
   '["Unlimited invoices","GST-ready invoice templates","Client & contact management","Up to 5 team members","Priority support"]'::jsonb,
   null, 'Choose Business', true, 2),
  ('enterprise', 'Enterprise', 1999, 'For established companies that need control & scale.',
   '["Everything in Business","Unlimited team members","Custom branding & templates","Dedicated account manager","API & webhook access"]'::jsonb,
   null, 'Talk to sales', false, 3)
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
