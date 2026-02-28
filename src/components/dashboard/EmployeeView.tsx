"use client";
import { CheckCircle2, Star, Target, Zap } from "lucide-react";
import { motion } from "framer-motion";

export function EmployeeView() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-160px)] overflow-y-auto custom-scrollbar pr-2">
            {/* My Path */}
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-6 rounded-2xl flex flex-col gap-6">
                <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Target className="w-5 h-5 text-[var(--color-primary)]" /> My Path
                    </h3>
                    <span className="px-3 py-1 bg-[var(--color-primary)]/20 text-[var(--color-primary)] rounded-full text-xs font-bold">Lvl 4 Contributor</span>
                </div>

                <div className="relative pt-8 pb-4">
                    {/* Progress track */}
                    <div className="absolute top-1/2 left-0 w-full h-2 bg-black/40 rounded-full -translate-y-1/2 border border-[var(--color-border)]" />
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '65%' }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="absolute top-1/2 left-0 h-2 bg-gradient-to-r from-[var(--color-primary)] to-purple-400 rounded-full -translate-y-1/2 shadow-[0_0_12px_var(--color-primary)]"
                    />

                    {/* Nodes */}
                    <div className="relative flex justify-between">
                        {[1, 2, 3, 4, 5].map((lvl) => (
                            <div key={lvl} className={`w-8 h-8 rounded-full flex items-center justify-center border-2 z-10 ${lvl <= 3 ? 'bg-[var(--color-primary)] border-white shadow-[0_0_10px_var(--color-primary)]' : 'bg-black/80 border-[var(--color-border)] text-gray-500'}`}>
                                {lvl <= 3 ? <CheckCircle2 className="w-4 h-4 text-white" /> : lvl}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                        <p className="text-gray-400 text-xs mb-1 uppercase tracking-wider">Current KPI</p>
                        <p className="font-semibold">Ship 3 Features</p>
                        <p className="text-emerald-400 text-sm mt-2">On Track</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                        <p className="text-gray-400 text-xs mb-1 uppercase tracking-wider">Next Milestone</p>
                        <p className="font-semibold">Team Lead Res.</p>
                        <p className="text-[var(--color-primary)] text-sm mt-2">250 XP away</p>
                    </div>
                </div>
            </div>

            {/* Contribution Log */}
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-6 rounded-2xl flex flex-col gap-4">
                <h3 className="font-semibold flex items-center gap-2 mb-2">
                    <Star className="w-5 h-5 text-yellow-500" /> Transparent Ledger
                </h3>
                <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                    {[
                        { title: "Refactored Auth Flow", pts: "+50 XP", date: "Today, 10:24 AM", icon: Zap, color: "text-blue-400" },
                        { title: "Helped peer resolve bug", pts: "+15 XP", date: "Yesterday", icon: Star, color: "text-yellow-400" },
                        { title: "Completed Q2 Review", pts: "+100 XP", date: "Oct 12", icon: CheckCircle2, color: "text-emerald-400" },
                    ].map((log, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex gap-4 p-4 rounded-xl bg-black/20 border border-[var(--color-border)] hover:border-[var(--color-primary)]/50 transition-colors">
                            <div className="mt-1">
                                <log.icon className={`w-5 h-5 ${log.color}`} />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between">
                                    <p className="font-medium text-sm">{log.title}</p>
                                    <span className="text-emerald-400 text-sm font-bold">{log.pts}</span>
                                </div>
                                <p className="text-gray-500 text-xs mt-1">{log.date}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
