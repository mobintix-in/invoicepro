-- ============================================================================
-- 018 – Package durations (1 Month / 6 Months / 1 Year) & pricing
--
-- Adds:
--   • packages.duration_months – billing duration in months (1, 6, 12, etc.)
--   • Updated submit_subscription_payment_v2 to store package duration_months
--   • Seeds / updates standard plans for 1 Month, 6 Months, and 1 Year
--   • Removes old deprecated packages ('starter', 'business', 'enterprise')
-- Safe to re-run.
-- ============================================================================

-- 1. Add duration_months column to packages if not exists
alter table public.packages
  add column if not exists duration_months integer not null default 1;

-- 2. Update submit_subscription_payment_v2 to copy duration_months to subscriptions
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
  v_duration integer;
  v_subscription public.subscriptions%rowtype;
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  if char_length(trim(coalesce(p_utr, ''))) not between 6 and 200 then
    raise exception 'INVALID_UTR';
  end if;

  select price_inr, coalesce(duration_months, 1)
    into v_price, v_duration
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
    coalesce(v_duration, 1),
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

-- 3. Upsert standard launch plans with 1 Month, 6 Months, and 1 Year durations
insert into public.packages (
  key, name, price_inr, duration_months, tagline, features, invoice_limit, cta, highlighted, sort_order, active
) values
  ('monthly', '1 Month Plan', 299, 1, 'Flexible month-to-month access with all essentials.',
   '["Unlimited invoices & clients","GST-ready invoice templates","UPI QR code on every invoice","Professional PDF & thermal receipt export","Email & WhatsApp support"]'::jsonb,
   null, 'Get 1 Month Plan', false, 1, true),
  ('half-yearly', '6 Months Plan', 1499, 6, 'Great value for active businesses — Save ~16%.',
   '["Everything in Monthly plan","Save ₹295 compared to monthly","GST & HSN automatic calculations","Priority customer support","Data backup & multi-device sync"]'::jsonb,
   null, 'Get 6 Months Plan', true, 2, true),
  ('yearly', '1 Year Plan', 2699, 12, 'Best long-term value — Save ~25% (₹225 / month).',
   '["Everything in 6 Months plan","Save ₹889 compared to monthly","Custom business logo & watermark","Priority VIP support & early features","Full year uninterrupted invoicing"]'::jsonb,
   null, 'Get 1 Year Plan', false, 3, true)
on conflict (key) do update
  set name = excluded.name,
      price_inr = excluded.price_inr,
      duration_months = excluded.duration_months,
      tagline = excluded.tagline,
      features = excluded.features,
      invoice_limit = excluded.invoice_limit,
      cta = excluded.cta,
      highlighted = excluded.highlighted,
      sort_order = excluded.sort_order,
      active = excluded.active;

-- 4. Reassign existing subscriptions referencing deprecated plans and delete extra packages
update public.subscriptions
set plan_key = 'monthly'
where plan_key in ('starter') or plan_key not in ('monthly', 'half-yearly', 'yearly');

update public.subscriptions
set plan_key = 'half-yearly'
where plan_key = 'business';

update public.subscriptions
set plan_key = 'yearly'
where plan_key = 'enterprise';

-- Delete all deprecated and extra packages so only the 3 purposeful plans remain
delete from public.packages
where key not in ('monthly', 'half-yearly', 'yearly');
