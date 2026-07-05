-- ============================================================================
-- 003 – Business details on the profile
--
-- Adds the seller / "your business" fields to profiles so a new invoice's
-- "From" side (and bank block) can be pre-filled from the user's profile.
-- Safe to run multiple times.
-- ============================================================================

alter table public.profiles
  add column if not exists address           text not null default '',
  add column if not exists gstin             text not null default '',
  add column if not exists state_name        text not null default '',
  add column if not exists state_code        text not null default '',
  add column if not exists pan               text not null default '',
  add column if not exists bank_account_name text not null default '',
  add column if not exists bank_name         text not null default '',
  add column if not exists account_number    text not null default '',
  add column if not exists ifsc_code         text not null default '',
  add column if not exists bank_branch       text not null default '',
  add column if not exists jurisdiction      text not null default '';

-- No RLS changes needed: the existing "Users read/insert/update own profile"
-- policies already cover these new columns.
