-- 1. Reset everyone to 'User' first
UPDATE public.users SET role = 'User'; 

-- 2. Make marchmakers123@gmail.com an Admin (if they exist in public.users)
-- We search by email. Note: This assumes email is synced to public.users.
UPDATE public.users 
SET role = 'Admin' 
WHERE email = 'marchmakers123@gmail.com';

-- 3. Just in case the user hasn't logged in since we added the public.users sync trigger,
-- let's try to insert them from auth.users if they exist there.
INSERT INTO public.users (id, email, name, role, joined)
SELECT id, email, raw_user_meta_data->>'full_name', 'Admin', created_at
FROM auth.users
WHERE email = 'marchmakers123@gmail.com'
ON CONFLICT (id) DO UPDATE
SET role = 'Admin';

-- 4. Verify who is admin now
SELECT email, role FROM public.users WHERE role = 'Admin';
