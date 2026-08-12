-- Some deployed InvoicePro databases predate the typed base migration and keep
-- invoices.created_at as text. Cast it at the quota boundary so both legacy
-- text schemas and fresh timestamptz schemas compare against the month window.
create or replace function public.enforce_invoice_quota()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_limit integer;
  v_count integer;
  v_plan_found boolean := false;
begin
  select p.invoice_limit, true into v_limit, v_plan_found
    from public.subscriptions s
    join public.packages p on p.key = s.plan_key and p.active = true
   where s.user_id = new.user_id
     and s.status = 'active'
     and s.expires_at > now()
   limit 1;

  if not v_plan_found then
    raise exception 'ACTIVE_PLAN_REQUIRED';
  end if;

  if v_limit is null then
    return new;
  end if;

  select count(*) into v_count
    from public.invoices
   where user_id = new.user_id
     and created_at::timestamptz >= date_trunc('month', now())
     and created_at::timestamptz < date_trunc('month', now()) + interval '1 month';

  if v_count >= v_limit then
    raise exception 'INVOICE_LIMIT_REACHED'
      using hint = 'Monthly invoice limit reached for the current plan.';
  end if;

  return new;
end;
$$;

revoke execute on function public.enforce_invoice_quota()
  from public, anon, authenticated;
