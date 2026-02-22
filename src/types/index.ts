export interface Product {
    id: number;
    name: string;
    price: string;
    category: string;
    model_url?: string; // URL to the .glb file
    color?: string; // specific color class for the card background
    stock?: number;
    main_image?: string; // Single main image for homepage
    images?: string[]; // Array of image URLs for gallery
    description?: string; // Product description
    is_hidden?: boolean; // Controls visibility on user pages
}

export interface Review {
    id: number;
    created_at: string;
    product_id: number;
    user_id: string;
    rating: number;
    comment?: string;
    user?: User;
}


export interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    joined: string;
    created_at?: string;
    model_url?: string;
}

export interface Order {
    id: string;
    user_id: string;
    total: number;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
    created_at: string;
    items?: OrderItem[];
    user_email?: string;
}

export interface OrderItem {
    id: string;
    order_id: string;
    product_id: number;
    quantity: number;
    price_at_purchase: number;
    product?: Product;
}
