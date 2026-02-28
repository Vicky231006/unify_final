"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { CanvasEffect } from "@/components/landing/CanvasEffect";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Header } from "@/components/landing/Header";
import { Platform } from "@/components/landing/Platform";
import { Solutions } from "@/components/landing/Solutions";
import { Resources } from "@/components/landing/Resources";
import { Pricing } from "@/components/landing/Pricing";

export function PageContent() {
    const router = useRouter();

    return (
        <main className="relative min-h-screen w-full bg-[var(--color-background)] text-white overflow-hidden scroll-smooth">
            <CanvasEffect />

            <AnimatePresence mode="wait">
                <motion.div
                    key="landing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="relative z-10 w-full h-screen overflow-y-auto pb-24 scroll-smooth"
                >
                    <Header onStart={() => router.push("/signup")} />
                    <Hero onExplore={() => router.push("/signup")} />
                    <Features />
                    <Platform />
                    <Solutions />
                    <Resources />
                    <Pricing />
                </motion.div>
            </AnimatePresence>
        </main>
    );
}
