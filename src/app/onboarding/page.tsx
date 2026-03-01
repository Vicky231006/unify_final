"use client";
import { Onboarding } from "@/components/onboarding/Onboarding";
import { CanvasEffect } from "@/components/landing/CanvasEffect";

export default function OnboardingPage() {
    return (
        <main className="relative w-full bg-[var(--color-background)] overflow-hidden">
            <CanvasEffect />
            <Onboarding />
        </main>
    );
}
