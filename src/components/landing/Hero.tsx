"use client";
import { motion } from "framer-motion";

export function Hero({ onExplore }: { onExplore: () => void }) {
    return (
        <section className="relative z-10 flex flex-col items-center justify-center min-h-screen pt-20 text-center px-4">
            <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-6xl md:text-8xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400 mb-6"
            >
                Unify Workforce.<br />Work Efficient.
            </motion.h1>
            <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-lg md:text-xl text-gray-400 max-w-2xl mb-12"
            >
                The unified enterprise platform that breaks down silos and transforms your raw data into predictive power.
            </motion.p>

            <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                onClick={onExplore}
                className="group relative px-8 py-4 bg-[var(--color-primary)] text-white font-medium rounded-full overflow-hidden transition-transform hover:scale-105 active:scale-95"
            >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <span className="relative z-10 flex items-center gap-2">
                    Explore Unify
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </span>
                <div className="absolute inset-0 rounded-full ring-2 ring-[var(--color-primary)] ring-offset-2 ring-offset-[var(--color-background)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]" />
            </motion.button>
        </section>
    );
}
