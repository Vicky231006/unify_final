export function Pricing() {
    return (
        <section id="pricing" className="min-h-[80vh] py-24 flex items-center justify-center relative">
            <div className="max-w-4xl mx-auto px-6 text-center z-10">
                <h2 className="text-4xl md:text-5xl font-bold mb-6">Simple, Transparent Pricing</h2>
                <p className="text-xl text-neutral-400 max-w-2xl mx-auto mb-16">
                    Scale your operations without worrying about complex pricing tiers. Pay for what you use, when you use it.
                </p>

                <div className="p-10 rounded-3xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 backdrop-blur-sm max-w-lg mx-auto">
                    <h3 className="text-2xl font-semibold mb-2">Enterprise Plan</h3>
                    <div className="text-5xl font-bold mb-6 mt-4">Custom</div>
                    <p className="text-neutral-400 mb-8">Tailored for large organizations requiring advanced security and compliance.</p>
                    <button className="w-full py-4 rounded-xl bg-gradient-to-r from-[#5e6ad2] to-purple-500 text-white font-bold text-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all">
                        Contact Sales
                    </button>
                </div>
            </div>
        </section>
    );
}
