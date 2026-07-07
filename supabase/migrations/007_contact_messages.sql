-- ============================================================================
-- 007 – Contact form messages
--
-- Run in the Supabase SQL editor (or `supabase db push`) AFTER 002 (needs
-- is_admin()). Stores messages submitted from the public "Talk to us" form so
-- admins can read them at /admin/messages. Safe to re-run.
-- ============================================================================

create extension if not exists pgcrypto; -- gen_random_uuid()

create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null default '',
  email      text not null default '',
  message    text not null default '',
  handled    boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists contact_messages_created_idx
  on public.contact_messages (created_at desc);

alter table public.contact_messages enable row level security;

-- Anyone (logged-out visitors included) can submit a message, within sane size
-- limits, and only as an un-handled row (can't pre-mark their own as handled).
drop policy if exists "Anyone can submit a message" on public.contact_messages;
create policy "Anyone can submit a message" on public.contact_messages
  for insert
  with check (
    char_length(name) <= 200
    and char_length(email) <= 200
    and char_length(message) between 1 and 5000
    and handled = false
  );

-- Admins can read, update (mark handled), and delete every message.
drop policy if exists "Admins manage messages" on public.contact_messages;
create policy "Admins manage messages" on public.contact_messages
  for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));
