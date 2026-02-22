'use client';

import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

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
        <div className="min-h-screen bg-[#fafafa] text-gray-800 font-sans pb-24 md:pb-6">
            {/* Top Navigation */}
            <nav className="bg-white px-4 py-4 flex items-center justify-between sticky top-0 z-50 border-b border-gray-100 shadow-sm">
                <button onClick={() => router.back()} className="text-gray-800 p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors" aria-label="Back">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                <Link href="/home" className="text-xl font-bold tracking-tight flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <img src="/logo.png" alt="TYEUS Logo" className="w-7 h-7 rounded-sm shadow-sm" />
                    <span className="text-gray-800">Cart</span>
                </Link>

                <div className="w-10"></div> {/* Placeholder */}
            </nav>

            <main className="px-4 py-6 max-w-lg mx-auto md:max-w-7xl">
                <h1 className="text-2xl font-bold text-gray-900 mb-6 hidden md:block">Shopping Cart</h1>

                {items.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center">
                        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        <p className="text-gray-500 mb-6 text-lg">Your cart is empty.</p>
                        <button
                            onClick={() => router.push('/home')}
                            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-full transition-colors shadow-sm"
                        >
                            Continue Shopping
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                        {/* Cart Items List */}
                        <div className="lg:col-span-2 space-y-4">
                            {items.map((item) => (
                                <div key={item.id} className="bg-white border border-gray-100 p-4 rounded-2xl flex items-center gap-4 shadow-sm relative">
                                    <div className={`w-20 h-20 sm:w-24 sm:h-24 bg-gray-50 rounded-xl flex-shrink-0 overflow-hidden relative border border-gray-100`}>
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover p-2" />
                                        ) : (
                                            <div className="w-full h-full bg-gray-200"></div>
                                        )}
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between h-full py-1">
                                        <div>
                                            <h3 className="font-bold text-gray-800 text-sm sm:text-base leading-tight mb-1 pr-6">{item.name}</h3>
                                            <div className="text-orange-500 font-extrabold text-lg">${item.price.replace('$', '')}</div>
                                        </div>
                                        <div className="mt-2 flex items-center gap-3">
                                            <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-xs font-bold border border-gray-200">
                                                Qty: {item.quantity}
                                            </div>
                                        </div>
                                    </div>
                                    {/* Delete Button */}
                                    <button
                                        onClick={() => removeFromCart(item.cart_id!)}
                                        className="absolute top-4 right-4 text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-colors"
                                        aria-label="Remove item"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Order Summary */}
                        <div className="bg-white border border-gray-100 p-6 rounded-2xl h-fit shadow-sm lg:sticky top-24">
                            <h2 className="text-xl font-bold mb-6 text-gray-800 border-b border-gray-100 pb-4">Order Summary</h2>
                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between text-gray-600 text-sm">
                                    <span>Subtotal ({items.length} items)</span>
                                    <span className="font-medium text-gray-800">${cartTotal}</span>
                                </div>
                                <div className="flex justify-between text-gray-600 text-sm">
                                    <span>Shipping</span>
                                    <span className="text-green-600 font-medium">Free</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center mb-8 border-t border-gray-100 pt-4">
                                <span className="text-lg font-bold text-gray-800">Total</span>
                                <span className="text-2xl font-extrabold text-[#1a237e]">${cartTotal}</span>
                            </div>
                            <button
                                onClick={handleCheckout}
                                disabled={loading}
                                className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        Checkout Securely
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                    </>
                                )}
                            </button>
                            <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                Secure checkout encryption
                            </p>
                        </div>
                    </div>
                )}
            </main>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 flex justify-around items-center py-3 px-2 z-50 md:hidden pb-safe">
                <Link href="/home" className="flex flex-col items-center gap-1 text-gray-400 hover:text-orange-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span className="text-[11px] font-medium">Beranda</span>
                </Link>
                <Link href="/product" className="flex flex-col items-center gap-1 text-gray-400 hover:text-orange-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <span className="text-[11px] font-medium">Products</span>
                </Link>
                <Link href="/profile" className="flex flex-col items-center gap-1 text-gray-400 hover:text-orange-400 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-[11px] font-medium">Account</span>
                </Link>
            </div>

        </div>
    );
}
