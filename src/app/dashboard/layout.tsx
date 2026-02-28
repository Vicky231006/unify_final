"use client";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Assistant } from "@/components/dashboard/Assistant";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";

const PAGE_TITLES: Record<string, string> = {
    "/dashboard": "Overview",
    "/dashboard/analytics": "Analytics",
    "/dashboard/teams": "Teams & Directory",
    "/dashboard/settings": "Settings",
};

function TopBar() {
    const pathname = usePathname();
    const { userRole } = useWorkspace();
    const title = PAGE_TITLES[pathname] || "Overview";

    const initials = { CEO: "AC", Manager: "SM", Employee: "JW" }[userRole] ?? "U";

    return (
        <header className="h-14 border-b border-[var(--color-border)] flex items-center justify-between px-6 bg-[var(--color-background)]/90 backdrop-blur-sm shrink-0 z-10">
            {/* Left: page title */}
            <h2 className="font-semibold text-base text-[var(--color-foreground)]">{title}</h2>

            {/* Center: global search */}
            <div className="flex-1 max-w-sm mx-8">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search tasks, projects, people..."
                        className="w-full text-sm pl-9 pr-4 py-1.5 rounded-lg bg-white/5 border border-[var(--color-border)] text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-[var(--color-primary)]/50 transition-colors"
                    />
                </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 hidden sm:block">
                    {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                </span>
                <div className="relative">
                    <button className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                        <Bell className="w-4 h-4" />
                    </button>
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />
                </div>
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[var(--color-primary)] to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow">
                    {initials}
                </div>
            </div>
        </header>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)] flex">
            <Sidebar />
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                <TopBar />
                <div className="flex-1 overflow-y-auto p-6 relative custom-scrollbar">
                    {children}
                </div>
            </main>
            <Assistant />
        </div>
    );
}
