'use client';

import Link from 'next/link';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
            });

            if (error) throw error;

            setMessage('Check your email for the password reset link.');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#0f0c29] bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden font-sans">
            {/* Decorative background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

            {/* Main Card */}
            <div className="relative w-full max-w-md p-8 mx-4 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl z-10">

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Forgot Password</h1>
                    <p className="text-white/60 text-sm">Enter your email to receive a reset link</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm text-center">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-xl text-green-200 text-sm text-center">
                        {message}
                    </div>
                )}

                {/* Form */}
                <form className="space-y-6" onSubmit={handleSubmit}>

                    {/* Email Input */}
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-xs font-medium text-white/80 uppercase tracking-wider ml-1">Email</label>
                        <div className="relative group">
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300"
                                placeholder="name@example.com"
                                required
                            />
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500" />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl shadow-lg transform transition-all duration-200 hover:scale-[1.02] hover:shadow-purple-500/25 active:scale-95 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <span>Send Reset Link</span>
                        )}
                    </button>
                </form>

                {/* Footer */}
                <p className="mt-8 text-center text-white/40 text-xs">
                    Remember your password? {' '}
                    <Link href="/" className="text-purple-300 hover:text-white font-medium transition-colors">Sign in</Link>
                </p>

            </div>
        </div>
    );
}
