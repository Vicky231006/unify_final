"use client";
import { motion } from "framer-motion";
import { CheckCircle2, TrendingUp, Zap, Users, FileBarChart, Plug } from "lucide-react";

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
    ,
    {
        title: "Always in Sync",
        description: "Your whole team sees the same picture — live updates, zero lag, no version conflicts.",
        icon: <Users className="w-6 h-6 text-[#a78bfa]" />,
        visual: (
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    {["#5e6ad2", "#a78bfa", "#818cf8"].map((color, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: i * 0.15 }}
                            className="w-9 h-9 rounded-full border-2 border-[var(--color-card)] flex items-center justify-center text-xs font-bold"
                            style={{ backgroundColor: color + "33", borderColor: color }}
                        >
                            <span style={{ color }}>{["A", "B", "C"][i]}</span>
                        </motion.div>
                    ))}
                    <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.5 }}
                        className="ml-auto flex items-center gap-1"
                    >
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs text-emerald-400">Live</span>
                    </motion.div>
                </div>
                <div className="h-16 bg-[var(--color-primary)]/10 rounded-lg border border-[var(--color-primary)]/20 flex flex-col justify-center gap-2 px-4">
                    <div className="h-2 w-3/4 bg-[#a78bfa]/40 rounded" />
                    <div className="h-2 w-1/2 bg-[#a78bfa]/25 rounded" />
                </div>
            </div>
        )
    },
    {
        title: "Reports, on Autopilot",
        description: "Scheduled exports and stakeholder-ready summaries — generated while you sleep.",
        icon: <FileBarChart className="w-6 h-6 text-amber-400" />,
        visual: (
            <div className="flex flex-col gap-3">
                {[{ label: "Weekly Summary", pct: 100 }, { label: "Sprint Velocity", pct: 78 }, { label: "Burndown", pct: 55 }].map((item, i) => (
                    <div key={i} className="flex flex-col gap-1">
                        <div className="flex justify-between text-xs text-gray-400">
                            <span>{item.label}</span>
                            <span className="text-amber-400">{item.pct}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-[var(--color-border)] rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                whileInView={{ width: `${item.pct}%` }}
                                transition={{ duration: 0.7, delay: i * 0.15 }}
                                className="h-full bg-amber-400/70 rounded-full"
                            />
                        </div>
                    </div>
                ))}
            </div>
        )
    },
    {
        title: "Plug In, Not Out",
        description: "Connect your existing stack — Slack, Jira, GitHub, and more — without rewriting a thing.",
        icon: <Plug className="w-6 h-6 text-cyan-400" />,
        visual: (
            <div className="relative h-28 flex items-center justify-center">
                {/* Center node */}
                <div className="absolute z-10 w-10 h-10 rounded-full bg-[var(--color-primary)]/20 border border-[var(--color-primary)]/50 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-[var(--color-primary)]">Unify</span>
                </div>
                {/* Spoke nodes */}
                {[
                    { label: "Slack", color: "#4ade80", pos: "top-0 left-1/2 -translate-x-1/2" },
                    { label: "Jira", color: "#60a5fa", pos: "bottom-0 left-1/2 -translate-x-1/2" },
                    { label: "GH", color: "#e2e8f0", pos: "top-1/2 left-0 -translate-y-1/2" },
                    { label: "API", color: "#f9a8d4", pos: "top-1/2 right-0 -translate-y-1/2" },
                ].map((node, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.5 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: i * 0.12 }}
                        className={`absolute w-9 h-9 rounded-full border flex items-center justify-center text-[9px] font-semibold ${node.pos}`}
                        style={{ backgroundColor: node.color + "22", borderColor: node.color, color: node.color }}
                    >
                        {node.label}
                    </motion.div>
                ))}
                {/* Connector lines via SVG */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 200 112">
                    {[[100, 12, 100, 56], [100, 100, 100, 56], [18, 56, 100, 56], [182, 56, 100, 56]].map(([x1, y1, x2, y2], i) => (
                        <motion.line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                            stroke="#22d3ee" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="4 3"
                            initial={{ pathLength: 0, opacity: 0 }}
                            whileInView={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                        />
                    ))}
                </svg>
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
