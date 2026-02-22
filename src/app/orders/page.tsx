'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Order } from '@/types';

export default function UserOrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchOrders = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                router.push('/');
                return;
            }

            try {
                // Fetch user orders directly from DB
                const { data, error: dbError } = await supabase
                    .from('orders')
                    .select('*, items:order_items(*, product:products(*))')
                    .eq('user_id', session.user.id)
                    .order('created_at', { ascending: false });

                if (dbError) throw dbError;

                setOrders(data || []);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [router]);

    if (loading) return (
        <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

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
                    <span className="text-gray-800">My Orders</span>
                </Link>

                <div className="w-10"></div> {/* Placeholder */}
            </nav>

            <main className="px-4 py-6 max-w-lg mx-auto sm:px-6 lg:px-8 md:max-w-4xl">
                <h1 className="text-2xl font-bold text-gray-900 mb-6 hidden md:block">Order History</h1>

                {error && (
                    <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-red-600 mb-6 text-sm font-medium">
                        {error}
                    </div>
                )}

                {orders.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center">
                        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        <p className="text-gray-500 mb-6 text-lg">You haven't placed any orders yet.</p>
                        <button
                            onClick={() => router.push('/product')}
                            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-full transition-colors shadow-sm"
                        >
                            Browse Products
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => (
                            <div key={order.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                                <div className="bg-gray-50 p-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4">
                                    <div>
                                        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Order ID</p>
                                        <p className="font-mono text-sm text-gray-800">{order.id.substring(0, 8)}...</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Date</p>
                                        <p className="text-sm font-medium text-gray-800">{new Date(order.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Total</p>
                                        <p className="text-lg font-bold text-[#1a237e]">${order.total}</p>
                                    </div>
                                    <div>
                                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase border shadow-sm ${order.status === 'completed' || order.status === 'delivered' ? 'bg-green-50 text-green-600 border-green-200' :
                                            order.status === 'processing' || order.status === 'shipped' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                                order.status === 'cancelled' ? 'bg-red-50 text-red-600 border-red-200' :
                                                    'bg-yellow-50 text-yellow-600 border-yellow-200'
                                            }`}>
                                            {order.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-4 sm:p-6">
                                    <h3 className="text-gray-800 mb-4 text-sm font-bold border-b border-gray-100 pb-2">Items Included</h3>
                                    {order.items && order.items.length > 0 ? (
                                        <div className="space-y-4">
                                            {order.items.map((item) => (
                                                <div key={item.id} className="flex items-center gap-4">
                                                    <div className={`w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 rounded-xl flex-shrink-0 flex items-center justify-center relative overflow-hidden border border-gray-200`}>
                                                        {item.product?.main_image ? (
                                                            <img src={item.product.main_image} alt={item.product.name} className="w-full h-full object-cover p-1" />
                                                        ) : (
                                                            <span className="text-gray-300 text-xs">Img</span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-bold text-gray-800 text-sm">{item.product?.name || `Product #${item.product_id}`}</p>
                                                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                                            <span>Qty: {item.quantity}</span>
                                                            <span className="font-medium text-gray-800">${item.price_at_purchase}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-400 italic text-sm">Item details not available</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
