
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
    const { data: products, error } = await supabase.from('products').select('*');
    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(products);
}

export async function POST(request: Request) {
    const body = await request.json();
    const newProduct = {
        name: body.name,
        price: body.price,
        category: body.category,
        color: body.category === "Electronics" ? "from-blue-500 to-cyan-400" : "from-purple-500 to-pink-500"
    };

    const { data, error } = await supabase
        .from('products')
        .insert([newProduct])
        .select();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data[0], { status: 201 });
}
