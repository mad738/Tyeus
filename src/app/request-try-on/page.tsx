'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function RequestTryOnPage() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setMessage('Please select an image first.');
            return;
        }

        try {
            setUploading(true);
            setMessage(null);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('You must be logged in to submit a request.');

            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            // 1. Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from('request-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('request-images')
                .getPublicUrl(filePath);

            // 3. Insert Record
            const { error: dbError } = await supabase
                .from('try_on_requests')
                .insert([
                    {
                        user_id: user.id,
                        user_email: user.email,
                        image_url: publicUrl,
                        status: 'pending'
                    }
                ]);

            if (dbError) throw dbError;

            setMessage('Request submitted successfully! We will process your image shortly.');
            setFile(null);

        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Error uploading request.');
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f0c29] bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white font-sans selection:bg-purple-500/30">
            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-[#0f0c29]/80 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/home" className="flex items-center gap-2 flex-shrink-0 font-bold text-2xl tracking-tighter">
                            <img src="/logo.png" alt="TYEUS Logo" className="w-8 h-8 rounded-sm shadow-sm" />
                            <div>
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">TYE</span>
                                <span className="text-white">US</span>
                            </div>
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
                    <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/20 rounded-full filter blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                    <div className="relative z-10">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold mb-2">Request Virtual Try-On</h1>
                            <p className="text-white/60">Upload a 2D image of yourself, and our team will generate a personalized virtual try-on model.</p>
                        </div>

                        {message && (
                            <div className={`mb-6 p-4 rounded-xl text-center border ${message.includes('Error') || message.includes('Please') ? 'bg-red-500/20 border-red-500/50 text-red-200' : 'bg-green-500/20 border-green-500/50 text-green-200'}`}>
                                {message}
                            </div>
                        )}

                        <form onSubmit={handleUpload} className="space-y-6">
                            <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-purple-500/50 transition-colors bg-white/5">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                                    <svg className={`w-12 h-12 mb-4 ${file ? 'text-green-400' : 'text-purple-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-lg font-bold text-white mb-2">{file ? file.name : 'Click to Upload Image'}</span>
                                    <span className="text-sm text-white/50">Supports JPG, PNG (Max 5MB)</span>
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={uploading || !file}
                                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl shadow-lg transform transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {uploading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Uploading...</span>
                                    </>
                                ) : (
                                    <span>Submit Request</span>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}
