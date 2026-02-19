-- Add stock column to products table, defaulting to 0 or some initial value
alter table public.products 
add column if not exists stock integer default 10;

-- Optional: Create a function to safely decrement stock (prevents race conditions)
create or replace function decrement_stock(row_id bigint, quantity int)
returns void as $$
begin
  update public.products
  set stock = stock - quantity
  where id = row_id and stock >= quantity;
  
  if not found then
    raise exception 'Insufficient stock for product id %', row_id;
  end if;
end;
$$ language plpgsql;
