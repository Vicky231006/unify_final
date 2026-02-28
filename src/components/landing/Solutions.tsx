export function Solutions() {
    return (
        <section id="solutions" className="min-h-screen py-24 flex items-center justify-center relative">
            <div className="max-w-4xl mx-auto px-6 text-center z-10">
                <h2 className="text-4xl md:text-5xl font-bold mb-6">Built for your Industry</h2>
                <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
                    Discover specialized solutions tailored to solve the unique challenges of your sector. From finance to healthcare, UNIFY adapts to you.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16">
                    <div className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <h3 className="text-2xl font-semibold mb-4 text-left">Enterprise Tech</h3>
                        <p className="text-neutral-400 text-left">Streamline engineering workflows and boost deployment frequencies across all teams.</p>
                    </div>
                    <div className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <h3 className="text-2xl font-semibold mb-4 text-left">Financial Services</h3>
                        <p className="text-neutral-400 text-left">Ensure absolute compliance while accelerating trading operations and risk assessment.</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
