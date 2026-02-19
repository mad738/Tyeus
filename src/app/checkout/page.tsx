'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

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
            alert("Please fill in all required address fields.");
            return;
        }

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
            alert('Order Placed Successfully!');
            router.push('/orders');

        } catch (error) {
            console.error('Checkout Error:', error);
            alert('Failed to place order. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-[#f1f3f6] flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-bold mb-4 text-black">Your cart is empty</h2>
                    <Link href="/home" className="text-blue-600 font-medium hover:underline">Continue Shopping</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f1f3f6] py-8 font-sans text-black">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row gap-6">

                    {/* LEFT COLUMN: Steps */}
                    <div className="flex-1 space-y-4">

                        {/* 1. Login Step (Static for now) */}
                        <div className="bg-white p-4 shadow-sm rounded-sm">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <span className="bg-gray-200 text-blue-600 px-2 py-0.5 text-xs font-bold rounded-[2px]">1</span>
                                    <div>
                                        <h3 className="text-gray-500 font-medium uppercase text-sm">Login</h3>
                                        <div className="text-sm font-bold flex gap-2 mt-1">
                                            <span>{user?.user_metadata?.full_name || 'User'}</span>
                                            <span className="text-gray-500 font-normal">{user?.email}</span>
                                        </div>
                                    </div>
                                </div>
                                <button className="text-blue-600 border border-gray-200 px-4 py-2 text-sm font-medium hover:border-blue-600 transition-colors uppercase rounded-sm" disabled>Change</button>
                            </div>
                        </div>

                        {/* 2. Delivery Address */}
                        <div className="bg-white shadow-sm rounded-sm overflow-hidden">
                            <div className="bg-blue-600 text-white p-4 flex items-center gap-4">
                                <span className="bg-white text-blue-600 px-2 py-0.5 text-xs font-bold rounded-[2px]">2</span>
                                <h3 className="font-medium uppercase text-sm">Delivery Address</h3>
                            </div>
                            <div className="p-6">
                                <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input
                                        type="text" name="name" placeholder="Name"
                                        value={formData.name} onChange={handleInputChange}
                                        className="border border-gray-300 p-3 rounded-sm focus:border-blue-500 outline-none transition-colors w-full"
                                        required
                                    />
                                    <input
                                        type="tel" name="phone" placeholder="10-digit mobile number"
                                        value={formData.phone} onChange={handleInputChange}
                                        className="border border-gray-300 p-3 rounded-sm focus:border-blue-500 outline-none transition-colors w-full"
                                        required
                                    />
                                    <input
                                        type="text" name="pincode" placeholder="Pincode"
                                        value={formData.pincode} onChange={handleInputChange}
                                        className="border border-gray-300 p-3 rounded-sm focus:border-blue-500 outline-none transition-colors w-full"
                                        required
                                    />
                                    <input
                                        type="text" name="city" placeholder="City/District/Town"
                                        value={formData.city} onChange={handleInputChange}
                                        className="border border-gray-300 p-3 rounded-sm focus:border-blue-500 outline-none transition-colors w-full"
                                    />
                                    <textarea
                                        name="address" placeholder="Address (Area and Street)"
                                        value={formData.address} onChange={handleInputChange as any}
                                        className="border border-gray-300 p-3 rounded-sm focus:border-blue-500 outline-none transition-colors w-full md:col-span-2 h-24 resize-none"
                                        required
                                    />
                                    <input
                                        type="text" name="state" placeholder="State"
                                        value={formData.state} onChange={handleInputChange}
                                        className="border border-gray-300 p-3 rounded-sm focus:border-blue-500 outline-none transition-colors w-full"
                                    />
                                    <input
                                        type="text" name="landmark" placeholder="Landmark (Optional)"
                                        value={formData.landmark} onChange={handleInputChange}
                                        className="border border-gray-300 p-3 rounded-sm focus:border-blue-500 outline-none transition-colors w-full"
                                    />
                                </form>
                            </div>
                        </div>

                        {/* 3. Order Summary */}
                        <div className="bg-white shadow-sm rounded-sm">
                            <div className="bg-blue-600 text-white p-4 flex items-center gap-4">
                                <span className="bg-white text-blue-600 px-2 py-0.5 text-xs font-bold rounded-[2px]">3</span>
                                <h3 className="font-medium uppercase text-sm">Order Summary</h3>
                            </div>
                            <div className="p-4 space-y-4">
                                {items.map(item => (
                                    <div key={item.id} className="flex gap-4 border-b border-gray-100 pb-4 last:border-0">
                                        <div className="w-20 h-20 bg-gray-100 rounded-sm flex-shrink-0 flex items-center justify-center">
                                            {/* Placeholder for image */}
                                            <span className="text-xs text-gray-400">Img</span>
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-800">{item.name}</h4>
                                            <p className="text-sm text-gray-500 mt-1">Color: {item.color || 'Standard'}</p>
                                            <div className="flex items-center gap-4 mt-2">
                                                <span className="font-medium text-gray-800">{item.price}</span>
                                                <span className="text-green-600 text-xs font-medium">Qty: {item.quantity}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 4. Payment Options */}
                        <div className="bg-white shadow-sm rounded-sm overflow-hidden">
                            <div className="bg-blue-600 text-white p-4 flex items-center gap-4">
                                <span className="bg-white text-blue-600 px-2 py-0.5 text-xs font-bold rounded-[2px]">4</span>
                                <h3 className="font-medium uppercase text-sm">Payment Options</h3>
                            </div>

                            <div className="p-4 space-y-3">
                                <label className={`flex items-center gap-4 p-4 border rounded-sm cursor-pointer transition-all ${paymentMethod === 'UPI' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                                    <input
                                        type="radio" name="payment" value="UPI"
                                        checked={paymentMethod === 'UPI'}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="accent-blue-600 h-4 w-4"
                                    />
                                    <span className="font-medium">UPI</span>
                                </label>

                                <label className={`flex items-center gap-4 p-4 border rounded-sm cursor-pointer transition-all ${paymentMethod === 'Card' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                                    <input
                                        type="radio" name="payment" value="Card"
                                        checked={paymentMethod === 'Card'}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="accent-blue-600 h-4 w-4"
                                    />
                                    <span className="font-medium">Credit / Debit / ATM Card</span>
                                </label>

                                <label className={`flex items-center gap-4 p-4 border rounded-sm cursor-pointer transition-all ${paymentMethod === 'NetBanking' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                                    <input
                                        type="radio" name="payment" value="NetBanking"
                                        checked={paymentMethod === 'NetBanking'}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="accent-blue-600 h-4 w-4"
                                    />
                                    <span className="font-medium">Net Banking</span>
                                </label>

                                <label className={`flex items-center gap-4 p-4 border rounded-sm cursor-pointer transition-all ${paymentMethod === 'COD' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                                    <input
                                        type="radio" name="payment" value="COD"
                                        checked={paymentMethod === 'COD'}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="accent-blue-600 h-4 w-4"
                                    />
                                    <div className="flex flex-col">
                                        <span className="font-medium">Cash on Delivery</span>
                                        <span className="text-xs text-gray-500">Pay when you receive your order</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                    </div>

                    {/* RIGHT COLUMN: Price Details */}
                    <div className="lg:w-1/3 space-y-4">
                        <div className="bg-white shadow-sm rounded-sm p-4 sticky top-24">
                            <h3 className="text-gray-500 font-bold uppercase text-sm border-b border-gray-200 pb-3 mb-4">Price Details</h3>

                            <div className="space-y-4 text-sm">
                                <div className="flex justify-between text-gray-800">
                                    <span>Price ({items.reduce((acc, i) => acc + i.quantity, 0)} items)</span>
                                    <span>${cartTotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-800">
                                    <span>Delivery Charges</span>
                                    <span className="text-green-600">Free</span>
                                </div>
                                <div className="flex justify-between text-gray-800 border-t border-dashed border-gray-200 pt-4 font-bold text-lg">
                                    <span>Total Payable</span>
                                    <span>${cartTotal.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="mt-4 text-xs font-medium text-green-600">
                                You will save $0 on this order
                            </div>

                            <button
                                onClick={handlePlaceOrder}
                                disabled={loading}
                                className="w-full mt-6 bg-[#fb641b] text-white py-4 font-bold uppercase tracking-wide shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Processing...' : 'Place Order'}
                            </button>

                            <div className="mt-6 flex items-center gap-2 justify-center text-xs text-gray-400">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                                Safe and Secure Payments.
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
