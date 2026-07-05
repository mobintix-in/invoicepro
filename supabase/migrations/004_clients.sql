-- ============================================================================
-- 004 – Clients (saved customers)
--
-- A per-user address book of clients, reused as the "Bill To" side of invoices.
-- Gated behind an active subscription, just like invoices. Safe to re-run.
-- ============================================================================

create table if not exists public.clients (
  id          text primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null default '',
  email       text not null default '',
  address     text not null default '',
  phone       text not null default '',
  gstin       text not null default '',
  state_name  text not null default '',
  state_code  text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists clients_user_id_idx on public.clients (user_id);

alter table public.clients enable row level security;

drop policy if exists "Subscribed users manage own clients" on public.clients;
create policy "Subscribed users manage own clients" on public.clients
  for all
  using  (auth.uid() = user_id and public.has_active_subscription(auth.uid()))
  with check (auth.uid() = user_id and public.has_active_subscription(auth.uid()));
