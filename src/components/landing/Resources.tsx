export function Resources() {
    return (
        <section id="resources" className="min-h-screen py-24 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-gradient-to-t from-purple-500/5 to-transparent pointer-events-none" />
            <div className="max-w-4xl mx-auto px-6 text-center z-10">
                <h2 className="text-4xl md:text-5xl font-bold mb-6">Knowledge Base</h2>
                <p className="text-xl text-neutral-400 max-w-2xl mx-auto mb-16">
                    Dive into our extensive library of guides, documentation, and case studies to get the most out of your unified ecosystem.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                    <button className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-medium transition-all">
                        Documentation
                    </button>
                    <button className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-medium transition-all">
                        API Reference
                    </button>
                    <button className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-medium transition-all">
                        Case Studies
                    </button>
                </div>
            </div>
        </section>
    );
}
