
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const productId = parseInt(id);

    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Product deleted" }, { status: 200 });
}
