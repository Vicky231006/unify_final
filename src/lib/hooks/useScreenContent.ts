"use client";
import { useState, useEffect, useCallback } from 'react';

export function useScreenContent() {
    const [content, setContent] = useState<string>('');

    const scanContent = useCallback(() => {
        // Find the main content area (usually the <main> tag or a specific ID)
        // In this app, it's the <div> inside <main> in dashboard/layout.tsx
        const mainContent = document.querySelector('main > div:nth-child(2)') as HTMLElement;
        if (mainContent) {
            // Get all text content, filter out script/style tags if any, and clean up whitespace
            const text = mainContent.innerText || '';
            const cleanedText = text
                .split('\n')
                .map((line: string) => line.trim())
                .filter((line: string) => line.length > 0)
                .join(' ');

            // Limit text size to avoid blowing up LLM context for now
            setContent(cleanedText.substring(0, 5000));
        }
    }, []);

    useEffect(() => {
        // Initial scan
        scanContent();

        // Optional: Re-scan on mutations if needed, but for now simple interval or manual trigger is better
        const interval = setInterval(scanContent, 5000);
        return () => clearInterval(interval);
    }, [scanContent]);

    return { content, refresh: scanContent };
}
