-- Create a profiles table to store extended user data (roles, payment status)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Policy: Users can read their own profile
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Policy: Admins can read all profiles
create policy "Admins can read all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Policy: Admins can update all profiles (to manage payments, roles)
create policy "Admins can update all profiles"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Create a trigger function to automatically create a profile for new users
create or replace function public.handle_new_user()
returns trigger as $$
declare
  is_admin boolean;
begin
  -- Check if the new user is the designated admin
  is_admin := new.email = 'aryanbhimani0011@gmail.com';

  -- Automatically insert a profile record when a new user signs up
  insert into public.profiles (id, email, role, payment_status)
  values (
    new.id, 
    new.email, 
    case when is_admin then 'admin' else 'user' end, 
    'pending'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Attach the trigger to Supabase's auth.users table
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Update Invoices table to allow Admins full access to all invoices
create policy "Admins can view all invoices"
  on public.invoices for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can manage all invoices"
  on public.invoices for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
