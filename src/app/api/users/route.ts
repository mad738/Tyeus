
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
    const { data: users, error } = await supabase.from('users').select('*');
    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(users);
}

// Optional: Add POST to add mock users via Supabase too if needed
export async function POST(request: Request) {
    const body = await request.json();
    const newUser = {
        name: body.name,
        email: body.email,
        role: "User",
        joined: new Date().toISOString(),
        password: body.password // In a real app, hash this!
    };

    const { data, error } = await supabase
        .from('users')
        .insert([newUser])
        .select();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data[0], { status: 201 });
}
