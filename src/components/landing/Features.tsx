"use client";
import { motion } from "framer-motion";
import { CheckCircle2, TrendingUp, Zap } from "lucide-react";

const features = [
    {
        title: "Fragmented to Fluid",
        description: "Replace messy spreadsheets with an integrated flow.",
        icon: <Zap className="w-6 h-6 text-[#5e6ad2]" />,
        visual: (
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4 opacity-50 line-through">
                    <div className="w-full h-8 bg-[var(--color-border)] rounded" />
                    <div className="w-1/2 h-8 bg-[var(--color-border)] rounded" />
                </div>
                <div className="w-full h-px bg-[var(--color-primary)]/30 my-2 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--color-card)] px-2 text-xs text-[var(--color-primary)]">Unify</div>
                </div>
                <div className="flex gap-4">
                    <div className="flex-1 h-24 bg-[var(--color-primary)]/10 rounded-lg border border-[var(--color-primary)]/20 flex items-center justify-center p-4">
                        <div className="flex flex-col gap-2 w-full">
                            <div className="h-2 w-3/4 bg-[var(--color-primary)]/40 rounded" />
                            <div className="h-2 w-1/2 bg-[var(--color-primary)]/40 rounded" />
                        </div>
                    </div>
                </div>
            </div>
        )
    },
    {
        title: "Predictive Power",
        description: "LSTM forecasting that visualizes team capacity before burnout hits.",
        icon: <TrendingUp className="w-6 h-6 text-emerald-400" />,
        visual: (
            <div className="h-32 w-full relative flex items-end gap-2 px-4 py-2 bg-gradient-to-t from-emerald-500/10 to-transparent rounded-lg border border-emerald-500/20">
                {[20, 35, 45, 60, 85, 100].map((h, i) => (
                    <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        whileInView={{ height: `${h}%` }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                        className={`flex-1 rounded-t-sm ${i > 3 ? 'bg-[var(--color-primary)]' : 'bg-emerald-500/50'}`}
                    />
                ))}
                {/* Glow Line */}
                <svg className="absolute inset-0 h-full w-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 240 100">
                    <path d="M 0,100 L 40,80 L 80,60 L 140,50 L 180,20 L 240,10" stroke="#5e6ad2" strokeWidth="3" fill="none" className="drop-shadow-[0_0_8px_rgba(94,106,210,0.8)]" />
                </svg>
            </div>
        )
    },
    {
        title: "SME Empowerment",
        description: "Enterprise scalability without the legacy bloat.",
        icon: <CheckCircle2 className="w-6 h-6 text-blue-400" />,
        visual: (
            <div className="grid grid-cols-2 gap-4 h-full">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg p-3 flex flex-col justify-between">
                        <div className="w-6 h-6 rounded-full bg-blue-400/20 mb-2" />
                        <div className="h-2 w-full bg-[var(--color-border)] rounded" />
                    </div>
                ))}
            </div>
        )
    }
];

export function Features() {
    return (
        <section className="relative z-10 py-24 px-4 max-w-7xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
                {features.map((f, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6, delay: i * 0.2 }}
                        className="bg-[var(--color-card)]/50 backdrop-blur-sm border border-[var(--color-border)] p-8 rounded-2xl flex flex-col h-full hover:bg-[var(--color-card)] transition-colors"
                    >
                        <div className="h-12 w-12 rounded-xl bg-[var(--color-background)] flex items-center justify-center mb-6">
                            {f.icon}
                        </div>
                        <h3 className="text-xl font-semibold mb-3">{f.title}</h3>
                        <p className="text-gray-400 mb-8">{f.description}</p>
                        <div className="mt-auto">
                            {f.visual}
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
