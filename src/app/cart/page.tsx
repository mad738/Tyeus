'use client';

import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function CartPage() {
    const { items, removeFromCart, clearCart, cartTotal } = useCart();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [session, setSession] = useState<any>(null);

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
        };
        getSession();
    }, []);

    const handleCheckout = () => {
        router.push('/checkout');
    };

    return (
        <div className="min-h-screen bg-[#0f0c29] text-white font-sans selection:bg-purple-500/30">
            <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 mb-8">Shopping Cart</h1>

                {items.length === 0 ? (
                    <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                        <p className="text-white/60 mb-4">Your cart is empty.</p>
                        <button
                            onClick={() => router.push('/home')}
                            className="text-purple-400 hover:text-purple-300 underline"
                        >
                            Continue Shopping
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-4">
                            {items.map((item) => (
                                <div key={item.id} className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center gap-4">
                                    <div className={`w-20 h-20 bg-gradient-to-br ${item.color || 'from-gray-700 to-gray-600'} rounded-lg flex-shrink-0`}></div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg">{item.name}</h3>
                                        <p className="text-white/60">{item.price}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className="text-sm bg-white/10 px-2 py-1 rounded">Qty: {item.quantity}</span>
                                        <button
                                            onClick={() => removeFromCart(item.cart_id!)}
                                            className="text-red-400 hover:text-red-300 text-sm"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl h-fit">
                            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                            <div className="flex justify-between mb-2 text-white/60">
                                <span>Subtotal</span>
                                <span>${cartTotal}</span>
                            </div>
                            <div className="flex justify-between mb-6 text-xl font-bold border-t border-white/10 pt-4">
                                <span>Total</span>
                                <span>${cartTotal}</span>
                            </div>
                            <button
                                onClick={handleCheckout}
                                disabled={loading}
                                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Processing...' : 'Checkout'}
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
