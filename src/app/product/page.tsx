'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';

export default function ProductPage() {
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [products, setProducts] = useState<any[]>([]);
    const { cartCount, addToCart } = useCart();

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/products');
                const data = await res.json();
                if (Array.isArray(data)) setProducts(data.filter((p: any) => !p.is_hidden));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    // Filter logic
    const filteredProducts = products.filter(product => {
        return product.name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
        <div className="min-h-screen bg-[#fafafa] text-gray-800 font-sans pb-20">
            {/* Top Navigation */}
            <nav className="bg-white px-4 py-4 flex items-center justify-between sticky top-0 z-50">
                <Link href="/home" className="text-gray-800 p-2 -ml-2" aria-label="Back">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>

                <Link href="/home" className="text-xl font-bold tracking-tight flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                    <img src="/logo.png" alt="TYEUS Logo" className="w-7 h-7 rounded-sm shadow-sm" />
                    <div>
                        <span className="text-[#0066cc]">TY</span>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#0066cc] to-[#00cc99]">EUS</span>
                    </div>
                </Link>

                <Link href="/cart" className="relative p-2 text-gray-600 -mr-2" aria-label="Cart">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {cartCount > 0 && (
                        <span className="absolute top-0 right-0 w-4 h-4 bg-orange-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                            {cartCount}
                        </span>
                    )}
                </Link>
            </nav>

            {/* Header Area */}
            <div className="px-4 py-4 max-w-lg mx-auto md:max-w-7xl">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Our Collection</h1>
                <p className="text-sm text-gray-500 mb-6">Browse the complete range of future technology.</p>

                {/* Search Bar */}
                <div className="relative w-full mb-6">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for anything"
                        className="w-full bg-white border-2 border-[#1a237e]/20 rounded-full py-3 px-5 pr-12 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#1a237e]/40 transition-colors"
                    />
                    <button className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <main className="px-4 pb-6 max-w-lg mx-auto md:max-w-7xl">
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <p>No products found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredProducts.map((product) => (
                            <div key={product.id} className="bg-white rounded-xl p-3 flex flex-col hover:shadow-lg transition-shadow border border-gray-100 h-full">
                                <Link href={`/product/${product.id}`} className="block relative focus:outline-none">
                                    <div className="aspect-square rounded-xl bg-gray-50 mb-3 overflow-hidden flex items-center justify-center relative">
                                        {(product.main_image || (product.images && product.images.length > 0)) ? (
                                            <img src={product.main_image || product.images?.[0]} alt={product.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-gray-200"></div>
                                        )}
                                    </div>
                                    <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug mb-2">
                                        {product.name}
                                    </h3>
                                </Link>

                                <div className="mt-auto flex flex-col">
                                    <div className="mb-3">
                                        <div className="inline-block border-2 border-orange-200/80 rounded-full px-3 py-1 bg-white">
                                            <span className="text-[13px] font-extrabold text-[#1a237e]">${product.price}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={() => addToCart(product)}
                                            className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors text-xs"
                                        >
                                            Add to Cart
                                        </button>
                                        <button
                                            onClick={() => { addToCart(product); router.push('/cart'); }}
                                            className="w-full py-2 bg-gradient-to-r from-[#0066cc] to-[#00cc99] hover:opacity-90 text-white font-medium rounded-lg transition-opacity text-xs shadow-sm"
                                        >
                                            Buy Now
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
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
                <Link href="/product" className="flex flex-col items-center gap-1 text-orange-400">
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

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 justify-center gap-10 items-center py-4 px-2 z-50">
                <Link href="/home" className="text-gray-600 font-bold hover:text-orange-500">Home</Link>
                <Link href="/product" className="text-orange-400 font-medium hover:text-orange-500">Products</Link>
                <Link href="/virtual-try-on" className="text-gray-600 font-medium hover:text-orange-400">Virtual Try-On</Link>
                <Link href="/profile" className="text-gray-600 font-medium hover:text-orange-400">Profile</Link>
            </div>
        </div>
    );
}
