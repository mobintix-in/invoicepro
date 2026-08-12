alter table public.fabric_lots
  add column if not exists hsn_code text not null default '',
  add column if not exists rate_per_meter numeric(14, 2) not null default 0,
  add column if not exists gst_rate numeric(5, 2) not null default 0;

alter table public.fabric_lots
  drop constraint if exists fabric_lots_rate_per_meter_check,
  drop constraint if exists fabric_lots_gst_rate_check;

alter table public.fabric_lots
  add constraint fabric_lots_rate_per_meter_check
    check (rate_per_meter >= 0),
  add constraint fabric_lots_gst_rate_check
    check (gst_rate between 0 and 100);

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