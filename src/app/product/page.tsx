'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';

export default function ProductPage() {
    const router = useRouter();

    const [loading, setLoading] = useState(false);

    const [products, setProducts] = useState<any[]>([]);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/products');
                const data = await res.json();
                if (Array.isArray(data)) setProducts(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const { addToCart } = useCart();



    return (
        <div className="min-h-screen bg-[#0f0c29] text-white font-sans selection:bg-purple-500/30">
            <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[80vh]">
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 mb-4">Our Collection</h1>
                <p className="text-white/60 mb-8">Browse the complete range of future technology.</p>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
                        {products.map((product) => (
                            <div key={product.id} className="group bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1">
                                <div className={`h-64 rounded-xl bg-gradient-to-br ${product.color || 'from-gray-700 to-gray-900'} relative overflow-hidden mb-4 group-hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all`}>
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-all"></div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">{product.name}</h3>
                                            <p className="text-sm text-white/50">{product.category}</p>
                                        </div>
                                        <span className="text-lg font-bold text-white">{product.price}</span>
                                    </div>

                                    <div className="flex gap-2 mt-4">
                                        <button
                                            onClick={() => addToCart(product)}
                                            className="flex-1 py-2 bg-white/10 hover:bg-white text-white hover:text-black font-medium rounded-lg transition-all text-sm"
                                        >
                                            Add to Cart
                                        </button>
                                        <button
                                            onClick={() => { addToCart(product); router.push('/cart'); }}
                                            className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-all text-sm"
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
        </div>
    );
}
