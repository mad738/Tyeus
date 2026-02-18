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

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);
                setFullName(user.user_metadata?.full_name || '');
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
            <div className="min-h-screen bg-[#0f0c29] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-[#0f0c29] flex flex-col items-center justify-center text-white space-y-4">
                <p className="text-xl">Please sign in to view your profile.</p>
                <Link href="/" className="px-6 py-2 bg-purple-600 rounded-xl hover:bg-purple-500 transition-colors">Sign In</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f0c29] bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white font-sans selection:bg-purple-500/30">
            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-[#0f0c29]/80 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/home" className="flex-shrink-0 font-bold text-2xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 mr-8">
                            NEBULA<span className="text-white">STORE</span>
                        </Link>
                        <Link href="/home" className="text-sm text-white/70 hover:text-white transition-colors">
                            &larr; Back to Home
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="pt-32 px-4 max-w-2xl mx-auto">
                <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl p-8 relative overflow-hidden">
                    {/* Background blob */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full filter blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                    <div className="relative z-10">
                        <div className="flex flex-col items-center mb-8">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-[3px] mb-4 shadow-lg shadow-purple-500/30">
                                <div className="w-full h-full rounded-full bg-[#1a163b] flex items-center justify-center text-3xl font-bold">
                                    {(fullName || user.email || '?').charAt(0).toUpperCase()}
                                </div>
                            </div>
                            <h1 className="text-2xl font-bold">{fullName || 'User Profile'}</h1>
                            <p className="text-white/60">{user.email}</p>
                            <div className="mt-2 px-3 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full border border-purple-500/30">
                                Member since {new Date(user.created_at).toLocaleDateString()}
                            </div>
                        </div>

                        {message && (
                            <div className={`mb-6 p-4 rounded-xl text-center border ${message.includes('Error') ? 'bg-red-500/20 border-red-500/50 text-red-200' : 'bg-green-500/20 border-green-500/50 text-green-200'}`}>
                                {message}
                            </div>
                        )}

                        <form onSubmit={handleUpdateProfile} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-white/80 uppercase tracking-wider ml-1">Email Address</label>
                                <input
                                    type="email"
                                    value={user.email}
                                    disabled
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/50 cursor-not-allowed"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-white/80 uppercase tracking-wider ml-1">Full Name</label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    disabled={!isEditing}
                                    className={`w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all ${!isEditing && 'opacity-70'}`}
                                    placeholder="Enter your full name"
                                />
                            </div>

                            <div className="pt-4 flex gap-4">
                                {isEditing ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => { setIsEditing(false); setFullName(user.user_metadata?.full_name || ''); }}
                                            className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl shadow-lg transition-all"
                                        >
                                            Save Changes
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(true)}
                                        className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold rounded-xl transition-all hover:scale-[1.02]"
                                    >
                                        Edit Profile
                                    </button>
                                )}
                            </div>
                        </form>

                        <div className="mt-8 pt-8 border-t border-white/10">
                            <button
                                onClick={async () => {
                                    await supabase.auth.signOut();
                                    window.location.href = '/';
                                }}
                                className="w-full py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all text-sm font-bold"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
