-- ============================================================================
-- 008 – Inventory (stock items / product catalog)
--
-- A per-user catalog of products & services with stock tracking, reused as the
-- line items on invoices. Gated behind an active subscription, just like
-- clients and invoices. Safe to re-run.
-- ============================================================================

create table if not exists public.inventory_items (
  id             text primary key,
  user_id        uuid references auth.users(id) on delete cascade not null,
  name           text not null default '',
  sku            text not null default '',
  description    text not null default '',
  hsn_code       text not null default '',
  unit           text not null default '',
  quantity       numeric not null default 0,
  reorder_level  numeric not null default 0,
  unit_price     numeric not null default 0,
  gst_rate       numeric not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists inventory_items_user_id_idx on public.inventory_items (user_id);

alter table public.inventory_items enable row level security;

drop policy if exists "Subscribed users manage own inventory" on public.inventory_items;
create policy "Subscribed users manage own inventory" on public.inventory_items
  for all
  using  (auth.uid() = user_id and public.has_active_subscription(auth.uid()))
  with check (auth.uid() = user_id and public.has_active_subscription(auth.uid()));
