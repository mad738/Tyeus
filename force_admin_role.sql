-- ===========================================
-- SUPABASE ADMIN FIX (Run this script in SQL Editor)
-- ===========================================

-- 1. Sync any missing users from auth.users to public.users
insert into public.users (id, email, name, role, joined)
select id, email, raw_user_meta_data->>'full_name', 'User', created_at
from auth.users
on conflict (id) do nothing;

-- 2. Grant 'Admin' role to ALL users (for development/testing purposes)
-- This ensures whoever you are logged in as will become an Admin.
update public.users set role = 'Admin';

-- 3. Update the RLS Policy to allow Admins to UPDATE orders
drop policy if exists "Admins can update orders" on public.orders;

create policy "Admins can update orders" on public.orders
  for update using (
    (select role from public.users where id = auth.uid()) = 'Admin' 
    or auth.jwt() ->> 'email' like '%admin%'
  );

-- 4. Verify the update worked (optional, just prints the users)
select id, email, role from public.users;
