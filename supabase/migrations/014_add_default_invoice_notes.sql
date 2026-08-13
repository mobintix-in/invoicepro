alter table public.profiles
  add column if not exists default_invoice_notes text not null default '';

comment on column public.profiles.default_invoice_notes is
  'Reusable notes copied into each newly created invoice.';