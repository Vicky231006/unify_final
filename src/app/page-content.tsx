"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CanvasEffect } from "@/components/landing/CanvasEffect";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Navbar } from "@/components/landing/Navbar";
import { Onboarding } from "@/components/onboarding/Onboarding";

export function PageContent() {
    const [showOnboarding, setShowOnboarding] = useState(false);

    return (
        <main className="relative min-h-screen w-full bg-[var(--color-background)] text-white overflow-hidden">
            <CanvasEffect />

            {/* Navbar is always visible on the landing view */}
            {!showOnboarding && <Navbar onSignUp={() => setShowOnboarding(true)} />}

            <AnimatePresence mode="wait">
                {!showOnboarding ? (
                    <motion.div
                        key="landing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="relative z-10 w-full h-screen overflow-y-auto pb-24"
                    >
                        <Hero onExplore={() => setShowOnboarding(true)} />
                        <Features />
                    </motion.div>
                ) : (
                    <motion.div
                        key="onboarding"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="relative z-10 w-full h-screen flex flex-col"
                    >
                        <Onboarding />
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
