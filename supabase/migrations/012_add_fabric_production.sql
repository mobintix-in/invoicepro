create table if not exists public.fabric_lots (
  id                  text primary key check (length(id) > 0),
  user_id             uuid references auth.users(id) on delete cascade not null,
  production_company  text not null default '',
  party_name          text not null default '',
  challan_number      text not null default '',
  challan_date        date,
  lot_number          text not null default '',
  category            text not null default '',
  quality             text not null default '',
  shade               text not null default '',
  variation           text not null default '',
  construction        text not null default '',
  width_inches        numeric(8, 2) check (width_inches is null or width_inches > 0),
  gsm                 numeric(8, 2) check (gsm is null or gsm > 0),
  hsn_code            text not null default '',
  rate_per_meter      numeric(14, 2) not null default 0 check (rate_per_meter >= 0),
  gst_rate            numeric(5, 2) not null default 0 check (gst_rate between 0 and 100),
  status              text not null default 'inward'
    check (status in ('inward', 'in_production', 'completed', 'dispatched')),
  challan_file_path   text not null default '',
  notes               text not null default '',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (id, user_id)
);

create table if not exists public.fabric_rolls (
  id               text primary key check (length(id) > 0),
  lot_id           text not null,
  user_id          uuid not null,
  roll_number      text not null default '',
  meters           numeric(12, 2) not null check (meters > 0),
  grade            text not null default 'A'
    check (grade in ('A', 'B', 'C', 'rejected')),
  shade_variation  text not null default '',
  created_at       timestamptz not null default now(),
  constraint fabric_rolls_lot_owner_fkey
    foreign key (lot_id, user_id)
    references public.fabric_lots(id, user_id)
    on delete cascade
);

create index if not exists fabric_lots_user_updated_idx
  on public.fabric_lots (user_id, updated_at desc);
create index if not exists fabric_lots_user_lot_idx
  on public.fabric_lots (user_id, lot_number);
create index if not exists fabric_rolls_lot_idx
  on public.fabric_rolls (lot_id);
create index if not exists fabric_rolls_user_idx
  on public.fabric_rolls (user_id);

alter table public.fabric_lots enable row level security;
alter table public.fabric_rolls enable row level security;

grant select, insert, update, delete on table
  public.fabric_lots,
  public.fabric_rolls
to authenticated;

drop policy if exists "Users read own fabric lots" on public.fabric_lots;
create policy "Users read own fabric lots"
  on public.fabric_lots for select to authenticated
  using (
    (select auth.uid()) = user_id
    and public.has_active_subscription((select auth.uid()))
  );

drop policy if exists "Users create own fabric lots" on public.fabric_lots;
create policy "Users create own fabric lots"
  on public.fabric_lots for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and public.has_active_subscription((select auth.uid()))
  );

drop policy if exists "Users update own fabric lots" on public.fabric_lots;
create policy "Users update own fabric lots"
  on public.fabric_lots for update to authenticated
  using (
    (select auth.uid()) = user_id
    and public.has_active_subscription((select auth.uid()))
  )
  with check (
    (select auth.uid()) = user_id
    and public.has_active_subscription((select auth.uid()))
  );

drop policy if exists "Users delete own fabric lots" on public.fabric_lots;
create policy "Users delete own fabric lots"
  on public.fabric_lots for delete to authenticated
  using (
    (select auth.uid()) = user_id
    and public.has_active_subscription((select auth.uid()))
  );

drop policy if exists "Users read own fabric rolls" on public.fabric_rolls;
create policy "Users read own fabric rolls"
  on public.fabric_rolls for select to authenticated
  using (
    (select auth.uid()) = user_id
    and public.has_active_subscription((select auth.uid()))
  );

drop policy if exists "Users create own fabric rolls" on public.fabric_rolls;
create policy "Users create own fabric rolls"
  on public.fabric_rolls for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and public.has_active_subscription((select auth.uid()))
  );

drop policy if exists "Users update own fabric rolls" on public.fabric_rolls;
create policy "Users update own fabric rolls"
  on public.fabric_rolls for update to authenticated
  using (
    (select auth.uid()) = user_id
    and public.has_active_subscription((select auth.uid()))
  )
  with check (
    (select auth.uid()) = user_id
    and public.has_active_subscription((select auth.uid()))
  );

drop policy if exists "Users delete own fabric rolls" on public.fabric_rolls;
create policy "Users delete own fabric rolls"
  on public.fabric_rolls for delete to authenticated
  using (
    (select auth.uid()) = user_id
    and public.has_active_subscription((select auth.uid()))
  );

create or replace function public.save_fabric_lot(
  p_id text,
  p_production_company text,
  p_party_name text,
  p_challan_number text,
  p_challan_date date,
  p_lot_number text,
  p_category text,
  p_quality text,
  p_shade text,
  p_variation text,
  p_construction text,
  p_width_inches numeric,
  p_gsm numeric,
  p_hsn_code text,
  p_rate_per_meter numeric,
  p_gst_rate numeric,
  p_status text,
  p_challan_file_path text,
  p_notes text,
  p_rolls jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  if jsonb_typeof(coalesce(p_rolls, '[]'::jsonb)) <> 'array' then
    raise exception 'ROLLS_MUST_BE_AN_ARRAY';
  end if;

  if coalesce(p_challan_file_path, '') <> ''
     and split_part(p_challan_file_path, '/', 1) <> v_uid::text then
    raise exception 'INVALID_CHALLAN_PATH';
  end if;

  insert into public.fabric_lots (
    id, user_id, production_company, party_name, challan_number,
    challan_date, lot_number, category, quality, shade, variation,
    construction, width_inches, gsm, hsn_code, rate_per_meter,
    gst_rate, status, challan_file_path, notes, updated_at
  )
  values (
    p_id, v_uid, trim(coalesce(p_production_company, '')),
    trim(coalesce(p_party_name, '')), trim(coalesce(p_challan_number, '')),
    p_challan_date, trim(coalesce(p_lot_number, '')),
    trim(coalesce(p_category, '')), trim(coalesce(p_quality, '')),
    trim(coalesce(p_shade, '')), trim(coalesce(p_variation, '')),
    trim(coalesce(p_construction, '')), p_width_inches, p_gsm,
    trim(coalesce(p_hsn_code, '')), coalesce(p_rate_per_meter, 0),
    coalesce(p_gst_rate, 0), p_status, coalesce(p_challan_file_path, ''),
    trim(coalesce(p_notes, '')), now()
  )
  on conflict (id) do update
    set production_company = excluded.production_company,
        party_name = excluded.party_name,
        challan_number = excluded.challan_number,
        challan_date = excluded.challan_date,
        lot_number = excluded.lot_number,
        category = excluded.category,
        quality = excluded.quality,
        shade = excluded.shade,
        variation = excluded.variation,
        construction = excluded.construction,
        width_inches = excluded.width_inches,
        gsm = excluded.gsm,
        hsn_code = excluded.hsn_code,
        rate_per_meter = excluded.rate_per_meter,
        gst_rate = excluded.gst_rate,
        status = excluded.status,
        challan_file_path = excluded.challan_file_path,
        notes = excluded.notes,
        updated_at = now()
    where public.fabric_lots.user_id = v_uid;

  if not found then
    raise exception 'FABRIC_LOT_NOT_FOUND_OR_FORBIDDEN';
  end if;

  delete from public.fabric_rolls
   where lot_id = p_id and user_id = v_uid;

  insert into public.fabric_rolls (
    id, lot_id, user_id, roll_number, meters, grade, shade_variation
  )
  select
    roll->>'id',
    p_id,
    v_uid,
    trim(coalesce(roll->>'rollNumber', '')),
    (roll->>'meters')::numeric,
    coalesce(nullif(roll->>'grade', ''), 'A'),
    trim(coalesce(roll->>'shadeVariation', ''))
  from jsonb_array_elements(coalesce(p_rolls, '[]'::jsonb)) as roll;
end;
$$;

revoke execute on function public.save_fabric_lot(
  text, text, text, text, date, text, text, text, text, text, text,
  numeric, numeric, text, numeric, numeric, text, text, text, jsonb
) from public, anon;
grant execute on function public.save_fabric_lot(
  text, text, text, text, date, text, text, text, text, text, text,
  numeric, numeric, text, numeric, numeric, text, text, text, jsonb
) to authenticated;

insert into storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
)
values (
  'fabric-challans',
  'fabric-challans',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users read own fabric challans" on storage.objects;
create policy "Users read own fabric challans"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'fabric-challans'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.has_active_subscription((select auth.uid()))
  );

drop policy if exists "Users upload own fabric challans" on storage.objects;
create policy "Users upload own fabric challans"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'fabric-challans'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.has_active_subscription((select auth.uid()))
  );

drop policy if exists "Users update own fabric challans" on storage.objects;
create policy "Users update own fabric challans"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'fabric-challans'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.has_active_subscription((select auth.uid()))
  )
  with check (
    bucket_id = 'fabric-challans'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.has_active_subscription((select auth.uid()))
  );

drop policy if exists "Users delete own fabric challans" on storage.objects;
create policy "Users delete own fabric challans"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'fabric-challans'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.has_active_subscription((select auth.uid()))
  );
