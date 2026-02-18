'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Product, User } from '@/types';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('overview');
    const [products, setProducts] = useState<Product[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [uploadingModel, setUploadingModel] = useState<string | null>(null); // User ID or Product ID being uploaded for
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [productsRes, usersRes, requestsRes] = await Promise.all([
                    fetch('/api/products'),
                    fetch('/api/users'),
                    supabase.from('try_on_requests').select('*')
                ]);

                if (!productsRes.ok || !usersRes.ok) throw new Error('Failed to fetch data');

                const productsData = await productsRes.json();
                const usersData = await usersRes.json();
                const requestsData = requestsRes.data || [];

                // Fetch updated user data (including model_url) from public users table
                const { data: realtimeUsers, error: usersError } = await supabase
                    .from('users')
                    .select('*');

                if (usersError) throw usersError;

                setProducts(productsData);
                setUsers(realtimeUsers || usersData);
                setRequests(requestsData);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleUploadProductModel = async (productId: number, file: File) => {
        try {
            setUploadingModel(`p-${productId}`);
            const fileExt = file.name.split('.').pop();
            const fileName = `${productId}-model.${fileExt}`;
            const filePath = `${fileName}`;

            // Upload to product-models bucket
            const { error: uploadError } = await supabase.storage
                .from('product-models')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('product-models')
                .getPublicUrl(filePath);

            // Update product record
            const { error: updateError } = await supabase
                .from('products')
                .update({ model_url: publicUrl })
                .eq('id', productId);

            if (updateError) throw updateError;

            // Refresh products
            setProducts(products.map(p => p.id === productId ? { ...p, model_url: publicUrl } : p));
            alert('Product model uploaded successfully!');
        } catch (err) {
            console.error('Upload failed:', err);
            alert('Failed to upload product model.');
        } finally {
            setUploadingModel(null);
        }
    };

    const handleUpdateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduct) return;

        const form = e.target as HTMLFormElement;
        const name = (form.elements.namedItem('edit-name') as HTMLInputElement).value;
        const price = (form.elements.namedItem('edit-price') as HTMLInputElement).value;
        const category = (form.elements.namedItem('edit-category') as HTMLSelectElement).value;
        const fileInput = form.elements.namedItem('edit-model') as HTMLInputElement;
        const file = fileInput.files?.[0];

        try {
            let modelUrl = editingProduct.model_url;

            // Handle file upload if present
            if (file) {
                setUploadingModel(`p-${editingProduct.id}`);
                const fileExt = file.name.split('.').pop();
                const fileName = `${editingProduct.id}-model.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('product-models')
                    .upload(filePath, file, { upsert: true });

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('product-models')
                    .getPublicUrl(filePath);

                modelUrl = publicUrl;
            }

            // Update Database
            const { error: updateError } = await supabase
                .from('products')
                .update({ name, price, category, model_url: modelUrl })
                .eq('id', editingProduct.id);

            if (updateError) throw updateError;

            // Update Local State -- CRITICAL: Make sure to convert price to string/format as needed, type mismatch possible but ignoring for now
            setProducts(products.map(p => p.id === editingProduct.id ? { ...p, name, price, category, model_url: modelUrl } : p));
            setEditingProduct(null); // Close modal
            alert('Product updated successfully!');

        } catch (err) {
            console.error(err);
            alert('Failed to update product.');
        } finally {
            setUploadingModel(null);
        }
    };

    const handleUploadModel = async (userId: string, file: File) => {
        setUploadingModel(userId);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}-model.${fileExt}`;
            const filePath = `${fileName}`;

            // 1. Upload to 'user-models' bucket
            console.log('Uploading file to storage...');
            const { error: uploadError } = await supabase.storage
                .from('user-models')
                .upload(filePath, file, { upsert: true });

            if (uploadError) {
                console.error('Storage Upload Error:', uploadError);
                throw new Error(`Storage Error: ${uploadError.message}`);
            }

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('user-models')
                .getPublicUrl(filePath);

            // 3. Update User's model_url in database
            console.log('Updating user record...');
            const { error: updateError } = await supabase
                .from('users')
                .update({ model_url: publicUrl })
                .eq('id', userId);

            if (updateError) {
                console.error('Database Update Error:', updateError);
                throw new Error(`Database Error: ${updateError.message}`);
            }

            // 4. Update local state
            setUsers(users.map(u => u.id === userId ? { ...u, model_url: publicUrl } : u));
            alert('Model uploaded and assigned successfully!');

        } catch (error) {
            alert(error instanceof Error ? error.message : 'Unknown error occurred');
        } finally {
            setUploadingModel(null);
        }
    };

    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const name = (form.elements.namedItem('name') as HTMLInputElement).value;
        const price = (form.elements.namedItem('price') as HTMLInputElement).value;
        const category = (form.elements.namedItem('category') as HTMLInputElement).value;

        try {
            const response = await fetch('/api/products', {
                method: 'POST',
                body: JSON.stringify({ name, price, category }),
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) throw new Error('Failed to add product');

            const newProduct = await response.json();
            setProducts([...products, newProduct]);
            form.reset();
            alert("Product Added Successfully!");
        } catch (err) {
            alert('Error adding product: ' + (err instanceof Error ? err.message : 'Unknown error'));
        }
    };

    const handleDeleteProduct = async (id: number) => {
        if (confirm("Are you sure you want to delete this product?")) {
            try {
                // Use Supabase client directly to leverage the user's session for RLS
                const { error } = await supabase
                    .from('products')
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                // Update local state
                setProducts(products.filter(p => p.id !== id));
            } catch (err) {
                alert('Error deleting product: ' + (err instanceof Error ? err.message : 'Unknown error'));
            }
        }
    };

    const renderContent = () => {
        if (loading) return <div className="text-center py-20 text-white/50 animate-pulse">Loading dashboard data...</div>;
        if (error) return <div className="text-center py-20 text-red-400">Error: {error}</div>;

        switch (activeTab) {
            case 'products':
                return (
                    <div className="space-y-8 relative">
                        {/* Edit Product Modal */}
                        {editingProduct && (
                            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                                <div className="bg-[#1a163b] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative">
                                    <button
                                        onClick={() => setEditingProduct(null)}
                                        className="absolute top-4 right-4 text-white/40 hover:text-white"
                                    >
                                        ✕
                                    </button>
                                    <h2 className="text-xl font-bold mb-6">Edit Product</h2>
                                    <form onSubmit={handleUpdateProduct} className="space-y-4">
                                        <div>
                                            <label className="block text-xs text-white/40 mb-1">Product Name</label>
                                            <input name="edit-name" defaultValue={editingProduct.name} type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500" required />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs text-white/40 mb-1">Price</label>
                                                <input name="edit-price" defaultValue={editingProduct.price} type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500" required />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-white/40 mb-1">Category</label>
                                                <select name="edit-category" defaultValue={editingProduct.category} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500">
                                                    <option value="Electronics" className="bg-[#1a163b]">Electronics</option>
                                                    <option value="Fashion" className="bg-[#1a163b]">Fashion</option>
                                                    <option value="Accessories" className="bg-[#1a163b]">Accessories</option>
                                                    <option value="Gadgets" className="bg-[#1a163b]">Gadgets</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs text-white/40 mb-1">Update 3D Model (Optional)</label>
                                            <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-3">
                                                {editingProduct.model_url ? (
                                                    <span className="text-green-400 text-xs">Current model exists</span>
                                                ) : (
                                                    <span className="text-white/40 text-xs">No model set</span>
                                                )}
                                                <input name="edit-model" type="file" accept=".glb,.gltf" className="text-xs text-white/60 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500" />
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-3 pt-4">
                                            <button type="button" onClick={() => setEditingProduct(null)} className="px-5 py-2 rounded-xl text-white/60 hover:bg-white/5 transition-colors">Cancel</button>
                                            <button type="submit" disabled={!!uploadingModel} className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl shadow-lg transition-all">
                                                {uploadingModel ? 'Saving...' : 'Save Changes'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* Add Product Form */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                            <h2 className="text-xl font-bold mb-4">Add New Product</h2>
                            <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <input name="name" type="text" placeholder="Product Name" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500" required />
                                <input name="price" type="text" placeholder="Price (e.g. $99)" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500" required />
                                <select name="category" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                                    <option value="Electronics" className="bg-[#1a163b]">Electronics</option>
                                    <option value="Fashion" className="bg-[#1a163b]">Fashion</option>
                                    <option value="Accessories" className="bg-[#1a163b]">Accessories</option>
                                    <option value="Gadgets" className="bg-[#1a163b]">Gadgets</option>
                                </select>
                                <button type="submit" className="md:col-span-3 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl transition-all">Add Product</button>
                            </form>
                        </div>

                        {/* Product List */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                            <h2 className="text-xl font-bold p-6 border-b border-white/10">Product Inventory</h2>
                            <table className="w-full text-left">
                                <thead className="bg-white/5 text-white/60">
                                    <tr>
                                        <th className="px-6 py-4">ID</th>
                                        <th className="px-6 py-4">Name</th>
                                        <th className="px-6 py-4">Category</th>
                                        <th className="px-6 py-4">Price</th>
                                        <th className="px-6 py-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {products.map((p) => (
                                        <tr key={p.id} className="hover:bg-white/5">
                                            <td className="px-6 py-4 text-white/60">#{p.id}</td>
                                            <td className="px-6 py-4 font-bold">{p.name}</td>
                                            <td className="px-6 py-4 text-white/70">{p.category}</td>
                                            <td className="px-6 py-4 font-mono text-green-400">{p.price}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setEditingProduct(p)}
                                                        className="px-3 py-1.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded text-xs font-medium border border-blue-500/20 transition-all"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button onClick={() => handleDeleteProduct(p.id)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10 p-2 rounded transition-all" title="Delete Product">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'users':
                return (
                    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                        <h2 className="text-xl font-bold p-6 border-b border-white/10">Registered Users</h2>
                        <table className="w-full text-left">
                            <thead className="bg-white/5 text-white/60">
                                <tr>
                                    <th className="px-6 py-4">ID</th>
                                    <th className="px-6 py-4">Name</th>
                                    <th className="px-6 py-4">Email</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">3D Model</th>
                                    <th className="px-6 py-4">Joined Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {users.map((u) => (
                                    <tr key={u.id} className="hover:bg-white/5">
                                        <td className="px-6 py-4 text-white/60">
                                            <span title={String(u.id)} className="cursor-help">
                                                {typeof u.id === 'string' ? u.id.substring(0, 8) + '...' : u.id}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-bold flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xs text-white">
                                                {u.name.charAt(0)}
                                            </div>
                                            {u.name}
                                        </td>
                                        <td className="px-6 py-4 text-white/70">{u.email}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.role === 'Admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-2">
                                                {u.model_url && (
                                                    <a href={u.model_url} target="_blank" rel="noopener noreferrer" className="text-xs text-green-400 hover:text-green-300 underline mb-1">
                                                        View Current Model
                                                    </a>
                                                )}
                                                <label className="cursor-pointer bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-xs font-medium text-center transition-colors">
                                                    {uploadingModel === String(u.id) ? 'Uploading...' : 'Upload .glb'}
                                                    <input
                                                        type="file"
                                                        accept=".glb,.gltf"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            if (e.target.files?.[0]) {
                                                                handleUploadModel(String(u.id), e.target.files[0]);
                                                            }
                                                        }}
                                                    />
                                                </label>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-white/50">{u.joined || u.created_at?.split('T')[0]}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            case 'requests':
                return (
                    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                        <h2 className="text-xl font-bold p-6 border-b border-white/10">Virtual Try-On Requests</h2>
                        {requests.length === 0 ? (
                            <div className="p-8 text-center text-white/50">No requests found.</div>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="bg-white/5 text-white/60">
                                    <tr>
                                        <th className="px-6 py-4">ID</th>
                                        <th className="px-6 py-4">User Email</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Image</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {requests.map((r) => (
                                        <tr key={r.id} className="hover:bg-white/5">
                                            <td className="px-6 py-4 text-white/60">#{r.id}</td>
                                            <td className="px-6 py-4">{r.user_email || 'Unknown'}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-400">
                                                    {r.status || 'Pending'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-white/50">
                                                {new Date(r.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <a
                                                    href={r.image_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-purple-400 hover:text-purple-300 underline text-sm"
                                                >
                                                    View Image
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                );
            default: // Overview
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                            <p className="text-white/40 text-sm font-medium mb-2">Total Users</p>
                            <span className="text-3xl font-bold">{users.length}</span>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                            <p className="text-white/40 text-sm font-medium mb-2">Total Products</p>
                            <span className="text-3xl font-bold">{products.length}</span>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-[#0f0c29] text-white font-sans selection:bg-purple-500/30 flex">
            {/* Sidebar content remains mostly same but better structured */}
            <aside className="w-64 bg-[#1a163b] border-r border-white/10 hidden md:flex flex-col sticky top-0 h-screen">
                <div className="p-6 border-b border-white/10">
                    <div className="font-bold text-2xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                        NEBULA<span className="text-white">ADMIN</span>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {['Overview', 'Products', 'Users', 'Requests'].map((item) => (
                        <button
                            key={item}
                            onClick={() => setActiveTab(item.toLowerCase())}
                            className={`w-full text-left px-4 py-3 rounded-xl transition-all ${activeTab === item.toLowerCase() ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                        >
                            {item}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/10">
                    <Link href="/" className="flex items-center gap-2 text-white/60 hover:text-red-400 transition-colors px-4 py-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto h-screen">
                <header className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold capitalize">{activeTab} Dashboard</h1>
                    <div className="bg-purple-600/20 text-purple-300 px-4 py-1.5 rounded-full text-sm font-medium border border-purple-500/30">
                        Administrator Access
                    </div>
                </header>
                {renderContent()}
            </main>
        </div>
    );
}
