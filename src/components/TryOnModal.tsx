import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface TryOnModalProps {
    isOpen: boolean;
    onClose: () => void;
    productImageUrl: string;
}

export default function TryOnModal({ isOpen, onClose, productImageUrl }: TryOnModalProps) {
    const [userPhotoUrl, setUserPhotoUrl] = useState<string | null>(null);
    const [userPhotoFile, setUserPhotoFile] = useState<File | null>(null);
    const [generating, setGenerating] = useState(false);
    const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loadingExisting, setLoadingExisting] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            const fetchExistingPhoto = async () => {
                setLoadingExisting(true);
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        const { data, error } = await supabase
                            .from('try_on_requests')
                            .select('image_url')
                            .eq('user_id', user.id)
                            .order('created_at', { ascending: false })
                            .limit(1);

                        // Use the most recent uploaded photo if it exists
                        if (!error && data && data.length > 0) {
                            setUserPhotoUrl(data[0].image_url);
                        }
                    }
                } catch (err) {
                    console.error('Error fetching existing photo:', err);
                } finally {
                    setLoadingExisting(false);
                }
            };
            fetchExistingPhoto();
        } else {
            // reset state on close
            setUserPhotoUrl(null);
            setUserPhotoFile(null);
            setResultImageUrl(null);
            setError(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUserPhotoFile(file);
            setUserPhotoUrl(URL.createObjectURL(file));
            setResultImageUrl(null);
            setError(null);
        }
    };

    const handleTryOn = async () => {
        if (!userPhotoFile && !userPhotoUrl) return;

        setGenerating(true);
        setError(null);

        try {
            // 1. Prepare User Photo
            let humanBlob: Blob;
            if (userPhotoFile) {
                humanBlob = userPhotoFile;
            } else if (userPhotoUrl) {
                const userRes = await fetch(userPhotoUrl);
                humanBlob = await userRes.blob();
            } else {
                throw new Error("No user photo found");
            }

            // 2. Prepare Product Photo
            const productRes = await fetch(productImageUrl);
            if (!productRes.ok) throw new Error("Failed to fetch product image");
            const productBlob = await productRes.blob();

            // 3. Import Gradio Client dynamically (frontend works better for long tasks)
            const { client } = await import('@gradio/client');

            console.log("Connecting directly to Hugging Face Space...");
            // Notice: Using the public Space directly helps bypass Vercel server limits
            const app = await client('yisol/IDM-VTON');

            console.log("Connected! Generating image in your browser (no timeout)...");

            // 4. Run the Prediction directly
            const result = await app.predict('/tryon', {
                dict: {
                    background: humanBlob,
                    layers: [],
                    composite: null
                },
                garm_img: productBlob,
                garment_des: 'shirt',
                is_checked: true,
                is_checked_crop: false,
                denoise_steps: 30,
                seed: 42
            });

            const outputData: any = result.data;
            const finalImageUrl = outputData?.[0]?.url || null;

            if (!finalImageUrl) {
                throw new Error("AI did not return an image. The Space might be overloaded.");
            }

            setResultImageUrl(finalImageUrl);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'An error occurred. Please try again in a few moments.');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-4xl bg-[#0f0c29] border border-purple-500/30 rounded-3xl shadow-[0_0_50px_rgba(168,85,247,0.2)] overflow-hidden flex flex-col md:flex-row">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-50 text-white/50 hover:text-white bg-black/50 hover:bg-black/80 w-8 h-8 rounded-full flex items-center justify-center transition-all"
                >
                    ✕
                </button>

                {/* Left Side: Photo Upload */}
                <div className="w-full md:w-1/2 p-8 border-b md:border-b-0 md:border-r border-white/10 flex flex-col items-center justify-center relative min-h-[400px]">
                    <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500 mb-6 uppercase tracking-widest text-center">
                        Your Avatar
                    </h3>

                    {userPhotoUrl ? (
                        <div className="relative w-full aspect-[3/4] max-w-sm rounded-2xl overflow-hidden border-2 border-purple-500/30 group">
                            <img src={userPhotoUrl} alt="User" className="w-full h-full object-cover" />
                            {generating && (
                                <div className="absolute inset-0 bg-purple-900/40 backdrop-blur-sm flex flex-col items-center justify-center">
                                    {/* Scanning Animation */}
                                    <div className="absolute top-0 left-0 w-full h-1 bg-neon-cyan shadow-[0_0_15px_#0ff] animate-scan"></div>
                                    <div className="text-white font-bold tracking-widest uppercase animate-pulse">Running AI Model...</div>
                                </div>
                            )}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={generating}
                                className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 backdrop-blur text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                            >
                                Change Photo
                            </button>
                        </div>
                    ) : (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full aspect-[3/4] max-w-sm rounded-2xl border-2 border-dashed border-white/20 hover:border-purple-400/50 flex flex-col items-center justify-center cursor-pointer transition-colors bg-white/5 hover:bg-white/10"
                        >
                            <svg className="w-12 h-12 text-white/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-white/50 text-sm">Click to upload full-body photo</span>
                        </div>
                    )}

                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handlePhotoSelect}
                    />
                </div>

                {/* Right Side: Result */}
                <div className="w-full md:w-1/2 p-8 flex flex-col items-center justify-center relative min-h-[400px] bg-gradient-to-br from-purple-900/20 to-black">
                    <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neon-purple to-neon-pink mb-6 uppercase tracking-widest text-center">
                        Legendary Drop
                    </h3>

                    {resultImageUrl ? (
                        <div className="relative w-full aspect-[3/4] max-w-sm rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(217,70,239,0.3)] border border-pink-500/30">
                            <img src={resultImageUrl} alt="Generated Result" className="w-full h-full object-cover" />
                            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-center pb-4">
                                <span className="text-neon-cyan font-bold tracking-widest text-sm uppercase drop-shadow-[0_0_5px_rgba(0,255,255,0.8)]">Equipped</span>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full aspect-[3/4] max-w-sm rounded-2xl border border-white/5 bg-black/40 flex flex-col items-center justify-center relative overflow-hidden">
                            {/* Garment Preview Overlay */}
                            <div className="absolute inset-0 opacity-20 filter blur-sm">
                                {productImageUrl && <img src={productImageUrl} alt="Garment" className="w-full h-full object-cover" />}
                            </div>

                            {loadingExisting ? (
                                <div className="z-10 text-center px-6 mt-8">
                                    <div className="w-10 h-10 border-4 border-purple-500 border-t-pink-500 rounded-full animate-spin mx-auto mb-4 shadow-[0_0_15px_#d946ef]"></div>
                                    <p className="text-white/60 font-bold animate-pulse text-sm uppercase tracking-widest">Loading Avatar...</p>
                                </div>
                            ) : generating ? (
                                <div className="z-10 text-center">
                                    <div className="w-16 h-16 border-4 border-purple-500 border-t-pink-500 rounded-full animate-spin mx-auto mb-4 shadow-[0_0_15px_#d946ef]"></div>
                                    <p className="text-white font-bold animate-pulse text-sm uppercase tracking-widest">Generating Asset...</p>
                                </div>
                            ) : (
                                <div className="z-10 text-center px-6">
                                    <p className="text-white/40 text-sm mb-6">Upload your photo to see this item equipped using Gemini 3.1 Pro AI.</p>
                                    <button
                                        onClick={handleTryOn}
                                        disabled={!userPhotoFile && !userPhotoUrl}
                                        className="legendary-btn px-8 py-3 rounded-xl text-white font-bold uppercase tracking-wider text-sm disabled:opacity-50 disabled:grayscale transition-all hover:scale-105"
                                    >
                                        Initiate Try-On
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 p-3 bg-red-900/50 border border-red-500/50 rounded-lg text-red-200 text-sm text-center w-full max-w-sm backdrop-blur-md">
                            <span className="font-bold mr-2">SYS_ERR:</span> {error}
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                @keyframes scan {
                    0% { top: 0; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                .animate-scan {
                    animation: scan 2s linear infinite;
                }
                .text-neon-cyan { color: #00f3ff; }
                .text-neon-purple { color: #b026ff; }
                .text-neon-pink { color: #ff007f; }
            `}</style>
        </div>
    );
}
