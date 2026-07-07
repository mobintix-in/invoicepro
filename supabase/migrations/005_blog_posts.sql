-- ============================================================================
-- 005 – Blog posts (admin-authored marketing articles)
--
-- Run in the Supabase SQL editor (or `supabase db push`) AFTER 002 (needs the
-- is_admin() helper). Admins create/edit posts from /admin/blog; the public
-- /blog pages read the published ones (logged-out visitors included).
-- Safe to re-run.
-- ============================================================================

create extension if not exists pgcrypto; -- gen_random_uuid()

create table if not exists public.blog_posts (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  title           text not null default '',
  excerpt         text not null default '',
  category        text not null default 'General',
  content         text not null default '',
  reading_minutes integer not null default 3,
  published       boolean not null default true,
  author_id       uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists blog_posts_published_idx
  on public.blog_posts (published, created_at desc);

alter table public.blog_posts enable row level security;

-- Anyone (including logged-out visitors) can read published posts.
drop policy if exists "Anyone reads published posts" on public.blog_posts;
create policy "Anyone reads published posts" on public.blog_posts
  for select using (published = true);

-- Admins can do everything, including reading and editing drafts.
drop policy if exists "Admins manage blog posts" on public.blog_posts;
create policy "Admins manage blog posts" on public.blog_posts
  for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ── Seed the launch articles (skipped if their slugs already exist) ──────────
insert into public.blog_posts (slug, title, excerpt, category, reading_minutes, created_at, content) values
  ('get-invoices-paid-faster', '5 ways to get your invoices paid faster',
   'Late payments choke small businesses. These five practical habits shorten the gap between sending an invoice and seeing the money land.',
   'Cash flow', 4, '2026-06-12',
   $$Getting paid on time is less about chasing and more about removing friction. The easier you make it for a client to pay, the sooner they will.

First, send the invoice the moment the work is done. Every day you wait to invoice is a day added to when you get paid. Automating invoice creation removes that delay entirely.

Second, set clear, short payment terms. "Net 30" is a habit, not a law — many businesses happily accept "Net 7" or "Due on receipt" when it is stated up front.

Third, attach a payment method the client can act on instantly. A UPI QR code on the invoice turns a payment from a chore into a single scan.

Fourth, send a polite reminder before the due date, not just after. A friendly nudge two days early is far more effective than an awkward chase a week late.

Finally, keep your invoices clean and unambiguous. A clear invoice number, itemised work, and a single obvious total leave no room for "I was not sure what this was for."$$),
  ('gst-invoice-guide-india', 'A simple guide to GST invoices in India',
   'GSTIN, state codes, place of supply — a plain-English walkthrough of what a compliant GST invoice actually needs.',
   'Compliance', 6, '2026-05-28',
   $$A GST invoice is not just a bill — it is the document that lets your customer claim input tax credit, so getting the details right matters to both of you.

At a minimum, a compliant tax invoice needs your GSTIN, the invoice number and date, the customer details, a description of goods or services, the taxable value, and the tax charged — split into CGST/SGST or IGST depending on the place of supply.

The place of supply decides the split. Within the same state, you charge CGST and SGST. Across states, you charge IGST. Getting the state codes right is what keeps this correct.

Consecutive, unique invoice numbers are a requirement, not a nicety. Gaps or duplicates draw questions during reconciliation, so a system that auto-increments your numbering saves real headaches.

InvoicePro handles the state codes, GSTIN fields, and tax breakdown for you, so a compliant invoice is the default rather than something you assemble by hand each time.$$),
  ('upi-payments-small-business', 'How UPI is changing payment collection for small businesses',
   'Instant, low-cost, and everywhere — why putting a UPI QR on your invoice is the simplest upgrade to your cash flow.',
   'Payments', 3, '2026-04-30',
   $$For years, collecting payment meant sharing bank details, waiting for NEFT windows, or accepting cheques that took days to clear. UPI collapsed all of that into a scan.

The advantage for a small business is not just speed — it is certainty. The moment a client scans your QR and confirms, the money is in your account and you both have a reference number.

Because a UPI QR encodes the exact amount and your ID, there is no room for a mistyped figure or a wrong account. The client simply confirms and pays.

Adding a UPI QR to every invoice you send removes the single biggest source of payment delay: the client meaning to pay later and forgetting. When paying is a five-second scan, later becomes now.$$)
on conflict (slug) do nothing;
