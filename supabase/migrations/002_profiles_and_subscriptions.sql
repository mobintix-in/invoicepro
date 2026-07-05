-- ============================================================================
-- 002 – Accounts, subscriptions, and paywall enforcement
--
-- Run this in the Supabase SQL editor (or `supabase db push`) AFTER 001.
-- It adds:
--   • profiles      – extra signup fields (full name, phone, company)
--   • subscriptions – one row per user; manual-approval (UTR) flow
--   • admins        – whitelist of users allowed to approve payments
--   • helper fns    – is_admin(), has_active_subscription(), my_access()
--   • a trigger that auto-creates a profile from signup metadata
--   • an UPDATED invoices RLS policy that ALSO requires an active subscription
-- ============================================================================

-- ── profiles ────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  full_name    text not null default '',
  phone        text not null default '',
  company_name text not null default '',
  email        text not null default '',
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users read own profile"   on public.profiles;
drop policy if exists "Users insert own profile" on public.profiles;
drop policy if exists "Users update own profile" on public.profiles;
create policy "Users read own profile"   on public.profiles for select using (auth.uid() = id);
create policy "Users insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
-- (An "Admins read all profiles" policy is added just after is_admin() is defined.)

-- Backfill profiles for users who signed up BEFORE this migration/trigger
-- existed. subscriptions.user_id references profiles(id), so without this those
-- users could never submit a payment.
insert into public.profiles (id, email)
select id, coalesce(email, '') from auth.users
on conflict (id) do nothing;

-- ── admins ──────────────────────────────────────────────────────────────────
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admins enable row level security;
-- (No client policies: the table is only read via the security-definer is_admin()
--  function below, so regular users can never enumerate or modify admins.)

create or replace function public.is_admin(uid uuid)
returns boolean language sql security definer stable
set search_path = public as $$
  select exists (select 1 from public.admins where user_id = uid);
$$;

-- Admins can read every profile (powers the /admin review table).
drop policy if exists "Admins read all profiles" on public.profiles;
create policy "Admins read all profiles" on public.profiles
  for select using (public.is_admin(auth.uid()));

-- ── subscriptions ───────────────────────────────────────────────────────────
create table if not exists public.subscriptions (
  user_id      uuid primary key references public.profiles(id) on delete cascade,
  status       text not null default 'pending'
                 check (status in ('pending', 'active', 'rejected', 'expired')),
  utr          text,
  amount       numeric,
  plan_months  integer not null default 1,
  submitted_at timestamptz,
  activated_at timestamptz,
  expires_at   timestamptz,
  updated_at   timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

drop policy if exists "Users read own subscription"     on public.subscriptions;
drop policy if exists "Users submit own subscription"   on public.subscriptions;
drop policy if exists "Users resubmit own subscription" on public.subscriptions;
drop policy if exists "Admins manage subscriptions"     on public.subscriptions;

-- Users can read their own subscription.
create policy "Users read own subscription" on public.subscriptions
  for select using (auth.uid() = user_id);

-- Users can submit a payment for themselves, but ONLY as a pending request —
-- the WITH CHECK forbids self-activation.
create policy "Users submit own subscription" on public.subscriptions
  for insert with check (
    auth.uid() = user_id
    and status = 'pending'
    and activated_at is null
    and expires_at is null
  );

-- Users may re-submit only when previously rejected/expired, and only back to
-- 'pending'. They can never move a row to 'active' themselves.
create policy "Users resubmit own subscription" on public.subscriptions
  for update
  using (auth.uid() = user_id and status in ('rejected', 'expired'))
  with check (auth.uid() = user_id and status = 'pending' and activated_at is null);

-- Admins can do anything (approve = set status/activated_at/expires_at).
create policy "Admins manage subscriptions" on public.subscriptions
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ── access helpers ──────────────────────────────────────────────────────────
create or replace function public.has_active_subscription(uid uuid)
returns boolean language sql security definer stable
set search_path = public as $$
  select exists (
    select 1 from public.subscriptions
    where user_id = uid and status = 'active' and expires_at > now()
  );
$$;

-- One round-trip for the middleware gate: am I an admin, and am I active?
create or replace function public.my_access()
returns table (is_admin boolean, is_active boolean)
language sql security definer stable
set search_path = public as $$
  select public.is_admin(auth.uid()), public.has_active_subscription(auth.uid());
$$;

-- ── auto-create profile from signup metadata ────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone, company_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.raw_user_meta_data ->> 'company_name', ''),
    coalesce(new.email, '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── PAYWALL: invoices now require an active subscription ─────────────────────
-- Replaces the 001 policy. Without an active subscription a user can no longer
-- read or write ANY invoice — enforced at the database, not just the UI.
drop policy if exists "Users manage own invoices" on public.invoices;
drop policy if exists "Subscribed users manage own invoices" on public.invoices;
create policy "Subscribed users manage own invoices" on public.invoices
  for all
  using  (auth.uid() = user_id and public.has_active_subscription(auth.uid()))
  with check (auth.uid() = user_id and public.has_active_subscription(auth.uid()));

-- ============================================================================
-- ONE-TIME SETUP (edit the email, then run):
--
--   -- 1. Make yourself an admin so you can approve payments at /admin:
--   insert into public.admins (user_id)
--   select id from auth.users where email = 'you@example.com'
--   on conflict do nothing;
--
--   -- 2. (Optional) grant yourself an active subscription for testing:
--   insert into public.subscriptions (user_id, status, activated_at, expires_at)
--   select id, 'active', now(), now() + interval '1 month'
--   from auth.users where email = 'you@example.com'
--   on conflict (user_id) do update
--     set status = 'active', activated_at = now(), expires_at = now() + interval '1 month';
-- ============================================================================
