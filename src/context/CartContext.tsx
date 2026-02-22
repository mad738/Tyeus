'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface CartItem {
    id: number; // This is the product_id for simplicity in display, or cart_id
    cart_id?: number; // The actual id in 'cart' table
    name: string;
    price: string;
    image?: string;
    color?: string;
    quantity: number;
    product_id: number;
}

interface CartContextType {
    items: CartItem[];
    addToCart: (product: any) => Promise<void>;
    removeFromCart: (cartId: number) => Promise<void>;
    clearCart: () => Promise<void>;
    cartTotal: number;
    cartCount: number;
    loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Load session
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Load cart from Supabase when session exists
    useEffect(() => {
        if (!session) {
            setItems([]);
            setLoading(false);
            return;
        }

        const fetchCart = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('cart')
                    .select('*, product:products(*)')
                    .eq('user_id', session.user.id);

                if (error) throw error;

                if (data) {
                    const mappedItems: CartItem[] = data.map((item: any) => ({
                        id: item.product_id, // Use product_id as main identifier for checking existence
                        cart_id: item.id,
                        product_id: item.product_id,
                        name: item.product.name,
                        price: item.product.price,
                        image: item.product.main_image || (item.product.images && item.product.images[0]) || null,
                        color: item.product.color,
                        quantity: item.quantity
                    }));
                    setItems(mappedItems);
                }
            } catch (err) {
                console.error("Failed to fetch cart", err);
            } finally {
                setLoading(false);
            }
        };

        fetchCart();
    }, [session]);

    const addToCart = async (product: any) => {
        if (!session) {
            alert("Please login to add to cart");
            return;
        }

        const existingItem = items.find(item => item.product_id === product.id);

        try {
            if (existingItem) {
                // Update quantity locally first (optimistic)
                const newQuantity = existingItem.quantity + 1;
                setItems(prev => prev.map(item =>
                    item.product_id === product.id ? { ...item, quantity: newQuantity } : item
                ));

                // Update server
                const { error } = await supabase
                    .from('cart')
                    .update({ quantity: newQuantity })
                    .eq('id', existingItem.cart_id);

                if (error) throw error;
            } else {
                // Insert new
                const { data, error } = await supabase
                    .from('cart')
                    .insert({ user_id: session.user.id, product_id: product.id, quantity: 1 })
                    .select('*, product:products(*)')
                    .single();

                if (error) throw error;

                if (data) {
                    const newItem: CartItem = {
                        id: data.product_id,
                        cart_id: data.id,
                        product_id: data.product_id,
                        name: data.product.name,
                        price: data.product.price,
                        image: data.product.main_image || (data.product.images && data.product.images[0]) || null,
                        color: data.product.color,
                        quantity: data.quantity
                    };
                    setItems(prev => [...prev, newItem]);
                }
            }
        } catch (err) {
            console.error("Error adding to cart", err);
            // Revert optimistic update if needed (omitted for brevity)
        }
    };

    const removeFromCart = async (cartId: number) => {
        if (!session) return;

        // Optimistic remove
        setItems(prev => prev.filter(item => item.cart_id !== cartId));

        try {
            await supabase.from('cart').delete().eq('id', cartId);
        } catch (err) {
            console.error("Error removing from cart", err);
        }
    };

    const clearCart = async () => {
        if (!session) return;
        setItems([]);
        try {
            await supabase.from('cart').delete().eq('user_id', session.user.id);
        } catch (err) {
            console.error("Error clearing cart", err);
        }
    };

    const cartTotal = items.reduce((total, item) => {
        const price = parseFloat(item.price.replace('$', ''));
        return total + price * item.quantity;
    }, 0);

    const cartCount = items.reduce((count, item) => count + item.quantity, 0);

    return (
        <CartContext.Provider value={{ items, addToCart, removeFromCart, clearCart, cartTotal, cartCount, loading }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
