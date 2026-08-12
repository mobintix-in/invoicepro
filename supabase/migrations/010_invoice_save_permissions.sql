-- Data API object privileges are checked before invoice RLS policies.
-- RLS remains the row-level authorization boundary for signed-in users.
grant select, insert, update, delete
  on table public.invoices
  to authenticated;

grant execute on function public.has_active_subscription(uuid)
  to authenticated;
grant execute on function public.my_invoice_quota()
  to authenticated;
grant execute on function public.next_invoice_number()
  to authenticated;
grant execute on function public.set_invoice_timestamps()
  to authenticated;
grant execute on function public.enforce_invoice_quota()
  to authenticated;
