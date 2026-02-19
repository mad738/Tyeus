-- 1. Drop existing update policy on orders
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Super Admins can update orders" ON public.orders;

-- 2. Create a new robust policy for updating orders
-- This policy explicitly allows updates if:
-- a) The user is the specific admin (by UUID) - Guaranteed to work without recursion
-- b) The user's email contains 'admin' (Legacy check)
-- c) The user's role in public.users is 'Admin' (Assuming no recursion issues)

CREATE POLICY "Admins can update orders" ON public.orders
FOR UPDATE
USING (
  auth.uid() = 'c9113af8-6443-4edb-8f37-824e46f1ef4f'
  OR 
  (auth.jwt() ->> 'email') LIKE '%admin%'
  OR
  (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'Admin' 
    )
  )
);

-- 3. Ensure public.users is readable (to avoid recursion or permission denied on the subquery)
-- We'll allow authenticated users to read their own profile, which is sufficient for the subquery
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
CREATE POLICY "Users can read own profile" ON public.users
FOR SELECT
USING (auth.uid() = id);

-- 4. Double check role is set correctly (just in case)
UPDATE public.users 
SET role = 'Admin' 
WHERE id = 'c9113af8-6443-4edb-8f37-824e46f1ef4f';
