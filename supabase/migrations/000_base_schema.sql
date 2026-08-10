-- Base tables required by the numbered feature migrations.
-- This file sorts before 001 so a clean database needs no out-of-band setup.

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

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
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists invoices_user_created_idx
  on public.invoices (user_id, created_at desc);

alter table public.admins enable row level security;
alter table public.invoices enable row level security;

grant select, insert, update, delete on public.invoices to authenticated;
