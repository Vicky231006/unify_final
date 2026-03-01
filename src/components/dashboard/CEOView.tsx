"use client";
import { useMemo } from "react";
import {
    AreaChart, Area, BarChart, Bar, ScatterChart, Scatter,
    XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { Activity, TrendingUp, AlertTriangle, TrendingDown, BarChart3, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useAppStore } from "@/store";
import { useWorkspaceMetrics } from "@/lib/metrics";
import FutureAnalysis from "./FutureAnalysis";

// Custom tooltip style shared across charts
const tooltipStyle = {
    contentStyle: { backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: '10px', fontSize: 12 },
    cursor: { stroke: 'var(--color-primary)', strokeOpacity: 0.2, strokeWidth: 1 }
};

export function CEOView() {
    const { activeWorkspaceId, workspaces, activityLogs } = useAppStore();
    const targetWorkspaceId = activeWorkspaceId || workspaces[0]?.id || null;
    const m = useWorkspaceMetrics(targetWorkspaceId);

    const recentLogs = activityLogs
        .filter(l => l.workspaceId === targetWorkspaceId)
        .slice(0, 10);

    // KPI cards
    const kpis = [
        {
            label: "Org Health",
            value: m.totalTasks > 0 ? `${m.orgHealthPct}%` : "—",
            icon: Activity,
            color: m.orgHealthPct >= 70 ? "text-emerald-400" : m.orgHealthPct >= 40 ? "text-yellow-400" : "text-red-400",
            sub: m.totalTasks > 0 ? `On-time: ${m.onTimeRate}%` : "No tasks yet",
        },
        {
            label: "Revenue",
            value: m.revenueStr !== '—' ? m.revenueStr : "—",
            icon: TrendingUp,
            color: "text-blue-400",
            sub: m.totalRevenue > 0 ? `Forecast: ${m.forecastStr}/yr` : "Upload financial CSV",
        },
        {
            label: "Risk Score",
            value: m.totalTasks > 0 ? `${m.riskScore}` : "—",
            icon: AlertTriangle,
            color: m.riskLabel === 'High' ? "text-red-400" : m.riskLabel === 'Medium' ? "text-yellow-400" : "text-emerald-400",
            sub: m.riskLabel !== 'Low' ? `${m.overdueTasks} overdue · ${m.highBurnoutCount} high burnout` : "Risk is low",
        },
        {
            label: "Productivity",
            value: m.totalTasks > 0 ? `${m.completionRate}%` : "—",
            icon: m.productivityGrowth >= 0 ? TrendingUp : TrendingDown,
            color: m.productivityGrowth >= 0 ? "text-emerald-400" : "text-red-400",
            sub: m.teamVelocity > 0 ? `+${m.teamVelocity} pts this week` : "No completed tasks",
        },
    ];

    // Scatter chart: dept impact vs effort (from metrics)
    const scatterData = m.deptStats.length > 0
        ? m.deptStats.map(d => ({ name: d.name, impact: d.impact, effort: d.effort, z: d.headcount * 40 + 60 }))
        : [
            { name: 'Upload CSV', impact: 50, effort: 50, z: 120 },
        ];

    return (
        <div className="flex flex-col xl:flex-row gap-5 h-[calc(100vh-100px)]">
            {/* ── LEFT: main content ── */}
            <div className="flex-1 flex flex-col gap-5 overflow-y-auto custom-scrollbar pr-1">

                {/* KPI strip */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {kpis.map((kpi, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className="bg-[var(--color-card)] border border-[var(--color-border)] p-5 rounded-2xl flex flex-col gap-1.5 relative overflow-hidden group hover:border-[var(--color-primary)]/40 transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <p className="text-gray-400 text-xs font-medium">{kpi.label}</p>
                                <kpi.icon className={`w-4 h-4 ${kpi.color} opacity-80`} />
                            </div>
                            <p className="text-2xl font-bold">{kpi.value}</p>
                            <p className="text-[11px] text-gray-500">{kpi.sub}</p>
                            <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white/3 rounded-full blur-xl group-hover:bg-[var(--color-primary)]/8 transition-colors" />
                        </motion.div>
                    ))}
                </div>

                {/* Revenue vs Expense trend */}
                {m.transactionTrend.some(w => w.revenue > 0 || w.expense > 0) && (
                    <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-5 rounded-2xl">
                        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
                            Revenue vs Expense — 4-Week Trend
                        </h3>
                        <ResponsiveContainer width="100%" height={160}>
                            <AreaChart data={m.transactionTrend} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                                <defs>
                                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                <XAxis dataKey="date" stroke="#4b5563" tick={{ fontSize: 11 }} />
                                <YAxis stroke="#4b5563" tick={{ fontSize: 11 }} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} />
                                <Tooltip {...tooltipStyle} />
                                <Legend wrapperStyle={{ fontSize: 11 }} />
                                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="var(--color-primary)" fill="url(#revGrad)" strokeWidth={2} dot={false} />
                                <Area type="monotone" dataKey="expense" name="Expense" stroke="#ef4444" fill="url(#expGrad)" strokeWidth={2} dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* 2-col: Dept scatter + Weekly velocity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1">

                    {/* Department Performance scatter */}
                    <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-5 rounded-2xl flex flex-col">
                        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-[var(--color-primary)]" />
                            Department: Impact vs Effort
                        </h3>
                        <div className="flex-1 min-h-[180px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: -10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                    <XAxis type="number" dataKey="effort" name="Effort (pts)" stroke="#4b5563" tick={{ fontSize: 11 }} label={{ value: 'Effort', position: 'bottom', fontSize: 10, fill: '#6b7280' }} />
                                    <YAxis type="number" dataKey="impact" name="Impact %" stroke="#4b5563" tick={{ fontSize: 11 }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                                    <ZAxis type="number" dataKey="z" range={[80, 400]} name="Headcount" />
                                    <Tooltip
                                        {...tooltipStyle}
                                        formatter={(val, name, props) => {
                                            if (name === 'Impact %') return [`${val}%`, name];
                                            if (name === 'Effort (pts)') return [val, name];
                                            return [val, name];
                                        }}
                                        content={({ payload }) => {
                                            if (!payload?.length) return null;
                                            const d = payload[0].payload;
                                            return (
                                                <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-3 text-xs shadow-xl">
                                                    <p className="font-bold text-white mb-1">{d.name}</p>
                                                    <p className="text-gray-400">Impact: <span className="text-white">{d.impact}%</span></p>
                                                    <p className="text-gray-400">Effort: <span className="text-white">{d.effort} pts</span></p>
                                                    <p className="text-gray-400">Headcount: <span className="text-white">{Math.round((d.z - 60) / 40)}</span></p>
                                                </div>
                                            );
                                        }}
                                    />
                                    <Scatter name="Departments" data={scatterData} fill="var(--color-primary)" opacity={0.75} />
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                        {m.deptStats.length === 0 && (
                            <p className="text-xs text-gray-600 text-center mt-2">Upload CSV with department/employee data to populate</p>
                        )}
                    </div>

                    {/* Weekly velocity bar */}
                    <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-5 rounded-2xl flex flex-col">
                        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                            <Users className="w-4 h-4 text-purple-400" />
                            Team Velocity — 4 Weeks
                        </h3>
                        <div className="flex-1 min-h-[180px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={m.weeklyVelocity} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                    <XAxis dataKey="week" stroke="#4b5563" tick={{ fontSize: 11 }} />
                                    <YAxis stroke="#4b5563" tick={{ fontSize: 11 }} />
                                    <Tooltip {...tooltipStyle} />
                                    <Legend wrapperStyle={{ fontSize: 11 }} />
                                    <Bar dataKey="velocity" name="Velocity (pts)" fill="var(--color-primary)" opacity={0.85} radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="target" name="Target" fill="#4b5563" opacity={0.5} radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        {m.weeklyVelocity.every(w => w.velocity === 0) && (
                            <p className="text-xs text-gray-600 text-center mt-2">No completed tasks yet — velocity updates as tasks are marked Done</p>
                        )}
                    </div>
                </div>

                {/* Future Analysis Section — PyTorch LSTM */}
                <FutureAnalysis transactions={m.transactions} />
            </div>

            {/* ── RIGHT: Audit ledger (real activity logs) ── */}
            <div className="w-full xl:w-72 bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl flex flex-col overflow-hidden shrink-0">
                <div className="p-4 border-b border-[var(--color-border)] bg-black/20">
                    <h3 className="font-semibold flex items-center gap-2 text-sm">
                        <Activity className="w-4 h-4 text-[var(--color-primary)]" /> Activity Log
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">{recentLogs.length} recent events</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {recentLogs.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-xs text-gray-600">No activity yet.</p>
                            <p className="text-xs text-gray-600 mt-1">Activity appears after CSV ingestion or user actions.</p>
                        </div>
                    ) : (
                        recentLogs.map(log => (
                            <motion.div
                                key={log.id}
                                initial={{ opacity: 0, x: 12 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-start gap-3 text-sm"
                            >
                                <div className="mt-1 w-2 h-2 rounded-full bg-[var(--color-primary)] shrink-0" />
                                <div className="flex-1">
                                    <p className="font-medium text-sm leading-snug">{log.action}</p>
                                    <p className="text-gray-500 text-xs mt-0.5">
                                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Summary strip */}
                <div className="p-4 border-t border-[var(--color-border)] grid grid-cols-2 gap-3">
                    {[
                        { label: "Employees", value: m.totalEmployees || "—" },
                        { label: "Projects", value: m.totalProjects || "—" },
                        { label: "Tasks Done", value: m.doneTasks || "—" },
                        { label: "Net P&L", value: m.totalRevenue > 0 ? (m.netIncome >= 0 ? `+${m.forecastStr.replace('$', '')}` : m.forecastStr) : "—" },
                    ].map(({ label, value }) => (
                        <div key={label} className="text-center">
                            <p className="text-base font-bold">{value}</p>
                            <p className="text-[10px] text-gray-500">{label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
