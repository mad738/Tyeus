-- Drop old policies if they exist (to avoid errors if they don't, we can't use IF EXISTS easily in drop policy without DO block, but we'll try to just overwrite or add new ones)
-- Better to be safe and drop them.
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;

-- Create new policies that check public.users role table OR specific email
-- Note: We have to handle the recursion carefully. 
-- Checking public.users directly in RLS for public.orders might be fine if public.users has RLS enabled?
-- To be safe and simple, we will use the same logic as our frontend check:
-- 1. Email contains "admin" (legacy)
-- 2. Email is "marchmakers123@gmail.com"
-- 3. Role in public.users is 'Admin' (requires looking up public.users)

CREATE POLICY "Admins can view all orders" ON public.orders
    FOR SELECT USING (
        auth.jwt() ->> 'email' = 'marchmakers123@gmail.com'
        OR
        auth.jwt() ->> 'email' LIKE '%admin%'
        OR
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.role = 'Admin'
        )
    );

CREATE POLICY "Admins can view all order items" ON public.order_items
    FOR SELECT USING (
        auth.jwt() ->> 'email' = 'marchmakers123@gmail.com'
        OR
        auth.jwt() ->> 'email' LIKE '%admin%'
        OR
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.role = 'Admin'
        )
    );

-- Also ensure Admins can UPDATE orders (for status updates)
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;

CREATE POLICY "Admins can update orders" ON public.orders
    FOR UPDATE USING (
        auth.jwt() ->> 'email' = 'marchmakers123@gmail.com'
        OR
        auth.jwt() ->> 'email' LIKE '%admin%'
        OR
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.role = 'Admin'
        )
    );
