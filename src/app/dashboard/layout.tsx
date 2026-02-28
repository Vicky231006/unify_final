import { Sidebar } from "@/components/dashboard/Sidebar";
import { Assistant } from "@/components/dashboard/Assistant";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)] flex">
            <Sidebar />

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="h-16 border-b border-[var(--color-border)] flex items-center justify-between px-8 bg-[var(--color-background)]/80 backdrop-blur z-10">
                    <h2 className="font-semibold text-lg">Command Center</h2>
                    <div className="flex gap-4 items-center">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-sm text-gray-400">System Nominal</span>
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto p-8 relative">
                    {children}
                </div>
            </main>

            {/* AI Assistant */}
            <Assistant />
        </div>
    );
}
