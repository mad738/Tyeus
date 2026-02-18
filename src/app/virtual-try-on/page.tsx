'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

function Model({ url }: { url: string }) {
    const { scene } = useGLTF(url);
    const ref = useRef<THREE.Group>(null);

    // Auto-rotate
    useFrame((state) => {
        if (ref.current) {
            ref.current.rotation.y += 0.005;
        }
    });

    return <primitive object={scene} ref={ref} scale={2.5} position={[0, -2.5, 0]} />;
}

export default function VirtualTryOnPage() {
    const [modelUrl, setModelUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [wishlist, setWishlist] = useState<any[]>([]); // New State for Wishlist
    const [selectedProductModel, setSelectedProductModel] = useState<string | null>(null); // For product try-on

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    setError('Please log in to view your virtual try-on.');
                    return;
                }

                setUserId(user.id);

                // 1. Fetch User Model
                const { data: userData } = await supabase
                    .from('users')
                    .select('model_url')
                    .eq('id', user.id)
                    .single();

                if (userData?.model_url) {
                    setModelUrl(userData.model_url);
                }

                // 2. Fetch Wishlist (Products with models)
                const { data: wishlistData } = await supabase
                    .from('wishlist')
                    .select(`
                        id,
                        product:products (
                            id,
                            name,
                            price,
                            model_url,
                            color
                        )
                    `)
                    .eq('user_id', user.id);

                if (wishlistData) {
                    // Supabase join might return an array or object depending on relation type. 
                    // Safely handle both or cast.
                    const products = wishlistData.map(item => {
                        const prod = item.product;
                        return Array.isArray(prod) ? prod[0] : prod;
                    }).filter((p: any) => p && p.model_url);

                    setWishlist(products);
                }

            } catch (err) {
                console.error(err);
                setError('Failed to load data.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Helper to toggle product model
    const toggleProductModel = (url: string) => {
        if (selectedProductModel === url) {
            setSelectedProductModel(null); // Revert to user avatar
        } else {
            setSelectedProductModel(url); // Show product
        }
    };

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

            <main className="pt-24 min-h-screen flex relative overflow-hidden">

                {/* Wishlist Sidebar / Drawer */}
                <div className="absolute left-4 top-24 bottom-4 w-64 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl z-20 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-white/10">
                        <h2 className="font-bold text-white/90">My Wishlist</h2>
                        <p className="text-xs text-white/50">Click to try on available items</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {wishlist.length === 0 ? (
                            <div className="text-center py-8 text-white/30 text-sm">
                                No items with 3D models in wishlist.
                            </div>
                        ) : (
                            wishlist.map((product) => (
                                <button
                                    key={product.id}
                                    onClick={() => toggleProductModel(product.model_url)}
                                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${selectedProductModel === product.model_url
                                        ? 'bg-purple-500/20 border-purple-500/50 shadow-lg shadow-purple-500/10'
                                        : 'bg-white/5 border-white/5 hover:bg-white/10'
                                        }`}
                                >
                                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${product.color || 'from-gray-500 to-gray-600'} flex-shrink-0`} />
                                    <div>
                                        <p className="text-sm font-medium text-white/90 truncate">{product.name}</p>
                                        <p className="text-xs text-white/50">{product.price}</p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Main 3D Area */}
                <div className="flex-1 flex flex-col items-center justify-center relative">
                    {/* Background Elements */}
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                        <div className="absolute top-[20%] left-[20%] w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                        <div className="absolute top-[20%] right-[20%] w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                    </div>

                    <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
                        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 absolute top-0 mt-4">
                            {selectedProductModel ? 'Trying Product' : 'Your Virtual Avatar'}
                        </h1>

                        {loading ? (
                            <div className="text-white/50 animate-pulse text-lg">Loading...</div>
                        ) : error ? (
                            <div className="text-red-400 bg-red-500/10 px-6 py-4 rounded-xl">{error}</div>
                        ) : (modelUrl || selectedProductModel) ? (
                            <div className="w-full h-full max-h-[80vh] aspect-[4/3] max-w-5xl">
                                <Canvas shadows camera={{ position: [0, 0, 4], fov: 45 }}>
                                    <ambientLight intensity={0.6} />
                                    <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} shadow-mapSize={2048} castShadow />
                                    <Environment preset="city" />

                                    {/* Load Selected Product Model OR User Model */}
                                    <Model url={selectedProductModel || modelUrl!} />

                                    <ContactShadows position={[0, -2.5, 0]} opacity={0.5} scale={10} blur={1} far={10} resolution={256} color="#000000" />
                                    <OrbitControls
                                        minPolarAngle={Math.PI / 4}
                                        maxPolarAngle={Math.PI / 1.5}
                                        enableZoom={true}
                                        enablePan={false}
                                        minDistance={2}
                                        maxDistance={10}
                                    />
                                </Canvas>
                                <div className="absolute bottom-6 left-0 w-full text-center pointer-events-none">
                                    <p className="text-white/40 text-sm">
                                        {selectedProductModel ? 'Viewing Product Model' : 'Viewing Your Avatar'} • Drag to rotate
                                    </p>
                                </div>
                            </div>
                        ) : (
                            // Empty State (No Model)
                            <div className="text-center bg-white/5 border border-white/10 p-12 rounded-3xl backdrop-blur-md max-w-lg">
                                {/* ... (Same as before) ... */}
                                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">🤷‍♂️</div>
                                <h2 className="text-2xl font-bold mb-3">No Model Found</h2>
                                <p className="text-white/60 mb-8 leading-relaxed">
                                    You haven't been assigned a personalized 3D model yet.
                                    Please submit a request with your photos so our team can generate one for you.
                                </p>
                                <Link
                                    href="/request-try-on"
                                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl shadow-lg shadow-purple-900/20 transform transition-all hover:scale-105"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Request Model Now
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
