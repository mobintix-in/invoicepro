-- Return the saved subscription as a receipt so the client can confirm that a
-- payment submission really reached the pending-review queue.
create or replace function public.submit_subscription_payment_v2(
  p_utr text,
  p_plan_key text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_price integer;
  v_subscription public.subscriptions%rowtype;
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  if char_length(trim(coalesce(p_utr, ''))) not between 6 and 200 then
    raise exception 'INVALID_UTR';
  end if;

  select price_inr
    into v_price
  from public.packages
  where key = p_plan_key
    and active = true;

  if not found then
    raise exception 'INVALID_PLAN';
  end if;

  insert into public.subscriptions (
    user_id,
    status,
    utr,
    amount,
    plan_key,
    plan_months,
    submitted_at,
    activated_at,
    expires_at,
    updated_at
  ) values (
    v_uid,
    'pending',
    trim(p_utr),
    v_price,
    p_plan_key,
    1,
    now(),
    null,
    null,
    now()
  )
  on conflict (user_id) do update
    set status = 'pending',
        utr = excluded.utr,
        amount = excluded.amount,
        plan_key = excluded.plan_key,
        plan_months = excluded.plan_months,
        submitted_at = excluded.submitted_at,
        activated_at = null,
        expires_at = null,
        updated_at = excluded.updated_at
  where public.subscriptions.status in ('rejected', 'expired')
     or (
       public.subscriptions.status = 'active'
       and (
         public.subscriptions.expires_at is null
         or public.subscriptions.expires_at <= now()
       )
     )
  returning * into v_subscription;

  if v_subscription.user_id is null then
    raise exception 'SUBSCRIPTION_NOT_RENEWABLE';
  end if;

  return to_jsonb(v_subscription);
end;
$$;

revoke execute on function public.submit_subscription_payment_v2(text, text)
  from public, anon;
grant execute on function public.submit_subscription_payment_v2(text, text)
  to authenticated;

-- Repair only a recent resubmission that happened after the previous access
-- period. Historical UTRs remain untouched.
update public.subscriptions
set status = 'pending',
    activated_at = null,
    expires_at = null,
    updated_at = now()
where status = 'expired'
  and utr is not null
  and submitted_at is not null
  and submitted_at >= now() - interval '7 days'
  and submitted_at > greatest(
    coalesce(activated_at, '-infinity'::timestamptz),
    coalesce(expires_at, '-infinity'::timestamptz)
  );