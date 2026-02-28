"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, LineChart, Settings, ArrowLeft } from "lucide-react";
import { useWorkspace } from "../providers/WorkspaceProvider";

const navItems = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Teams', href: '/dashboard/teams', icon: Users },
    { name: 'Analytics', href: '/dashboard/analytics', icon: LineChart },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const { workspaceName, managerId } = useWorkspace();

    return (
        <aside className="w-64 border-r border-[var(--color-border)] bg-[var(--color-card)] flex flex-col">
            <div className="p-6 border-b border-[var(--color-border)] flex flex-col gap-4">
                <h1 className="text-2xl font-bold text-[var(--color-primary)]">UNIFY</h1>
                <Link
                    href="/workspaces"
                    className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors py-2 px-3 bg-white/5 hover:bg-white/10 rounded-md w-fit"
                >
                    <ArrowLeft className="w-3 h-3" /> Back to Workspaces
                </Link>
            </div>
            <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${isActive
                                ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <item.icon className="w-5 h-5 opacity-80" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>
            <div className="p-4 border-t border-[var(--color-border)]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[var(--color-primary)] to-purple-500 flex items-center justify-center font-bold text-white shadow-lg shrink-0">
                        {managerId ? managerId.substring(0, 2).toUpperCase() : 'AC'}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-medium truncate">{managerId || 'Alex Chen'}</p>
                        <p className="text-xs text-[var(--color-primary)] truncate">{workspaceName || 'Global Workspace'}</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
