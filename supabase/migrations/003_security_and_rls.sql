-- ============================================================================
-- 003_security_and_rls.sql
-- InvoicePro – Row-Level Security (RLS), Permissions, & Storage Policies
--
-- Security Model:
--   • Hard paywall enforcement at the DB level via has_active_subscription()
--   • Tenant isolation: users can strictly only view & edit their own records
--   • Search path injection prevention: SET search_path = '' on all SECURITY DEFINER
--   • Least privilege: granular GRANT / REVOKE on tables and RPC procedures
--   • Private schema for sensitive counters and internal mechanics
-- ============================================================================

-- ── Enable Row-Level Security ───────────────────────────────────────────────
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

-- ── Profiles RLS ────────────────────────────────────────────────────────────
drop policy if exists "Users read own profile"   on public.profiles;
drop policy if exists "Users insert own profile" on public.profiles;
drop policy if exists "Users update own profile" on public.profiles;
drop policy if exists "Admins read all profiles" on public.profiles;

create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Admins read all profiles"
  on public.profiles for select
  using (public.is_admin(auth.uid()));

-- ── Packages RLS ────────────────────────────────────────────────────────────
drop policy if exists "Anyone reads active packages" on public.packages;
drop policy if exists "Admins manage packages"       on public.packages;

create policy "Anyone reads active packages"
  on public.packages for select
  using (active = true);

create policy "Admins manage packages"
  on public.packages for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ── Subscriptions RLS ───────────────────────────────────────────────────────
drop policy if exists "Users read own subscription" on public.subscriptions;
drop policy if exists "Admins manage subscriptions" on public.subscriptions;

create policy "Users read own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "Admins manage subscriptions"
  on public.subscriptions for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ── Invoices RLS (Paywall Gated) ─────────────────────────────────────────────
drop policy if exists "Subscribed users manage own invoices" on public.invoices;

create policy "Subscribed users manage own invoices"
  on public.invoices for all
  using (
    auth.uid() = user_id
    and public.has_active_subscription(auth.uid())
  )
  with check (
    auth.uid() = user_id
    and public.has_active_subscription(auth.uid())
  );

-- ── Clients RLS (Paywall Gated) ──────────────────────────────────────────────
drop policy if exists "Subscribed users manage own clients" on public.clients;

create policy "Subscribed users manage own clients"
  on public.clients for all
  using (
    auth.uid() = user_id
    and public.has_active_subscription(auth.uid())
  )
  with check (
    auth.uid() = user_id
    and public.has_active_subscription(auth.uid())
  );

-- ── Inventory RLS (Paywall Gated) ───────────────────────────────────────────
drop policy if exists "Subscribed users manage own inventory" on public.inventory_items;

create policy "Subscribed users manage own inventory"
  on public.inventory_items for all
  using (
    auth.uid() = user_id
    and public.has_active_subscription(auth.uid())
  )
  with check (
    auth.uid() = user_id
    and public.has_active_subscription(auth.uid())
  );

-- ── Fabric Production RLS (Paywall Gated) ───────────────────────────────────
drop policy if exists "Users read own fabric lots"   on public.fabric_lots;
drop policy if exists "Users create own fabric lots" on public.fabric_lots;
drop policy if exists "Users update own fabric lots" on public.fabric_lots;
drop policy if exists "Users delete own fabric lots" on public.fabric_lots;

create policy "Users read own fabric lots"
  on public.fabric_lots for select to authenticated
  using (
    (select auth.uid()) = user_id
    and public.has_active_subscription((select auth.uid()))
  );

create policy "Users create own fabric lots"
  on public.fabric_lots for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and public.has_active_subscription((select auth.uid()))
  );

create policy "Users update own fabric lots"
  on public.fabric_lots for update to authenticated
  using (
    (select auth.uid()) = user_id
    and public.has_active_subscription((select auth.uid()))
  )
  with check (
    (select auth.uid()) = user_id
    and public.has_active_subscription((select auth.uid()))
  );

create policy "Users delete own fabric lots"
  on public.fabric_lots for delete to authenticated
  using (
    (select auth.uid()) = user_id
    and public.has_active_subscription((select auth.uid()))
  );

drop policy if exists "Users read own fabric rolls"   on public.fabric_rolls;
drop policy if exists "Users create own fabric rolls" on public.fabric_rolls;
drop policy if exists "Users update own fabric rolls" on public.fabric_rolls;
drop policy if exists "Users delete own fabric rolls" on public.fabric_rolls;

create policy "Users read own fabric rolls"
  on public.fabric_rolls for select to authenticated
  using (
    (select auth.uid()) = user_id
    and public.has_active_subscription((select auth.uid()))
  );

create policy "Users create own fabric rolls"
  on public.fabric_rolls for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and public.has_active_subscription((select auth.uid()))
  );

create policy "Users update own fabric rolls"
  on public.fabric_rolls for update to authenticated
  using (
    (select auth.uid()) = user_id
    and public.has_active_subscription((select auth.uid()))
  )
  with check (
    (select auth.uid()) = user_id
    and public.has_active_subscription((select auth.uid()))
  );

create policy "Users delete own fabric rolls"
  on public.fabric_rolls for delete to authenticated
  using (
    (select auth.uid()) = user_id
    and public.has_active_subscription((select auth.uid()))
  );

-- ── Live Sessions & Page Views RLS ──────────────────────────────────────────
drop policy if exists "Anyone can insert sessions"   on public.sessions;
drop policy if exists "Anyone can update sessions"   on public.sessions;
drop policy if exists "Anyone can select sessions"   on public.sessions;

create policy "Anyone can insert sessions" on public.sessions for insert with check (true);
create policy "Anyone can update sessions" on public.sessions for update using (true);
create policy "Anyone can select sessions" on public.sessions for select using (true);

drop policy if exists "Anyone can insert page views" on public.page_views;
drop policy if exists "Anyone can select page views" on public.page_views;

create policy "Anyone can insert page views" on public.page_views for insert with check (true);
create policy "Anyone can select page views" on public.page_views for select using (true);

-- ── Storage Bucket Configuration & Policies ─────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'fabric-challans',
  'fabric-challans',
  false,
  10485760, -- 10MB
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

-- ── Grants & Revocations ────────────────────────────────────────────────────
-- Table privileges
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

-- Function privileges
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
