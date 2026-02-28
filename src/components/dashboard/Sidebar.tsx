"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { useAppStore } from "@/store";
import {
    LayoutDashboard, Users, LineChart, Settings, ArrowLeft,
    BarChart3, ShieldCheck, GitBranch, Activity,
    Calendar, Star, HelpCircle
} from "lucide-react";

type NavItem = { name: string; href: string; icon: React.ElementType };
type NavGroup = { label: string; items: NavItem[] };

function getRoleGroups(role: string): NavGroup[] {
    const org: NavGroup = {
        label: "Organization",
        items: [
            { name: "Teams", href: "/dashboard/teams", icon: Users },
            { name: "Settings", href: "/dashboard/settings", icon: Settings },
        ]
    };

    if (role === "CEO") return [
        {
            label: "CEO Portal",
            items: [
                { name: "Executive Overview", href: "/dashboard", icon: LayoutDashboard },
                { name: "Strategic Analytics", href: "/dashboard/analytics", icon: BarChart3 },
                { name: "Risk & Governance", href: "/dashboard/teams", icon: ShieldCheck },
            ]
        },
        org
    ];

    if (role === "Manager") return [
        {
            label: "Manager Portal",
            items: [
                { name: "Control Panel", href: "/dashboard", icon: LayoutDashboard },
                { name: "Projects", href: "/dashboard/projects", icon: GitBranch },
                { name: "Performance", href: "/dashboard/analytics", icon: LineChart },
                { name: "Activity Logs", href: "/dashboard/teams", icon: Activity },
            ]
        },
        org
    ];

    return [
        {
            label: "Employee Portal",
            items: [
                { name: "My Board", href: "/dashboard", icon: LayoutDashboard },
                { name: "Schedule", href: "/dashboard/schedule", icon: Calendar },
                { name: "My Performance", href: "/dashboard/analytics", icon: Star },
                { name: "Help", href: "/dashboard/settings", icon: HelpCircle },
            ]
        }
    ];
}

export function Sidebar() {
    const pathname = usePathname();
    const { userRole } = useWorkspace();
    const { workspaces, activeWorkspaceId } = useAppStore();

    const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0];
    const workspaceName = activeWorkspace?.name || "Global Workspace";

    const roleConfig = {
        CEO: { name: "Alex Chen", initials: "AC", accent: "from-blue-500 to-indigo-500" },
        Manager: { name: "Sarah Miller", initials: "SM", accent: "from-purple-500 to-pink-500" },
        Employee: { name: "James Wilson", initials: "JW", accent: "from-emerald-500 to-teal-500" },
    }[userRole] ?? { name: "User", initials: "U", accent: "from-gray-500 to-gray-700" };

    const roleBadge = {
        CEO: "bg-blue-500/20 text-blue-400",
        Manager: "bg-purple-500/20 text-purple-400",
        Employee: "bg-emerald-500/20 text-emerald-400",
    }[userRole] ?? "bg-gray-500/20 text-gray-400";

    const groups = getRoleGroups(userRole);
    const showWorkspaceSwitcher = userRole !== "Employee";

    return (
        <aside className="w-64 border-r border-[var(--color-border)] bg-[var(--color-card)] flex flex-col shrink-0 h-screen">
            {/* Logo + workspace */}
            <div className="p-5 border-b border-[var(--color-border)] flex flex-col gap-3">
                <h1 className="text-2xl font-bold text-[var(--color-primary)] tracking-widest">UNIFY</h1>
                {showWorkspaceSwitcher && (
                    <Link
                        href="/workspaces"
                        className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors py-1.5 px-3 bg-white/5 hover:bg-white/10 rounded-md w-fit"
                    >
                        <ArrowLeft className="w-3 h-3" /> Switch Workspace
                    </Link>
                )}
            </div>

            {/* Role badge */}
            <div className="px-5 py-2.5 border-b border-[var(--color-border)]">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${roleBadge}`}>
                    {userRole} Portal
                </span>
            </div>

            {/* Grouped navigation */}
            <nav className="flex-1 px-3 py-3 overflow-y-auto custom-scrollbar space-y-4">
                {groups.map(group => (
                    <div key={group.label}>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 px-2 mb-1">
                            {group.label}
                        </p>
                        <div className="space-y-0.5">
                            {group.items.map(item => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all border-l-2 ${isActive
                                            ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium"
                                            : "border-transparent text-gray-400 hover:bg-white/5 hover:text-white"
                                            }`}
                                    >
                                        <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "opacity-100" : "opacity-60"}`} />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* User profile */}
            <div className="p-4 border-t border-[var(--color-border)]">
                <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-tr ${roleConfig.accent} flex items-center justify-center font-bold text-white text-xs shadow-lg shrink-0`}>
                        {roleConfig.initials}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-medium truncate">{roleConfig.name}</p>
                        <p className="text-xs text-gray-500 truncate">{workspaceName}</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
