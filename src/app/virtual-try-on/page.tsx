'use client';

import Link from 'next/link';

export default function VirtualTryOnPage() {
    return (
        <div className="min-h-screen bg-[#fafafa] text-gray-800 font-sans pb-24 md:pb-6 flex flex-col">
            {/* Top Navigation */}
            <nav className="bg-white px-4 py-4 flex items-center justify-between sticky top-0 z-50 border-b border-gray-100 shadow-sm">
                <Link href="/home" className="text-gray-800 p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors" aria-label="Back">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
                <Link href="/home" className="text-xl font-bold tracking-tight flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <img src="/logo.png" alt="TYEUS Logo" className="w-7 h-7 rounded-sm shadow-sm" />
                    <span className="text-gray-800">Virtual Try-On</span>
                </Link>

                <div className="w-10"></div> {/* Spacer for center alignment */}
            </nav>

            <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center max-w-md w-full">
                    {/* Glowing Avatar/Magic Icon */}
                    <div className="w-24 h-24 bg-gradient-to-tr from-purple-100 to-orange-50 rounded-full flex items-center justify-center mb-6 relative shadow-inner">
                        <svg className="w-12 h-12 text-orange-500 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                        </svg>
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-white/40 blur-md rounded-full animate-pulse"></div>
                    </div>

                    <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-4">Coming Soon</h1>
                    <p className="text-gray-500 mb-8 leading-relaxed">
                        We are currently upgrading our 3D Virtual Try-On engines to give you an even more realistic fitting experience. Stay tuned!
                    </p>

                    <Link href="/product" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5">
                        Explore Products Instead
                    </Link>
                </div>
            </main>

            {/* Desktop Bottom Navigation (Hidden on mobile) */}
            <div className="hidden md:flex fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 justify-center gap-10 items-center py-4 px-2 z-50">
                <Link href="/home" className="text-gray-600 font-medium hover:text-orange-400">Home</Link>
                <Link href="/product" className="text-gray-600 font-medium hover:text-orange-400">Products</Link>
                <Link href="/virtual-try-on" className="text-orange-400 font-bold hover:text-orange-500">Virtual Try-On</Link>
                <Link href="/profile" className="text-gray-600 font-medium hover:text-orange-400">Profile</Link>
            </div>

            {/* Mobile Bottom Navigation (Visible only on mobile) */}
            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 flex justify-around items-center py-3 px-2 z-50 md:hidden pb-safe">
                <Link href="/home" className="flex flex-col items-center gap-1 text-gray-400 hover:text-orange-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span className="text-[11px] font-medium">Home</span>
                </Link>
                <Link href="/product" className="flex flex-col items-center gap-1 text-gray-400 hover:text-orange-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <span className="text-[11px] font-medium">Products</span>
                </Link>
                <Link href="/profile" className="flex flex-col items-center gap-1 text-gray-400 hover:text-orange-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-[11px] font-medium">Account</span>
                </Link>
            </div>
        </div>
    );
}
