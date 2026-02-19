-- Force update the specific user ID to Admin
UPDATE public.users 
SET role = 'Admin' 
WHERE id = 'c9113af8-6443-4edb-8f37-824e46f1ef4f';

-- Verify the update
SELECT id, email, role 
FROM public.users 
WHERE id = 'c9113af8-6443-4edb-8f37-824e46f1ef4f';
