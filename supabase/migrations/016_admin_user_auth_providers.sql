-- Admin-only login method roster. Supabase keeps all linked sign-in
-- providers in auth.users.raw_app_meta_data.providers.
create or replace function public.list_user_auth_providers()
returns table (user_id uuid, providers text[])
language plpgsql
security definer
stable
set search_path = ''
as $$
begin
  if not public.is_admin((select auth.uid())) then
    raise exception 'ADMIN_REQUIRED' using errcode = '42501';
  end if;

  return query
  select
    u.id as user_id,
    array(
      select distinct provider_name
      from (
        select jsonb_array_elements_text(
          coalesce(u.raw_app_meta_data -> 'providers', '[]'::jsonb)
        ) as provider_name
        union all
        select u.raw_app_meta_data ->> 'provider'
      ) provider_list
      where provider_name is not null and provider_name <> ''
      order by provider_name
    )::text[] as providers
  from auth.users u;
end;
$$;

revoke execute on function public.list_user_auth_providers()
  from public, anon;
grant execute on function public.list_user_auth_providers()
  to authenticated;
