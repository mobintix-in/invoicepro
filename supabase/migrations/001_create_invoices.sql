-- Invoices table
create table public.invoices (
  id           text primary key,
  user_id      uuid references auth.users(id) on delete cascade not null,
  invoice_number text not null,
  status       text not null check (status in ('draft', 'sent', 'paid', 'overdue')),
  issue_date   text not null,
  due_date     text not null,
  from_party   jsonb not null default '{}',
  to_party     jsonb not null default '{}',
  line_items   jsonb not null default '[]',
  notes        text not null default '',
  tax_rate     numeric not null default 0,
  subtotal     numeric not null default 0,
  tax          numeric not null default 0,
  total        numeric not null default 0,
  created_at   text not null,
  updated_at   text not null
);

-- Row-level security: each user sees only their own invoices
alter table public.invoices enable row level security;

create policy "Users manage own invoices"
  on public.invoices
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
