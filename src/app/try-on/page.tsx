"use client";

import React, { useState, useEffect, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, ContactShadows, useGLTF } from '@react-three/drei'
import { supabase } from '@/lib/supabaseClient'
import { Product } from '@/types'
import { useRouter } from 'next/navigation'

// Error Boundary for 3D Components
class ModelErrorBoundary extends React.Component<{ fallback: React.ReactNode, children: React.ReactNode }, { hasError: boolean }> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: any) {
        return { hasError: true };
    }

    componentDidCatch(error: any, errorInfo: any) {
        console.error("3D Model Error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback;
        }
        return this.props.children;
    }
}

// Human Model Component (Loads GLB)
function HumanModel({ url }: { url?: string }) {
    // Use custom URL or default
    const urlToLoad = url || '/human_body.glb';
    const { scene } = useGLTF(urlToLoad);
    return <primitive object={scene} position={[0, -1, 0]} scale={1.5} />;
}

// Fallback Human (Capsule)
function HumanPlaceholder() {
    return (
        <mesh position={[0, -1, 0]}>
            <capsuleGeometry args={[0.5, 2, 4]} />
            <meshStandardMaterial color="#e0e0e0" />
        </mesh>
    )
}

// Shirt/Product Model Component (Loads GLB)
function ProductModel({ product }: { product: Product }) {
    const { model_url, color } = product;
    const urlToLoad = model_url || '/shirt_gray.glb';

    if (!urlToLoad) throw new Error("No URL"); // Trigger Error Boundary

    const { scene } = useGLTF(urlToLoad);
    return <primitive object={scene} position={[0, 0, 0.6]} scale={1.5} />;
}

// Fallback Product (Box)
function ProductPlaceholder({ color }: { color?: string }) {
    const safeColor = color?.includes('from-') ? 'purple' : (color || 'blue');
    return (
        <mesh position={[0, 0, 0.6]}>
            <boxGeometry args={[0.5, 0.5, 0.5]} />
            <meshStandardMaterial color={safeColor} />
        </mesh>
    )
}

export default function TryOnScene() {
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [userModelUrl, setUserModelUrl] = useState<string | undefined>(undefined);

    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Products
                const { data: productData } = await supabase.from('products').select('*');
                if (productData) {
                    setProducts(productData.filter((p: any) => !p.is_hidden));
                }

                // 2. Fetch User & Custom Model
                const { data: { user }, error: authError } = await supabase.auth.getUser();

                if (authError) {
                    if (authError.message.includes("Refresh Token")) {
                        await supabase.auth.signOut();
                        router.push('/login');
                        return;
                    }
                }

                if (user) {
                    const { data: userData } = await supabase
                        .from('users')
                        .select('model_url')
                        .eq('id', user.id)
                        .single();

                    if (userData?.model_url) {
                        setUserModelUrl(userData.model_url);
                    }
                }

                setLoading(false);
            } catch (err: any) {
                console.error("Error fetching data:", err);
                if (err?.message?.includes("Refresh Token")) {
                    await supabase.auth.signOut();
                    router.push('/login');
                }
                setLoading(false);
            }
        };
        fetchData();
    }, [router]);

    const handleProductSelect = (product: Product) => {
        if (selectedProduct?.id === product.id) {
            setSelectedProduct(null);
        } else {
            setSelectedProduct(product);
        }
    }

    return (
        <div className="w-full h-screen flex bg-gray-50">
            {/* UI Sidebar */}
            <div className="p-6 bg-white w-80 z-10 shadow-xl overflow-y-auto">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Wishlist</h2>

                {loading ? (
                    <div className="text-gray-400">Loading items...</div>
                ) : (
                    <div className="space-y-3">
                        {products.map(product => (
                            <button
                                key={product.id}
                                onClick={() => handleProductSelect(product)}
                                className={`w-full p-4 rounded-xl text-left transition-all border-2 ${selectedProduct?.id === product.id
                                    ? 'border-purple-600 bg-purple-50 shadow-md'
                                    : 'border-transparent bg-gray-100 hover:bg-gray-200'
                                    }`}
                            >
                                <div className="font-bold text-gray-800">{product.name}</div>
                                <div className="text-sm text-gray-500">{product.category}</div>
                                <div className="text-xs font-mono text-purple-600 mt-1">{product.price}</div>
                                <div className="text-xs text-gray-400 mt-1">
                                    {selectedProduct?.id === product.id ? "Click to Take Off" : "Click to Try On"}
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {products.length === 0 && !loading && (
                    <div className="text-center text-gray-400 mt-10">
                        No items found. <br />Add products in the Admin Dashboard!
                    </div>
                )}
            </div>

            {/* 3D Canvas */}
            <div className="flex-1 relative">
                {/* Debug Info Overlay */}
                <div className="absolute top-4 right-4 z-50 bg-black/50 text-white p-2 text-xs rounded pointer-events-none">
                    <p>User Model: {userModelUrl ? "Custom" : "Default"}</p>
                    <p>Product: {selectedProduct ? selectedProduct.name : "None"}</p>
                </div>

                <Canvas camera={{ position: [0, 1, 4] }}>
                    <color attach="background" args={['#0f0c29']} />
                    <ambientLight intensity={0.7} />
                    <pointLight position={[10, 10, 10]} intensity={1} />

                    {/* Human: Show Placeholder WHILE loading, and IF error */}
                    <Suspense fallback={<HumanPlaceholder />}>
                        <ModelErrorBoundary fallback={<HumanPlaceholder />}>
                            <HumanModel url={userModelUrl} />
                        </ModelErrorBoundary>
                    </Suspense>

                    {/* Product: Show Placeholder WHILE loading, and IF error */}
                    <Suspense fallback={selectedProduct ? <ProductPlaceholder color={selectedProduct.color} /> : null}>
                        {selectedProduct && (
                            <ModelErrorBoundary fallback={<ProductPlaceholder color={selectedProduct.color} />}>
                                <ProductModel product={selectedProduct} />
                            </ModelErrorBoundary>
                        )}
                    </Suspense>

                    <ContactShadows opacity={0.5} scale={10} blur={2.5} far={4} color="#000000" />
                    <OrbitControls target={[0, 0.5, 0]} maxPolarAngle={Math.PI / 1.5} />
                </Canvas>

                {/* Overlay Info */}
                {selectedProduct && (
                    <div className="absolute top-8 left-8 bg-black/30 backdrop-blur-md p-4 rounded-xl text-white border border-white/10">
                        <h3 className="text-xl font-bold">{selectedProduct.name}</h3>
                        <p className="text-white/60 text-sm">Now Trying On</p>
                    </div>
                )}
            </div>
        </div>
    )
}
