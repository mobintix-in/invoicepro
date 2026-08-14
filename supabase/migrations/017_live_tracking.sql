-- 017_live_tracking.sql
-- Live analytics: sessions and page_views tables for real-time storefront tracking

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  is_new boolean not null default true,
  country text default 'India',
  country_code text default 'IN',
  city text default 'Mumbai',
  latitude double precision default 19.0760,
  longitude double precision default 72.8777,
  entry_path text not null default '/',
  exit_path text not null default '/',
  duration_seconds integer not null default 0,
  page_view_count integer not null default 1,
  referrer text default '',
  device_type text default 'desktop',
  browser text default 'Chrome',
  os text default 'Windows',
  utm_source text default '',
  utm_medium text default '',
  utm_campaign text default ''
);

create table if not exists public.page_views (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  path text not null,
  action_name text default '',
  viewed_at timestamptz not null default now()
);

-- Indices for fast aggregation
create index if not exists sessions_last_seen_idx on public.sessions (last_seen_at desc);
create index if not exists page_views_session_idx on public.page_views (session_id, viewed_at desc);
create index if not exists page_views_viewed_at_idx on public.page_views (viewed_at desc);

-- RLS Enable
alter table public.sessions enable row level security;
alter table public.page_views enable row level security;

-- Policies
drop policy if exists "Anyone can insert sessions" on public.sessions;
drop policy if exists "Anyone can update sessions" on public.sessions;
drop policy if exists "Anyone can select sessions" on public.sessions;

create policy "Anyone can insert sessions" on public.sessions for insert with check (true);
create policy "Anyone can update sessions" on public.sessions for update using (true);
create policy "Anyone can select sessions" on public.sessions for select using (true);

drop policy if exists "Anyone can insert page views" on public.page_views;
drop policy if exists "Anyone can select page views" on public.page_views;

create policy "Anyone can insert page views" on public.page_views for insert with check (true);
create policy "Anyone can select page views" on public.page_views for select using (true);

-- Grant privileges
grant select, insert, update on public.sessions to anon, authenticated;
grant select, insert on public.page_views to anon, authenticated;
