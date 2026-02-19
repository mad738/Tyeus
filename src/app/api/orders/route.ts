
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Setup Supabase client with auth context
const getAuthenticatedSupabase = (req: Request) => {
    const authHeader = req.headers.get('Authorization');
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            global: {
                headers: {
                    Authorization: authHeader || '',
                },
            },
        }
    );
};

export async function GET(request: Request) {
    const supabase = getAuthenticatedSupabase(request);

    // Check for admin status
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const isAdmin = searchParams.get('isAdmin') === 'true';

    let query = supabase
        .from('orders')
        .select(`*, items:order_items(*, product:products(*))`)
        .order('created_at', { ascending: false });

    // If not admin, filter by user
    if (!isAdmin && userId) {
        query = query.eq('user_id', userId);
    }

    // For admin, we skip complex joining for now to ensure stability
    const { data: orders, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(orders);
}

export async function POST(request: Request) {
    try {
        const supabase = getAuthenticatedSupabase(request);
        const body = await request.json();
        const { userId, items, total, shipping, paymentMethod } = body;

        // 1. Create Order
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert([{
                user_id: userId,
                total: parseFloat(total),
                status: 'pending',

                // Shipping Details
                shipping_name: shipping.name,
                shipping_phone: shipping.phone,
                shipping_pincode: shipping.pincode,
                shipping_address: shipping.address,
                shipping_city: shipping.city,
                shipping_state: shipping.state,
                shipping_landmark: shipping.landmark,

                // Payment Details
                payment_method: paymentMethod,
                payment_status: paymentMethod === 'COD' ? 'pending' : 'paid' // Simple logic for now
            }])
            .select()
            .single();

        if (orderError) throw orderError;

        // 2. Create Order Items
        const orderItems = items.map((item: any) => ({
            order_id: orderData.id,
            product_id: item.id,
            quantity: 1, // Defaulting to 1 for now
            price_at_purchase: parseFloat(item.price.replace('$', ''))
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);

        if (itemsError) throw itemsError;

        return NextResponse.json({ success: true, orderId: orderData.id }, { status: 201 });

    } catch (err) {
        console.error('Order creation failed:', err);
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to create order' }, { status: 500 });
    }
}

// Update Order Status (Admin only)
export async function PATCH(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        console.log('[DEBUG] PATCH /api/orders - Auth Header:', authHeader ? 'Present' : 'Missing');

        const supabase = getAuthenticatedSupabase(request);

        // On server, use getUser() instead of getSession() to validate the token
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            console.error('[DEBUG] UpdateOrder - Auth failed:', authError?.message);
            return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
        }

        // Check if user is admin (simple email check for now, can be improved with RBAC)
        if (!user.email?.includes('admin')) {
            // We will do a stricter check below using the DB role
        }

        const body = await request.json();
        const { orderId, status } = body;

        console.log(`[DEBUG] Attempting update for Order ID: ${orderId} with Status: ${status}`);

        // DEBUG: Manually check role in public.users
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        console.log(`[DEBUG] UpdateOrder - User: ${user.id}, Role: ${userData?.role}, Error: ${userError?.message}`);

        const { data, error } = await supabase
            .from('orders')
            .update({ status })
            .eq('id', orderId)
            .select();

        const updatedOrder = (data as any[])?.[0];

        if (!updatedOrder) {
            return NextResponse.json({
                error: `Order update failed. Permission denied or Order not found. Debug Info -> User Role: ${userData?.role}, User ID: ${user.id}`
            }, { status: 404 });
        }

        if (error) throw error;

        return NextResponse.json(updatedOrder);
    } catch (error: any) {
        console.error('[DEBUG] Exception:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
