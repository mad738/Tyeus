-- Add comprehensive shipping and payment fields to the orders table
alter table public.orders 
add column if not exists shipping_name text,
add column if not exists shipping_phone text,
add column if not exists shipping_pincode text,
add column if not exists shipping_address text, -- House No, Building, Street Area
add column if not exists shipping_city text,
add column if not exists shipping_state text,
add column if not exists shipping_landmark text,
add column if not exists payment_status text default 'pending',
add column if not exists payment_method text; -- 'COD', 'Card', 'UPI'

-- You might also want to ensure RLS policies cover these new columns (usually they do if applied to the table)
