-- ============================================================================
-- 004_seed_packages.sql
-- InvoicePro – Standard Subscription Packages Seed Data
-- ============================================================================

insert into public.packages (
  key, name, price_inr, duration_months, tagline, features,
  invoice_limit, cta, highlighted, sort_order, active
) values
  ('monthly', '1 Month Plan', 299, 1,
   'Flexible month-to-month access with all essentials.',
   '["Unlimited invoices & clients","GST-ready invoice templates","UPI QR code on every invoice","Professional PDF & thermal receipt export","Email & WhatsApp support"]'::jsonb,
   null, 'Get 1 Month Plan', false, 1, true),

  ('half-yearly', '6 Months Plan', 1499, 6,
   'Great value for active businesses — Save ~16%.',
   '["Everything in Monthly plan","Save ₹295 compared to monthly","GST & HSN automatic calculations","Priority customer support","Data backup & multi-device sync"]'::jsonb,
   null, 'Get 6 Months Plan', true, 2, true),

  ('yearly', '1 Year Plan', 2699, 12,
   'Best long-term value — Save ~25% (₹225 / month).',
   '["Everything in 6 Months plan","Save ₹889 compared to monthly","Custom business logo & watermark","Priority VIP support & early features","Full year uninterrupted invoicing"]'::jsonb,
   null, 'Get 1 Year Plan', false, 3, true)

on conflict (key) do update
  set name            = excluded.name,
      price_inr       = excluded.price_inr,
      duration_months = excluded.duration_months,
      tagline         = excluded.tagline,
      features        = excluded.features,
      invoice_limit   = excluded.invoice_limit,
      cta             = excluded.cta,
      highlighted     = excluded.highlighted,
      sort_order      = excluded.sort_order,
      active          = excluded.active;

-- Auto-seed recognized administrators if they already exist in auth.users
insert into public.admins (user_id)
select id from auth.users
where lower(email) in ('aryanbhimani0011@gmail.com')
on conflict (user_id) do nothing;
