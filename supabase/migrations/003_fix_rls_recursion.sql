-- Fix Infinite Recursion in RLS Policies

-- 1. Create a SECURITY DEFINER function to safely check if the current user is an admin
-- SECURITY DEFINER runs as the database superuser, which bypasses RLS and prevents infinite loops.
create or replace function public.is_admin()
returns boolean as $$
declare
  is_admin boolean;
begin
  select (role = 'admin') into is_admin from public.profiles where id = auth.uid();
  return coalesce(is_admin, false);
end;
$$ language plpgsql security definer;

-- 2. Drop the recursive policies from the profiles table
drop policy if exists "Admins can read all profiles" on public.profiles;
drop policy if exists "Admins can update all profiles" on public.profiles;

-- 3. Recreate the policies using the safe function
create policy "Admins can read all profiles"
  on public.profiles for select
  using (public.is_admin());

create policy "Admins can update all profiles"
  on public.profiles for update
  using (public.is_admin());

-- 4. Fix the invoices policies as well
drop policy if exists "Admins can view all invoices" on public.invoices;
drop policy if exists "Admins can manage all invoices" on public.invoices;

create policy "Admins can view all invoices"
  on public.invoices for select
  using (public.is_admin());

create policy "Admins can manage all invoices"
  on public.invoices for all
  using (public.is_admin());
