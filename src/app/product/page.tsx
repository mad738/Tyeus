export default function ProductPage() {
    return (
        <div className="min-h-screen bg-[#0f0c29] text-white font-sans selection:bg-purple-500/30">
            <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[80vh]">
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 mb-4">Product Details</h1>
                <p className="text-white/60 mb-8">Detailed view of future technology.</p>

                <div className="p-8 bg-white/5 border border-white/10 rounded-2xl w-full max-w-2xl text-center">
                    <div className="h-64 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl mb-6 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-all"></div>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Neon Smart Watch</h2>
                    <p className="text-white/70 mb-6">The ultimate wearable for the cyber age. Features holographic display and neural linking capabilities.</p>
                    <button className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-purple-500/30">
                        Add to Cart - $299
                    </button>
                </div>
            </main>
        </div>
    );
}
