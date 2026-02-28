"use client";
import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";
import { motion } from "framer-motion";
import { TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";

const fallbackRevenueData = [
    { month: 'Jan', rev: 4000, cost: 2400 },
    { month: 'Feb', rev: 3000, cost: 1398 },
    { month: 'Mar', rev: 2000, cost: 9800 },
    { month: 'Apr', rev: 2780, cost: 3908 },
    { month: 'May', rev: 1890, cost: 4800 },
    { month: 'Jun', rev: 2390, cost: 3800 },
    { month: 'Jul', rev: 3490, cost: 4300 },
];

const productivityData = [
    { name: 'Week 1', score: 85 },
    { name: 'Week 2', score: 88 },
    { name: 'Week 3', score: 92 },
    { name: 'Week 4', score: 89 },
];

export default function AnalyticsPage() {
    const { transactions } = useWorkspace();

    const dynamicRevenueData = useMemo(() => {
        if (transactions.length === 0) return fallbackRevenueData;

        const agg: Record<string, { month: string, rev: number, cost: number }> = {};
        transactions.forEach(t => {
            const dateStr = t.Date || 'Unknown';
            const monthPrefix = dateStr.substring(0, 7) || 'Unknown'; // e.g., '2024-01'
            if (!agg[monthPrefix]) agg[monthPrefix] = { month: monthPrefix, rev: 0, cost: 0 };
            if (t.Type === 'Revenue') agg[monthPrefix].rev += t.Amount;
            if (t.Type === 'Expense') agg[monthPrefix].cost += t.Amount;
        });

        // Sort chronologically and take last 12
        return Object.values(agg).sort((a, b) => a.month.localeCompare(b.month)).slice(-12);
    }, [transactions]);

    const stats = useMemo(() => {
        if (transactions.length === 0) {
            return [
                { title: "Total Revenue", value: "$1.2M", change: "+12.5%", isPositive: true },
                { title: "Operating Cost", value: "$840K", change: "-4.2%", isPositive: true },
                { title: "Avg. Velocity", value: "42 pts/wk", change: "-1.5%", isPositive: false },
            ];
        }

        let totalRev = 0;
        let totalExp = 0;
        transactions.forEach(t => {
            if (t.Type === 'Revenue') totalRev += t.Amount;
            if (t.Type === 'Expense') totalExp += t.Amount;
        });

        const formatMoney = (val: number) => {
            if (val > 1000000) return `$${(val / 1000000).toFixed(2)}M`;
            if (val > 1000) return `$${(val / 1000).toFixed(1)}K`;
            return `$${val}`;
        };

        return [
            { title: "Total Revenue", value: formatMoney(totalRev), change: "Active", isPositive: true },
            { title: "Operating Cost", value: formatMoney(totalExp), change: "Active", isPositive: totalRev >= totalExp },
            { title: "Transactions", value: transactions.length.toString(), change: "Live", isPositive: true },
        ];
    }, [transactions]);


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-[var(--color-card)] p-4 rounded-2xl border border-[var(--color-border)]">
                <div>
                    <h2 className="text-xl font-bold">Advanced Analytics</h2>
                    <p className="text-sm text-gray-400">Deep dive into organization metrics and forecasting.</p>
                </div>
                <div className="flex gap-2">
                    <select className="bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-primary)]">
                        <option>Last 30 Days</option>
                        <option>This Quarter</option>
                        <option>This Year</option>
                    </select>
                    <button className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors">
                        Export Report
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-[var(--color-card)] border border-[var(--color-border)] p-6 rounded-2xl flex justify-between items-center">
                        <div>
                            <p className="text-gray-400 text-sm mb-1">{stat.title}</p>
                            <p className="text-3xl font-bold">{stat.value}</p>
                        </div>
                        <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${stat.isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-500'}`}>
                            {stat.isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                            {stat.change}
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Forecast Area Chart */}
                <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-6 rounded-2xl col-span-1 lg:col-span-2 min-h-[400px] flex flex-col">
                    <h3 className="font-semibold mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-[var(--color-primary)]" />
                        Revenue vs Cost Forecast
                    </h3>
                    <div className="flex-1 w-full min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dynamicRevenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#5e6ad2" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#5e6ad2" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.5} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                <XAxis dataKey="month" stroke="#ffffff40" />
                                <YAxis stroke="#ffffff40" />
                                <Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: '8px' }} />
                                <Area type="monotone" dataKey="rev" stroke="#5e6ad2" fillOpacity={1} fill="url(#colorRev)" name="Revenue" />
                                <Area type="monotone" dataKey="cost" stroke="#ef4444" fillOpacity={1} fill="url(#colorCost)" name="Cost" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Global Productivity Bar Chart */}
                <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-6 rounded-2xl flex flex-col min-h-[400px]">
                    <h3 className="font-semibold mb-6">Global Productivity Score</h3>
                    <div className="flex-1 w-full min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={productivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                <XAxis dataKey="name" stroke="#ffffff40" fontSize={12} />
                                <YAxis stroke="#ffffff40" fontSize={12} />
                                <Tooltip cursor={{ fill: '#ffffff10' }} contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: '8px' }} />
                                <Bar dataKey="score" fill="#5e6ad2" radius={[4, 4, 0, 0]} name="Score" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
