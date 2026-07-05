insert into public.admins (user_id)
select id from auth.users where email = 'aryanbhimani0011@gmail.com'
on conflict do nothing;