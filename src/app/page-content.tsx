"use client";
import { CanvasEffect } from "@/components/landing/CanvasEffect";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Header } from "@/components/landing/Header";
import { Platform } from "@/components/landing/Platform";
import { Solutions } from "@/components/landing/Solutions";
import { Resources } from "@/components/landing/Resources";
import { Pricing } from "@/components/landing/Pricing";

export function PageContent() {
    return (
        <main className="relative min-h-screen w-full bg-[var(--color-background)] text-white overflow-hidden scroll-smooth">
            <CanvasEffect />

            <div className="relative z-10 w-full h-screen overflow-y-auto pb-24 scroll-smooth">
                <Header />
                <Hero onExplore={() => { }} />
                <Features />
                <Platform />
                <Solutions />
                <Resources />
                <Pricing />
            </div>
        </main>
    );
}
