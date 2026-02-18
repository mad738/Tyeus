export let products = [
    { id: 1, name: "Neon Smart Watch", price: "$299", category: "Electronics", color: "from-blue-500 to-cyan-400" },
    { id: 2, name: "Holographic Headset", price: "$499", category: "Accessories", color: "from-purple-500 to-pink-500" },
    { id: 3, name: "Cyberpunk Sneakers", price: "$159", category: "Fashion", color: "from-amber-400 to-orange-500" },
    { id: 4, name: "Quantum Tablet", price: "$899", category: "Electronics", color: "from-emerald-400 to-teal-500" },
];

export let users = [
    { id: 1, name: "Alice Smith", email: "alice@example.com", role: "User", joined: "2024-01-15", password: "password" },
    { id: 2, name: "Bob Jones", email: "bob@example.com", role: "User", joined: "2024-02-10", password: "password" },
    { id: 3, name: "Charlie Day", email: "charlie@example.com", role: "User", joined: "2024-03-05", password: "password" },
    { id: 4, name: "Admin User", email: "admin@example.com", role: "Admin", joined: "2023-11-20", password: "admin" },
];

export const addProduct = (product: any) => {
    products.push(product);
};

export const deleteProduct = (id: number) => {
    products = products.filter(p => p.id !== id);
};

export const addUser = (user: any) => {
    users.push(user);
};
