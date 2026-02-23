'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
    const { items, cartTotal, clearCart } = useCart();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        pincode: '',
        address: '', // House No, Building
        area: '',    // Street, Area
        city: '',
        state: '',
        landmark: ''
    });

    const [paymentMethod, setPaymentMethod] = useState('COD'); // Default COD

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login?redirect=/checkout');
                return;
            }
            setUser(user);
            // Pre-fill name if available
            if (user.user_metadata?.full_name) {
                setFormData(prev => ({ ...prev, name: user.user_metadata.full_name }));
            }
        };
        getUser();
    }, [router]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePlaceOrder = async () => {
        if (!user) return;

        // Basic Validation
        if (!formData.name || !formData.phone || !formData.address || !formData.pincode) {
            toast.error("Please fill in all required address fields.");
            return;
        }

        const WHATSAPP_NUMBER = "916301612645"; // TODO: Replace with actual business WhatsApp number

        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId: user.id,
                    items,
                    total: cartTotal,
                    shipping: {
                        name: formData.name,
                        phone: formData.phone,
                        pincode: formData.pincode,
                        address: `${formData.address}, ${formData.area}`,
                        city: formData.city,
                        state: formData.state,
                        landmark: formData.landmark
                    },
                    paymentMethod
                }),
            });

            const result = await response.json();

            if (!response.ok) throw new Error(result.error);

            // Success
            await clearCart();

            // Construct WhatsApp Message
            const orderSummary = items.map(item =>
                `• ${item.name} (Qty: ${item.quantity}) - ${item.price}`
            ).join('\n');

            const message = `*New Order Placed! (Order ID: ${result.orderId})*\n\n` +
                `*Customer Details:*\n` +
                `Name: ${formData.name}\n` +
                `Phone: ${formData.phone}\n` +
                `Address: ${formData.address}, ${formData.area}\n` +
                `City: ${formData.city}, ${formData.state} - ${formData.pincode}\n` +
                `Landmark: ${formData.landmark || 'N/A'}\n\n` +
                `*Items:*\n${orderSummary}\n\n` +
                `*Total Amount: $${cartTotal.toFixed(2)}*`;

            const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

            toast.success('Order Placed Successfully! Redirecting to WhatsApp...');

            // Small delay to let the toast show up
            setTimeout(() => {
                window.location.href = whatsappUrl;
            }, 1000);

        } catch (error) {
            console.error('Checkout Error:', error);
            toast.error('Failed to place order. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-4">
                <div className="text-center bg-white p-12 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center max-w-sm w-full">
                    <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <h2 className="text-xl font-bold mb-6 text-gray-800">Your cart is empty</h2>
                    <Link href="/home" className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-full transition-colors shadow-sm w-full text-center">
                        Continue Shopping
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fafafa] font-sans text-gray-800 pb-12">
            {/* Top Navigation */}
            <nav className="bg-white px-4 py-4 flex items-center justify-between sticky top-0 z-50 border-b border-gray-100 shadow-sm mb-6">
                <button onClick={() => router.back()} className="text-gray-800 p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors" aria-label="Back">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                <Link href="/home" className="text-xl font-bold tracking-tight flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <img src="/logo.png" alt="TYEUS Logo" className="w-7 h-7 rounded-sm shadow-sm" />
                    <span className="text-gray-800">Checkout</span>
                </Link>

                <div className="w-10"></div> {/* Placeholder */}
            </nav>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row gap-6">

                    {/* LEFT COLUMN: Steps */}
                    <div className="flex-1 space-y-6">

                        {/* 1. Login Step */}
                        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                    <div className="flex items-center gap-3">
                                        <span className="bg-gray-100 text-gray-600 px-2.5 py-1 text-xs font-bold rounded-lg border border-gray-200">1</span>
                                        <h3 className="text-gray-500 font-bold uppercase tracking-wider text-xs">Login</h3>
                                    </div>
                                    <div className="text-sm font-bold flex flex-wrap gap-2 items-center ml-9 sm:ml-0 mt-2 sm:mt-0">
                                        <span className="text-gray-800">{user?.user_metadata?.full_name || 'User'}</span>
                                        <span className="text-gray-500 font-medium">{user?.email}</span>
                                    </div>
                                </div>
                                <span className="text-green-500 text-sm font-bold hidden sm:block">✓ Verified</span>
                            </div>
                        </div>

                        {/* 2. Delivery Address */}
                        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
                            <div className="bg-gray-50 p-5 flex items-center gap-4 border-b border-gray-100">
                                <span className="bg-[#1a237e] text-white px-2.5 py-1 text-xs font-bold rounded-lg shadow-sm">2</span>
                                <h3 className="font-bold uppercase tracking-wider text-xs text-gray-800">Delivery Address</h3>
                            </div>
                            <div className="p-5 sm:p-6">
                                <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[
                                        { name: 'name', type: 'text', placeholder: 'Full Name *', required: true },
                                        { name: 'phone', type: 'tel', placeholder: '10-digit mobile number *', required: true },
                                        { name: 'pincode', type: 'text', placeholder: 'Pincode *', required: true },
                                        { name: 'city', type: 'text', placeholder: 'City / District / Town', required: false },
                                    ].map((field) => (
                                        <input
                                            key={field.name}
                                            type={field.type}
                                            name={field.name}
                                            placeholder={field.placeholder}
                                            value={(formData as any)[field.name]}
                                            onChange={handleInputChange}
                                            required={field.required}
                                            className="bg-gray-50 border border-gray-200 p-3.5 rounded-xl focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-50 outline-none transition-all w-full text-sm"
                                        />
                                    ))}
                                    <textarea
                                        name="address"
                                        placeholder="Address (Area and Street) *"
                                        value={formData.address}
                                        onChange={handleInputChange as any}
                                        required
                                        className="bg-gray-50 border border-gray-200 p-3.5 rounded-xl focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-50 outline-none transition-all w-full md:col-span-2 h-24 resize-none text-sm"
                                    />
                                    {[
                                        { name: 'state', type: 'text', placeholder: 'State', required: false },
                                        { name: 'landmark', type: 'text', placeholder: 'Landmark (Optional)', required: false },
                                    ].map((field) => (
                                        <input
                                            key={field.name}
                                            type={field.type}
                                            name={field.name}
                                            placeholder={field.placeholder}
                                            value={(formData as any)[field.name]}
                                            onChange={handleInputChange}
                                            required={field.required}
                                            className="bg-gray-50 border border-gray-200 p-3.5 rounded-xl focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-50 outline-none transition-all w-full text-sm"
                                        />
                                    ))}
                                </form>
                            </div>
                        </div>

                        {/* 3. Order Summary */}
                        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
                            <div className="bg-gray-50 p-5 flex items-center gap-4 border-b border-gray-100">
                                <span className="bg-[#1a237e] text-white px-2.5 py-1 text-xs font-bold rounded-lg shadow-sm">3</span>
                                <h3 className="font-bold uppercase tracking-wider text-xs text-gray-800">Order Summary</h3>
                            </div>
                            <div className="p-5 sm:p-6 divide-y divide-gray-100">
                                {items.map(item => (
                                    <div key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                                        <div className="w-20 h-20 bg-gray-50 border border-gray-100 rounded-xl flex-shrink-0 flex items-center justify-center relative overflow-hidden p-1">
                                            {item.image ? (
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-xs text-gray-300">Img</span>
                                            )}
                                        </div>
                                        <div className="flex-1 flex flex-col justify-between py-1">
                                            <div>
                                                <h4 className="font-bold text-gray-800 text-sm leading-tight">{item.name}</h4>
                                                <p className="text-xs text-gray-500 mt-1 font-medium">Color: {item.color || 'Standard'}</p>
                                            </div>
                                            <div className="flex items-center gap-4 mt-2">
                                                <span className="font-bold text-orange-500">${item.price.replace('$', '')}</span>
                                                <span className="text-gray-500 text-xs font-bold bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">Qty: {item.quantity}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 4. Payment Options */}
                        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
                            <div className="bg-gray-50 p-5 flex items-center gap-4 border-b border-gray-100">
                                <span className="bg-[#1a237e] text-white px-2.5 py-1 text-xs font-bold rounded-lg shadow-sm">4</span>
                                <h3 className="font-bold uppercase tracking-wider text-xs text-gray-800">Payment Options</h3>
                            </div>

                            <div className="p-5 sm:p-6 space-y-3">
                                {[
                                    { value: 'UPI', label: 'UPI' },
                                    { value: 'Card', label: 'Credit / Debit / ATM Card' },
                                    { value: 'NetBanking', label: 'Net Banking' },
                                    { value: 'COD', label: 'Cash on Delivery', subLabel: 'Pay when you receive your order' }
                                ].map((option) => (
                                    <label key={option.value} className={`flex items-start sm:items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === option.value ? 'border-orange-500 bg-orange-50' : 'border-gray-100 hover:border-orange-200'}`}>
                                        <div className="flex items-center h-6">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-white ${paymentMethod === option.value ? 'bg-orange-500 border-orange-500' : 'border-gray-300'}`}>
                                                {paymentMethod === option.value && (
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`font-bold text-sm ${paymentMethod === option.value ? 'text-orange-700' : 'text-gray-800'}`}>{option.label}</span>
                                            {option.subLabel && <span className="text-xs text-gray-500 mt-0.5 font-medium">{option.subLabel}</span>}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Price Details */}
                    <div className="lg:w-[350px] shrink-0">
                        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 lg:sticky lg:top-24">
                            <h3 className="text-gray-800 font-bold text-lg border-b border-gray-100 pb-4 mb-5">Price Details</h3>

                            <div className="space-y-4 text-sm font-medium">
                                <div className="flex justify-between text-gray-600">
                                    <span>Price ({items.reduce((acc, i) => acc + i.quantity, 0)} items)</span>
                                    <span className="text-gray-900">${cartTotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Delivery Charges</span>
                                    <span className="text-green-600 font-bold">FREE</span>
                                </div>
                                <div className="flex justify-between items-center text-gray-900 border-t border-gray-100 pt-5 mt-2">
                                    <span className="font-bold text-base">Total Payable</span>
                                    <span className="font-extrabold text-2xl text-[#1a237e]">${cartTotal.toFixed(2)}</span>
                                </div>
                            </div>

                            <button
                                onClick={handlePlaceOrder}
                                disabled={loading}
                                className="w-full mt-8 bg-orange-500 text-white rounded-xl py-4 font-bold tracking-wide shadow-md hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        Confirm Order
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </>
                                )}
                            </button>

                            <div className="mt-6 p-3 bg-green-50 rounded-xl border border-green-100 flex items-start gap-3">
                                <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <p className="text-sm font-bold text-green-700">Safe and Secure Payments</p>
                                    <p className="text-xs text-green-600 mt-0.5">100% Authentic products • SSL Encrypted</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
