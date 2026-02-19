-- TEMPORARY DEBUGGING: Disable RLS on orders to rule it out
-- If the update works after running this, we know 100% that the RLS policy was the issue.
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;

-- Also verify the user ID again just to be sure
SELECT id, email, role FROM public.users WHERE email = 'marchmakers123@gmail.com';
