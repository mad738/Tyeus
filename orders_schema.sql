-- Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id BIGINT REFERENCES public.products(id) NOT NULL,
    quantity INTEGER DEFAULT 1 NOT NULL,
    price_at_purchase DECIMAL(10, 2) NOT NULL
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Policies for Orders
-- Users can see their own orders
CREATE POLICY "Users can view own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id);

-- Admins can see all orders (assuming admin check via email for now, based on existing app logic)
-- Note: In a real app, use a proper role or claim.
CREATE POLICY "Admins can view all orders" ON public.orders
    FOR SELECT USING (auth.jwt() ->> 'email' LIKE '%admin%');

-- Users can insert their own orders
CREATE POLICY "Users can create orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for Order Items
-- Users can view items of their own orders
CREATE POLICY "Users can view own order items" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE public.orders.id = public.order_items.order_id
            AND public.orders.user_id = auth.uid()
        )
    );

-- Admins can view all order items
CREATE POLICY "Admins can view all order items" ON public.order_items
    FOR SELECT USING (auth.jwt() ->> 'email' LIKE '%admin%');

-- Users can insert items for their own orders
CREATE POLICY "Users can create order items" ON public.order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE public.orders.id = public.order_items.order_id
            AND public.orders.user_id = auth.uid()
        )
    );
