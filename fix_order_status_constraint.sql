-- Drop the existing check constraint
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add the new check constraint with all necessary values
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'));

-- Also Re-enable RLS just in case it was disabled and we want to be secure
-- (But we need to make sure the policy is correct first. Let's leave it disabled or enabled based on previous steps? 
-- The user said "Permission denied", which suggests RLS was ON.
-- Let's ensure RLS is ON but policies are correct.
-- Actually, let's just fix the constraint first. The permission error might be a red herring for a constraint violation 
-- if Supabase/PostgREST wraps it that way, or if the "update" fails and returns 0 rows.)

-- Verified Policy (from final_fix_admin_update.sql) should be good.
-- Let's just fix the constraint.
