-- Run this script in the Supabase SQL Editor to enable product hiding

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;

-- Optional: If you want to ensure the visibility remains false for existing records, though DEFAULT FALSE handles it for new ones
UPDATE public.products
SET is_hidden = FALSE
WHERE is_hidden IS NULL;
