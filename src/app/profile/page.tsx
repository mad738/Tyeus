'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [fullName, setFullName] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [recentOrders, setRecentOrders] = useState<any[]>([]);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);
                setFullName(user.user_metadata?.full_name || '');
                // Fetch recent orders directly from database
                try {
                    const { data: recentData, error: dbError } = await supabase
                        .from('orders')
                        .select('*')
                        .eq('user_id', user.id)
                        .order('created_at', { ascending: false })
                        .limit(2);

                    if (!dbError && recentData) {
                        setRecentOrders(recentData);
                    }
                } catch (err) {
                    console.error('Failed to fetch recent orders:', err);
                }
            }
            setLoading(false);
        };
        fetchUser();
    }, []);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        try {
            const { error } = await supabase.auth.updateUser({
                data: { full_name: fullName }
            });

            if (error) throw error;

            setMessage('Profile updated successfully!');
            setIsEditing(false);

            // Re-fetch to ensure sync
            const { data: { user: updatedUser } } = await supabase.auth.getUser();
            if (updatedUser) setUser(updatedUser);

        } catch (error) {
            setMessage('Error updating profile');
            console.error(error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center text-gray-800 space-y-4 px-4">
                <p className="text-lg text-center font-medium">Please sign in to view your profile.</p>
                <Link href="/" className="px-8 py-3 bg-orange-500 text-white font-bold rounded-full hover:bg-orange-600 transition-colors shadow-sm">
                    Sign In
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fafafa] text-gray-800 font-sans pb-24 md:pb-6">
            {/* Top Navigation */}
            <nav className="bg-white px-4 py-4 flex items-center justify-between sticky top-0 z-50 border-b border-gray-100 shadow-sm md:hidden">
                <div className="w-10"></div> {/* Spacer for center alignment */}
                <Link href="/home" className="text-xl font-bold tracking-tight flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <img src="/logo.png" alt="TYEUS Logo" className="w-7 h-7 rounded-sm shadow-sm" />
                    <span className="text-gray-800">Profile</span>
                </Link>
                <button
                    onClick={async () => {
                        await supabase.auth.signOut();
                        window.location.href = '/';
                    }}
                    className="text-gray-400 hover:text-red-500 transition-colors p-2 -mr-2"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                </button>
            </nav>

            <main className="px-4 py-6 max-w-lg mx-auto md:max-w-3xl md:mt-10">
                <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 sm:p-8">

                    <div className="flex flex-col items-center mb-8">
                        <div className="w-24 h-24 rounded-full bg-orange-100 flex flex-col items-center justify-center text-4xl font-black text-orange-500 mb-4 border-4 border-white shadow-sm">
                            {(fullName || user.email || '?').charAt(0).toUpperCase()}
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">{fullName || 'User Profile'}</h1>
                        <p className="text-gray-500 mt-1">{user.email}</p>
                        <div className="mt-3 px-4 py-1.5 bg-gray-50 text-gray-500 text-xs rounded-full font-medium border border-gray-200">
                            Member since {new Date(user.created_at).toLocaleDateString()}
                        </div>
                    </div>

                    {message && (
                        <div className={`mb-6 p-4 rounded-xl text-center text-sm font-medium ${message.includes('Error') ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleUpdateProfile} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Email Address</label>
                            <input
                                type="email"
                                value={user.email}
                                disabled
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed text-sm"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Full Name</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                disabled={!isEditing}
                                className={`w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all text-sm ${!isEditing && 'bg-gray-50 text-gray-600'}`}
                                placeholder="Enter your full name"
                            />
                        </div>

                        <div className="pt-2 flex gap-3">
                            {isEditing ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => { setIsEditing(false); setFullName(user.user_metadata?.full_name || ''); }}
                                        className="flex-1 py-3 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-sm transition-colors text-sm"
                                    >
                                        Save Changes
                                    </button>
                                </>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(true)}
                                    className="w-full py-3 bg-white border-2 border-orange-500 text-orange-500 font-bold rounded-xl hover:bg-orange-50 transition-colors shadow-sm text-sm"
                                >
                                    Edit Profile
                                </button>
                            )}
                        </div>
                    </form>

                    {/* Recent Orders Section */}
                    <div className="mt-8 pt-8 border-t border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Orders</h2>
                        {recentOrders.length === 0 ? (
                            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 text-center">
                                <p className="text-gray-500 text-sm">No recent orders found.</p>
                            </div>
                        ) : (
                            <div className="space-y-4 mb-6">
                                {recentOrders.map((order) => (
                                    <div key={order.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-wrap justify-between items-center gap-4">
                                        <div>
                                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">Order ID</p>
                                            <p className="font-mono text-xs font-medium text-gray-800">{order.id.substring(0, 8)}...</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">Date</p>
                                            <p className="text-xs font-medium text-gray-800">{new Date(order.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">Total</p>
                                            <p className="text-sm font-bold text-[#1a237e]">${order.total}</p>
                                        </div>
                                        <div>
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase border shadow-sm ${order.status === 'completed' || order.status === 'delivered' ? 'bg-green-50 text-green-600 border-green-200' :
                                                order.status === 'processing' || order.status === 'shipped' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                                    order.status === 'cancelled' ? 'bg-red-50 text-red-600 border-red-200' :
                                                        'bg-yellow-50 text-yellow-600 border-yellow-200'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex flex-col gap-3 mt-2">
                            <Link
                                href="/orders"
                                className="w-full py-3.5 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors text-sm shadow-sm"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                                View Order History
                            </Link>


                            <button
                                onClick={async () => {
                                    await supabase.auth.signOut();
                                    window.location.href = '/';
                                }}
                                className="hidden md:flex w-full py-3 text-red-500 hover:bg-red-50 font-bold rounded-xl transition-colors text-sm items-center justify-center -mt-1"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
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
                <Link href="/profile" className="flex flex-col items-center gap-1 text-orange-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-[11px] font-medium">Account</span>
                </Link>
            </div>

        </div>
    );
}
