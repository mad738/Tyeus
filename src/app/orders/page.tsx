'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
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
                // Fetch user orders with authentication token
                const response = await fetch(`/api/orders?userId=${session.user.id}`, {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`
                    }
                });

                if (!response.ok) throw new Error('Failed to fetch orders');

                const data = await response.json();
                setOrders(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [router]);

    if (loading) return <div className="min-h-screen bg-[#0f0c29] flex items-center justify-center text-white">Loading orders...</div>;

    return (
        <div className="min-h-screen bg-[#0f0c29] text-white font-sans selection:bg-purple-500/30">
            <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="mb-8">
                    <button
                        onClick={() => router.back()}
                        className="text-white/60 hover:text-white flex items-center gap-2 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back
                    </button>
                </div>
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 mb-8">My Orders</h1>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 mb-8">
                        {error}
                    </div>
                )}

                {orders.length === 0 ? (
                    <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                        <p className="text-white/60 mb-4">You haven't placed any orders yet.</p>
                        <button
                            onClick={() => router.push('/product')}
                            className="text-purple-400 hover:text-purple-300 underline"
                        >
                            Browse Products
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => (
                            <div key={order.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                                <div className="p-6 border-b border-white/10 flex flex-wrap justify-between items-center gap-4">
                                    <div>
                                        <p className="text-white/40 text-sm">Order ID</p>
                                        <p className="font-mono text-sm">{order.id}</p>
                                    </div>
                                    <div>
                                        <p className="text-white/40 text-sm">Date</p>
                                        <p>{new Date(order.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-white/40 text-sm">Total</p>
                                        <p className="text-xl font-bold text-green-400">${order.total}</p>
                                    </div>
                                    <div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${order.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                            order.status === 'processing' ? 'bg-blue-500/20 text-blue-400' :
                                                order.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                                                    'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                            {order.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <h3 className="text-white/60 mb-4 text-sm font-bold uppercase tracking-wider">Items</h3>
                                    {order.items && order.items.length > 0 ? (
                                        <div className="space-y-4">
                                            {order.items.map((item) => (
                                                <div key={item.id} className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-600 rounded-lg flex-shrink-0`}></div>
                                                    <div>
                                                        <p className="font-bold">{item.product?.name || `Product #${item.product_id}`}</p>
                                                        <p className="text-sm text-white/40">Qty: {item.quantity} x ${item.price_at_purchase}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-white/40 italic">Items details not available</p>
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
