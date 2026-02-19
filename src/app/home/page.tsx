'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Product } from '@/types';
import { supabase } from '@/lib/supabaseClient';
import { useCart } from '@/context/CartContext';

export default function HomePage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [wishlist, setWishlist] = useState<number[]>([]);
    const [user, setUser] = useState<any>(null);
    const { addToCart, cartCount } = useCart();

    useEffect(() => {
        const fetchUserAndData = async () => {
            setLoading(true);
            try {
                // 1. Get User
                const { data: { user } } = await supabase.auth.getUser();
                setUser(user);

                // 2. Fetch Products
                const itemsRes = await fetch('/api/products');
                const itemsData = await itemsRes.json();
                if (Array.isArray(itemsData)) setProducts(itemsData);

                if (user) {
                    // 3. Fetch Wishlist
                    const { data: wishlistData } = await supabase
                        .from('wishlist')
                        .select('product_id')
                        .eq('user_id', user.id);

                    if (wishlistData) {
                        setWishlist(wishlistData.map((item: any) => item.product_id));
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchUserAndData();
    }, []);

    const toggleWishlist = async (productId: number) => {
        if (!user) {
            alert('Please login to use wishlist');
            return;
        }

        const isWished = wishlist.includes(productId);

        try {
            if (isWished) {
                // Remove
                await supabase
                    .from('wishlist')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('product_id', productId);

                setWishlist(prev => prev.filter(id => id !== productId));
            } else {
                // Add
                await supabase
                    .from('wishlist')
                    .insert({ user_id: user.id, product_id: productId });

                setWishlist(prev => [...prev, productId]);
            }
        } catch (error) {
            console.error('Error updating wishlist:', error);
        }
    };

    const handleAddToCart = async (product: Product) => {
        await addToCart(product);
        alert('Added to Cart!');
    };

    const [selectedCategory, setSelectedCategory] = useState('All Products');

    // Filter logic
    const filteredProducts = selectedCategory === 'All Products'
        ? products
        : products.filter(product => product.category === selectedCategory);

    const scrollToProducts = () => {
        document.getElementById('product-grid')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-[#0f0c29] text-white font-sans selection:bg-purple-500/30">

            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-[#0f0c29]/80 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex-shrink-0 font-bold text-2xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 mr-8">
                            NEBULA<span className="text-white">STORE</span>
                        </div>

                        {/* Menu Links */}
                        <div className="hidden md:flex items-center space-x-8">
                            <Link href="/home" className="text-white hover:text-purple-300 transition-colors font-medium">Home</Link>
                            <Link href="/product" className="text-white/70 hover:text-white transition-colors font-medium">Product</Link>
                            <Link href="/request-try-on" className="text-white/70 hover:text-white transition-colors font-medium">Request Try-On</Link>
                            <Link href="/virtual-try-on" className="text-white/70 hover:text-purple-300 transition-colors font-medium relative group">
                                <span>Virtual Try-On</span>
                                <span className="absolute -top-3 -right-3 text-[9px] bg-gradient-to-r from-pink-500 to-purple-500 px-1.5 py-0.5 rounded-full">NEW</span>
                            </Link>
                            <Link href="/cart" className="text-white/70 hover:text-purple-300 transition-colors font-medium">Cart</Link>
                        </div>

                        <div className="hidden md:block flex-1 max-w-sm mx-8">
                            <div className="relative group">
                                <input
                                    type="text"
                                    className="w-full bg-white/5 border border-white/10 rounded-full py-2 px-4 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-white placeholder-white/30"
                                    placeholder="Search..."
                                />
                                <svg className="w-4 h-4 text-white/40 absolute left-3.5 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <Link href="/cart">
                                <button className="p-2 hover:bg-white/10 rounded-full transition-colors relative">
                                    <svg className="w-6 h-6 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                    {cartCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-purple-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-[#0f0c29]">
                                            {cartCount}
                                        </span>
                                    )}
                                </button>
                            </Link>

                            <Link href="/profile">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-[2px] cursor-pointer hover:shadow-lg hover:shadow-purple-500/30 transition-shadow">
                                    <div className="w-full h-full rounded-full bg-[#0f0c29] flex items-center justify-center">
                                        <span className="text-xs font-bold">
                                            {user?.user_metadata?.full_name ? user.user_metadata.full_name.charAt(0) : 'U'}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

                {/* Hero Section */}
                <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 mb-12 shadow-2xl border border-white/10">
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-purple-500 rounded-full mix-blend-screen filter blur-[100px] opacity-30"></div>
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-blue-500 rounded-full mix-blend-screen filter blur-[100px] opacity-30"></div>

                    <div className="relative z-10 px-8 py-16 md:py-20 md:px-12 flex flex-col md:flex-row items-center justify-between">
                        <div className="max-w-xl text-center md:text-left">
                            <span className="inline-block py-1 px-3 rounded-full bg-white/10 border border-white/20 text-xs font-semibold tracking-wide text-purple-300 mb-4">NEW COLLECTION</span>
                            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">Future Tech <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Arrived Today</span></h1>
                            <p className="text-lg text-white/70 mb-8 max-w-md mx-auto md:mx-0">Experience the next generation of gadgets with our exclusive holographic series.</p>
                            <button
                                onClick={scrollToProducts}
                                className="px-8 py-3 bg-white text-purple-900 font-bold rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transform hover:-translate-y-1 transition-all duration-300"
                            >
                                Explore Now
                            </button>
                        </div>

                        {/* Abstract 3D shape placeholder using CSS */}
                        <div className="mt-12 md:mt-0 relative w-64 h-64 md:w-80 md:h-80 perspective-1000 animate-float">
                            <div className="w-full h-full relative transform-style-3d rotate-y-12 rotate-x-12">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/40 to-pink-500/40 backdrop-blur-md rounded-3xl border border-white/30 transform translate-z-10"></div>
                                <div className="absolute inset-0 bg-gradient-to-tl from-blue-500/40 to-cyan-500/40 backdrop-blur-md rounded-3xl border border-white/30 transform -translate-x-4 -translate-y-4 translate-z-0"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Categories */}
                <div className="flex gap-4 overflow-x-auto pb-8 scrollbar-hide">
                    {['All Products', 'Electronics', 'Fashion', 'Gaming', 'Home'].map((cat, i) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-6 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${selectedCategory === cat ? 'bg-white text-black' : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/5'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Product Grid */}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-20 text-white/50">
                        <p className="text-xl">No products found in this category.</p>
                        <p className="text-sm mt-2">Try selecting 'All Products' or check back later.</p>
                    </div>
                ) : (
                    <div id="product-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredProducts.map((product) => (
                            <div key={product.id} className="group bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1">
                                {/* Product Image Placeholder */}
                                <div className={`h-64 rounded-xl bg-gradient-to-br ${product.color || 'from-gray-700 to-gray-900'} relative overflow-hidden mb-4 group-hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all`}>
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-all"></div>
                                    <button
                                        onClick={() => toggleWishlist(product.id)}
                                        className={`absolute top-3 right-3 p-2 backdrop-blur-md rounded-full transition-all ${wishlist.includes(product.id) ? 'bg-pink-500 text-white' : 'bg-black/20 text-white hover:bg-white hover:text-red-500'}`}
                                    >
                                        <svg className="w-5 h-5" fill={wishlist.includes(product.id) ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">{product.name}</h3>
                                            <p className="text-sm text-white/50">{product.category}</p>
                                        </div>
                                        <span className="text-lg font-bold text-white">{product.price}</span>
                                    </div>

                                    <button
                                        onClick={() => handleAddToCart(product)}
                                        className="w-full py-2.5 mt-2 bg-white/10 hover:bg-white text-white hover:text-black font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                        </svg>
                                        Add to Cart
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </main>

            {/* Floating Blobs for page bg */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[20%] left-[-10%] w-96 h-96 bg-purple-900/40 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-blue-900/40 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
            </div>

        </div>
    );
}
