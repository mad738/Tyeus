'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import React from 'react';

// --- 3D Components ---

// Error Boundary
class ModelErrorBoundary extends React.Component<{ fallback: React.ReactNode, children: React.ReactNode }, { hasError: boolean }> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError(error: any) { return { hasError: true }; }
    componentDidCatch(error: any, errorInfo: any) { console.error("3D Model Error:", error, errorInfo); }
    render() {
        if (this.state.hasError) return this.props.fallback;
        return this.props.children;
    }
}

// Full Avatar Group (Human + Product)
// Grouping ensures they share the exact same origin/transform
function AvatarGroup({ userUrl, productUrl }: { userUrl?: string | null, productUrl?: string | null }) {
    return (
        <group>
            {/* HUMAN: Always visible */}
            <Suspense fallback={<HumanPlaceholder />}>
                <ModelErrorBoundary fallback={<HumanPlaceholder />}>
                    <HumanModel url={userUrl || undefined} />
                </ModelErrorBoundary>
            </Suspense>

            {/* SHIRT: Only visible when URL is present */}
            {productUrl && (
                <Suspense fallback={<ProductPlaceholder />}>
                    <ModelErrorBoundary fallback={<ProductPlaceholder />}>
                        <ProductModel url={productUrl} />
                    </ModelErrorBoundary>
                </Suspense>
            )}
        </group>
    )
}

// Human Model
function HumanModel({ url }: { url?: string }) {
    // Fix 404: If no custom URL is provided, do NOT try to fetch '/human_body.glb' (it is missing).
    // Just return the placeholder geometry directly.
    if (!url) {
        return (
            <mesh position={[0, -2.5, 0]}>
                <capsuleGeometry args={[0.8, 3.5, 4]} />
                <meshStandardMaterial color="#e0e0e0" />
            </mesh>
        );
    }

    const { scene } = useGLTF(url);
    // Clone to avoid sharing state if multiple instances (though unlikely here)
    const sceneClone = React.useMemo(() => scene.clone(), [scene]);
    // Remove manual position/scale to rely on Blender export
    return <primitive object={sceneClone} />;
}

function ProductModel({ url }: { url: string }) {
    const { scene } = useGLTF(url);
    // Remove manual scale to rely on Blender export
    return <primitive object={scene} />;
}

// Placeholders (Scaled to match parent group)
function HumanPlaceholder() {
    return (
        <mesh position={[0, 1, 0]}>
            <capsuleGeometry args={[0.3, 1.4, 4]} />
            <meshStandardMaterial color="#e0e0e0" />
        </mesh>
    )
}
function ProductPlaceholder() {
    return (
        <mesh position={[0, 1.2, 0.1]}>
            <boxGeometry args={[0.4, 0.4, 0.4]} />
            <meshStandardMaterial color="purple" />
        </mesh>
    )
}

// --- Main Page Component ---

export default function VirtualTryOnPage() {
    // State
    const [userModelUrl, setUserModelUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [wishlist, setWishlist] = useState<any[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    setError('Please log in to view your virtual try-on.');
                    return;
                }

                // 1. Fetch User Model
                const { data: userData } = await supabase
                    .from('users')
                    .select('model_url')
                    .eq('id', user.id)
                    .single();

                if (userData?.model_url) setUserModelUrl(userData.model_url);

                // 2. Fetch Wishlist
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
                    const products = wishlistData.map(item => {
                        const prod = item.product;
                        return Array.isArray(prod) ? prod[0] : prod;
                    }).filter((p: any) => p);
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

    const toggleProduct = (product: any) => {
        if (selectedProduct?.id === product.id) {
            setSelectedProduct(null); // Take off
        } else {
            setSelectedProduct(product); // Put on
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
                {/* Wishlist Sidebar */}
                <div className="absolute left-4 top-24 bottom-4 w-64 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl z-20 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-white/10">
                        <h2 className="font-bold text-white/90">My Wishlist</h2>
                        <p className="text-xs text-white/50">Click to try on available items</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {wishlist.length === 0 ? (
                            <div className="text-center py-8 text-white/30 text-sm">
                                Your wishlist is empty.
                            </div>
                        ) : (
                            wishlist.map((product) => (
                                <button
                                    key={product.id}
                                    onClick={() => toggleProduct(product)}
                                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${selectedProduct?.id === product.id
                                        ? 'bg-purple-500/20 border-purple-500/50 shadow-lg shadow-purple-500/10'
                                        : 'bg-white/5 border-white/5 hover:bg-white/10'
                                        }`}
                                >
                                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${product.color || 'from-gray-500 to-gray-600'} flex-shrink-0`} />
                                    <div>
                                        <p className="text-sm font-medium text-white/90 truncate">{product.name}</p>
                                        <p className="text-xs text-white/50">{product.price}</p>
                                    </div>
                                    <div className="ml-auto text-xs text-white/50">
                                        {selectedProduct?.id === product.id ? "On" : "Off"}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Main 3D Area */}
                <div className="flex-1 flex flex-col items-center justify-center relative">
                    {/* Background */}
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                        <div className="absolute top-[20%] left-[20%] w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                        <div className="absolute top-[20%] right-[20%] w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                    </div>

                    <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
                        {/* Debug Info */}
                        <div className="absolute top-4 right-4 z-50 bg-black/50 text-white p-2 text-xs rounded pointer-events-none">
                            <p>User Model: {userModelUrl ? "Custom" : "Default"}</p>
                            <p>Product: {selectedProduct ? selectedProduct.name : "None"}</p>
                        </div>

                        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 absolute top-0 mt-4">
                            {selectedProduct ? 'Trying Product' : 'Your Virtual Avatar'}
                        </h1>

                        <div className="w-full max-w-4xl aspect-[4/3] relative group">
                            {/* Frame Container */}
                            <div className="absolute inset-0 bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">

                                {/* Inner Shadow for Depth */}
                                <div className="absolute inset-0 shadow-[inset_0_0_50px_rgba(0,0,0,0.5)] pointer-events-none z-10 rounded-3xl" />

                                <Canvas shadows camera={{ position: [0, 0, 4.5], fov: 40 }} className="rounded-3xl cursor-grab active:cursor-grabbing">
                                    <color attach="background" args={['#000000']} />
                                    <ambientLight intensity={0.7} />
                                    <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} shadow-mapSize={2048} castShadow intensity={1.5} />
                                    <Environment preset="city" />

                                    {/* STAGE: Circular platform at feet */}
                                    <mesh receiveShadow position={[0, -0.1, 0]}>
                                        <cylinderGeometry args={[2.5, 2.5, 0.2, 64]} />
                                        <meshStandardMaterial color="#1a1a1a" roughness={0.8} metalness={0.2} />
                                    </mesh>

                                    {/* AVATAR GROUP: Contains Human + Product with shared scaling/position */}
                                    <AvatarGroup
                                        userUrl={userModelUrl}
                                        productUrl={selectedProduct?.model_url}
                                    />

                                    <ContactShadows position={[0, 0.01, 0]} opacity={0.6} scale={10} blur={2} far={4} resolution={256} color="#000000" />

                                    <OrbitControls
                                        minPolarAngle={Math.PI / 4}
                                        maxPolarAngle={Math.PI / 2} // Don't allow going below the floor
                                        minAzimuthAngle={-Math.PI / 1.5} // Limit horizontal rotation
                                        maxAzimuthAngle={Math.PI / 1.5}
                                        enableZoom={true}
                                        enablePan={false} // Important: prevents moving the model out of frame
                                        minDistance={2.5}
                                        maxDistance={6}
                                        target={[0, 0.8, 0]} // Focus on the center of the body (approx chest/waist)
                                    />
                                </Canvas>

                                {/* Instruction Overlay */}
                                <div className="absolute bottom-6 left-0 w-full text-center pointer-events-none z-20">
                                    <p className="text-white/40 text-sm font-medium tracking-wide uppercase">
                                        {selectedProduct ? 'Viewing Product Model' : 'Viewing Your Avatar'} • Drag to rotate
                                    </p>
                                </div>
                            </div>

                            {/* Decorative framing elements outside */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-[2rem] blur opacity-50 -z-10 group-hover:opacity-75 transition duration-1000"></div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
