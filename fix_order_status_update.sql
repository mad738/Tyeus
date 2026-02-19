-- Allow Admins to update orders (e.g., change status)
create policy "Admins can update orders" on public.orders
  for update using (
    (select role from public.users where id = auth.uid()) = 'Admin' 
    or auth.jwt() ->> 'email' like '%admin%'
  );

-- Just in case, ensure the status column is updatable (it usually is by default)
