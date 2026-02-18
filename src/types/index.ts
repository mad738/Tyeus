export interface Product {
    id: number;
    name: string;
    price: string;
    category: string;
    color?: string;
    model_url?: string;
    created_at?: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    joined: string;
    model_url?: string;
    created_at?: string;
}
