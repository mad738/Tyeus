'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Product, Review } from '@/types';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import TryOnModal from '@/components/TryOnModal';
import toast from 'react-hot-toast';

export default function ProductDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const productId = params.id as string;

    const [product, setProduct] = useState<Product | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string>('');
    const [user, setUser] = useState<any>(null);

    // Review form state
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);

    // Try-On State
    const [isTryOnModalOpen, setIsTryOnModalOpen] = useState(false);

    const { addToCart } = useCart();

    useEffect(() => {
        const fetchProductAndReviews = async () => {
            setLoading(true);
            try {
                // Get user
                const { data: { session } } = await supabase.auth.getSession();
                setUser(session?.user || null);

                // Fetch product
                const { data: productData, error: productError } = await supabase
                    .from('products')
                    .select('*')
                    .eq('id', productId)
                    .single();

                if (productError) throw productError;
                setProduct(productData);

                // Set initial main image
                if (productData.main_image) {
                    setSelectedImage(productData.main_image);
                } else if (productData.images && productData.images.length > 0) {
                    setSelectedImage(productData.images[0]);
                }

                // Fetch reviews with user details
                const { data: reviewsData, error: reviewsError } = await supabase
                    .from('product_reviews')
                    .select('*, users(name)')
                    .eq('product_id', productId)
                    .order('created_at', { ascending: false });

                if (!reviewsError && reviewsData) {
                    setReviews(reviewsData as any[]);
                }

            } catch (error) {
                console.error('Error fetching details:', error);
            } finally {
                setLoading(false);
            }
        };

        if (productId) {
            fetchProductAndReviews();
        }
    }, [productId]);

    const handleAddReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast.error('Please login to leave a review.');
            return;
        }

        setSubmittingReview(true);
        try {
            const { error, data } = await supabase
                .from('product_reviews')
                .insert([{
                    product_id: parseInt(productId),
                    user_id: user.id,
                    rating,
                    comment
                }]).select('*, users(name)');

            if (error) throw error;

            if (data && data.length > 0) {
                setReviews([data[0] as any, ...reviews]);
                setComment('');
                setRating(5);
                toast.success('Review submitted successfully!');
            }
        } catch (error) {
            console.error('Submit review error:', error);
            toast.error('Failed to submit review.');
        } finally {
            setSubmittingReview(false);
        }
    };

    const allImages = product
        ? [
            ...(product.main_image ? [product.main_image] : []),
            ...(product.images || [])
        ]
        : [];

    useEffect(() => {
        const container = document.getElementById('gallery-container');
        if (!container) return;

        const handleScroll = () => {
            const scrollPosition = container.scrollLeft;
            const index = Math.round(scrollPosition / container.clientWidth);
            if (allImages[index] && allImages[index] !== selectedImage) {
                setSelectedImage(allImages[index]);
            }
        };

        container.addEventListener('scroll', handleScroll, { passive: true });
        return () => container.removeEventListener('scroll', handleScroll);
    }, [allImages, selectedImage]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#fafafa] text-gray-800 flex justify-center items-center">
                <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-[#fafafa] text-gray-800 flex flex-col justify-center items-center">
                <h1 className="text-2xl font-bold mb-4">Product not found.</h1>
                <button onClick={() => router.back()} className="text-orange-500 hover:text-orange-600 font-medium">Go Back</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fafafa] text-gray-800 font-sans pb-24 md:pb-6">
            {/* Top Navigation */}
            <nav className="bg-white px-4 py-4 flex items-center justify-between sticky top-0 z-50 border-b border-gray-100 shadow-sm">
                <button onClick={() => router.back()} className="text-gray-800 p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors" aria-label="Back">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                <Link href="/home" className="text-xl font-bold tracking-tight flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                    <img src="/logo.png" alt="TYEUS Logo" className="w-7 h-7 rounded-sm shadow-sm" />
                    <div>
                        <span className="text-[#0066cc]">TY</span>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#0066cc] to-[#00cc99]">EUS</span>
                    </div>
                </Link>

                <div className="w-10"></div> {/* Placeholder for flex center */}
            </nav>

            <main className="max-w-lg mx-auto md:max-w-7xl pt-4 px-4 md:px-8">
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 pb-10">

                    {/* Left: Gallery */}
                    <div className="w-full lg:w-1/2">
                        {allImages.length === 0 ? (
                            <div className="w-full aspect-square rounded-2xl bg-gray-200 flex items-center justify-center text-gray-400 text-lg font-bold">
                                No Image
                            </div>
                        ) : (
                            <div className="w-full relative rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100">
                                <div
                                    className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide scroll-smooth aspect-square"
                                    id="gallery-container"
                                >
                                    {allImages.map((img, idx) => (
                                        <div key={idx} className="w-full min-w-full h-full snap-start flex-shrink-0 relative">
                                            <img src={img} alt={`${product.name} - View ${idx + 1}`} className="w-full h-full object-contain p-4" />
                                        </div>
                                    ))}
                                </div>

                                {/* Virtual Try-On Badge */}
                                {product.model_url && (
                                    <div className="absolute top-3 right-3 bg-[#00cc99] text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm z-10 uppercase tracking-wide">
                                        3D View
                                    </div>
                                )}

                                {/* Image Map Indicators */}
                                {allImages.length > 1 && (
                                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
                                        {allImages.map((img, idx) => (
                                            <button
                                                key={`dot-${idx}`}
                                                onClick={() => {
                                                    const container = document.getElementById('gallery-container');
                                                    if (container) {
                                                        container.scrollTo({ left: container.clientWidth * idx, behavior: 'smooth' });
                                                        setSelectedImage(img);
                                                    }
                                                }}
                                                className={`w-2 h-2 rounded-full transition-all duration-300 ${selectedImage === img ? 'bg-orange-500 scale-125' : 'bg-gray-300 hover:bg-gray-400'}`}
                                                aria-label={`View ${idx + 1}`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Thumbnails */}
                        {allImages.length > 1 && (
                            <div className="flex gap-3 overflow-x-auto py-4 scrollbar-hide">
                                {allImages.map((img, idx) => (
                                    <button
                                        key={`thumb-${idx}`}
                                        onClick={() => {
                                            const container = document.getElementById('gallery-container');
                                            if (container) {
                                                container.scrollTo({ left: container.clientWidth * idx, behavior: 'smooth' });
                                                setSelectedImage(img);
                                            }
                                        }}
                                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all p-1 bg-white ${selectedImage === img ? 'border-orange-500' : 'border-gray-200 hover:border-orange-300'}`}
                                    >
                                        <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-contain" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Product Details */}
                    <div className="w-full lg:w-1/2 flex flex-col pt-2 lg:pt-0">
                        <div className="mb-1">
                            <span className="text-orange-500 font-bold text-xs tracking-wider uppercase bg-orange-50 px-2 py-1 rounded">{product.category}</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2 mb-3 leading-tight">{product.name}</h1>

                        <div className="flex items-center gap-2 mb-6">
                            <span className="text-3xl font-extrabold text-[#1a237e]">${product.price}</span>
                        </div>

                        <div className="prose text-sm text-gray-600 mb-8 border-t border-b border-gray-100 py-6">
                            <p className="leading-relaxed">
                                {product.description || "Experience the pinnacle of forward-thinking design and cutting-edge features. This item provides uncompromised performance and is built specifically to integrate seamlessly into your daily life."}
                            </p>
                            <ul className="mt-4 space-y-2 list-disc pl-4 text-gray-500">
                                <li>Premium build quality</li>
                                <li>1-Year digital warranty</li>
                                <li>Free standard shipping</li>
                            </ul>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3 mt-auto">
                            <div className="flex gap-3">
                                <button
                                    onClick={() => { addToCart(product); toast.success('Added to cart!'); }}
                                    className="flex-1 py-3 bg-white border-2 border-orange-500 text-orange-500 font-bold rounded-xl transition-colors hover:bg-orange-50 flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    Add to Cart
                                </button>
                                <button
                                    onClick={() => { addToCart(product); router.push('/cart'); }}
                                    className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-md shadow-orange-500/20 transition-all"
                                >
                                    Buy Now
                                </button>
                            </div>

                            {/* Try-On Button */}
                            <button
                                onClick={() => setIsTryOnModalOpen(true)}
                                className="w-full py-3.5 mt-2 bg-gradient-to-r from-[#0066cc] to-[#00cc99] hover:opacity-90 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 uppercase tracking-wide text-sm"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                Virtual Try-On
                            </button>
                        </div>
                    </div>
                </div>

                {/* Reviews Section */}
                <div className="mt-8 border-t border-gray-100 pt-8 pb-10">
                    <h2 className="text-xl font-bold mb-6 text-gray-900 flex items-center gap-2">
                        Customer Reviews
                        <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full font-medium">{reviews.length}</span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                        {/* Write a Review */}
                        <div className="md:col-span-5 lg:col-span-4 bg-white border border-gray-100 p-6 rounded-2xl h-fit shadow-sm">
                            <h3 className="text-base font-bold text-gray-800 mb-4">Write a Review</h3>
                            {user ? (
                                <form onSubmit={handleAddReview} className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-gray-600 font-medium mb-1.5">Rating</label>
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setRating(star)}
                                                    className="focus:outline-none transition-transform hover:scale-110"
                                                >
                                                    <svg className={`w-8 h-8 ${rating >= star ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                    </svg>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 font-medium mb-1.5">Your Comment</label>
                                        <textarea
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            required
                                            rows={3}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none text-sm"
                                            placeholder="What do you think about this product?"
                                        ></textarea>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={submittingReview}
                                        className="w-full py-3 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-xl transition-all disabled:opacity-50 text-sm mt-2"
                                    >
                                        {submittingReview ? 'Submitting...' : 'Submit Review'}
                                    </button>
                                </form>
                            ) : (
                                <div className="text-center py-6 bg-gray-50 rounded-xl border border-gray-100">
                                    <p className="text-gray-500 text-sm mb-3">You must be logged in to review.</p>
                                    <Link href="/" className="inline-block px-5 py-2 bg-white rounded-lg text-sm font-medium text-orange-500 border border-gray-200 hover:border-orange-500 transition-colors">
                                        Login to Review
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Review List */}
                        <div className="md:col-span-7 lg:col-span-8 flex flex-col gap-4">
                            {reviews.length === 0 ? (
                                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-10 text-center flex flex-col items-center justify-center min-h-[200px]">
                                    <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    <p className="text-gray-500 text-sm">No reviews yet. Be the first!</p>
                                </div>
                            ) : (
                                reviews.map((review) => (
                                    <div key={review.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#1a237e] font-bold text-sm">
                                                    {(review as any).users?.name?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-800 text-sm">{(review as any).users?.name || 'Anonymous User'}</div>
                                                    <div className="text-xs text-gray-400 mt-0.5">{new Date(review.created_at).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                            <div className="flex gap-0.5 bg-yellow-50 px-2 py-1 rounded-lg">
                                                {[...Array(5)].map((_, i) => (
                                                    <svg key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'text-yellow-400' : 'text-yellow-100'}`} fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                    </svg>
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-gray-600 text-sm leading-relaxed pl-13">
                                            {review.comment}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <TryOnModal
                isOpen={isTryOnModalOpen}
                onClose={() => setIsTryOnModalOpen(false)}
                productImageUrl={allImages.length > 0 ? allImages[0] : ''}
            />
        </div>
    );
}
