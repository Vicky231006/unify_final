"use client";
import { useEffect, useState, useMemo } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Activity, TrendingUp, AlertTriangle, Database } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";

const scatterData = [
    { name: 'Engineering', impact: 85, effort: 90, z: 200 },
    { name: 'Marketing', impact: 65, effort: 45, z: 150 },
    { name: 'Sales', impact: 90, effort: 60, z: 250 },
    { name: 'HR', impact: 50, effort: 40, z: 100 },
    { name: 'Product', impact: 75, effort: 85, z: 180 },
];

export function CEOView() {
    const { transactions } = useWorkspace();
    const [logs, setLogs] = useState([
        { id: 1, action: "System Auth", user: "j.doe", time: "Just now" },
        { id: 2, action: "DB Query", user: "system", time: "2s ago" },
        { id: 3, action: "API Route Add", user: "a.chen", time: "15s ago" },
        { id: 4, action: "Asset Deployed", user: "m.smith", time: "1m ago" },
    ]);

    const stats = useMemo(() => {
        let totalRev = 0;
        let totalExp = 0;

        transactions.forEach(t => {
            if (t.Type === 'Revenue') totalRev += t.Amount;
            if (t.Type === 'Expense') totalExp += t.Amount;
        });

        // Formatting as Millions or Thousands for neatness
        const formatMoney = (val: number) => {
            if (val > 1000000) return `$${(val / 1000000).toFixed(2)}M`;
            if (val > 1000) return `$${(val / 1000).toFixed(1)}K`;
            return `$${val}`;
        };

        return {
            revenue: totalRev > 0 ? formatMoney(totalRev) : "$2.4M", // Fallback if no csv loaded
            health: transactions.length > 0 ? "99.9%" : "98.2%",
            risk: (totalExp > totalRev && totalExp > 0) ? "High" : "Low",
            assets: transactions.length > 0 ? transactions.length.toString() : "1,204"
        }
    }, [transactions]);

    useEffect(() => {
        const interval = setInterval(() => {
            setLogs(prev => [
                { id: Date.now(), action: ['Node Sync', 'Data Export', 'Model Training', 'Auth Token'][Math.floor(Math.random() * 4)], user: ['system', 'bot-1', 'a.chen', 'k.lee'][Math.floor(Math.random() * 4)], time: "Just now" },
                ...prev.slice(0, 9)
            ]);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col xl:flex-row gap-6 h-[calc(100vh-160px)]">
            <div className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
                {/* Top 4 Bento Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: "Org Health", value: stats.health, icon: Activity, color: "text-emerald-400" },
                        { label: "ROI Pipeline", value: stats.revenue, icon: TrendingUp, color: "text-blue-400" },
                        { label: "Risk Score", value: stats.risk, icon: AlertTriangle, color: "text-yellow-400" },
                        { label: "Active Assets", value: stats.assets, icon: Database, color: "text-purple-400" },
                    ].map((stat, i) => (
                        <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} className="bg-[var(--color-card)] border border-[var(--color-border)] p-5 rounded-2xl flex flex-col gap-2 relative overflow-hidden group hover:border-[var(--color-primary)]/50 transition-colors">
                            <div className="flex items-center justify-between">
                                <p className="text-gray-400 text-sm">{stat.label}</p>
                                <stat.icon className={`w-4 h-4 ${stat.color} opacity-80`} />
                            </div>
                            <p className="text-2xl font-bold">{stat.value}</p>
                            <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white/5 rounded-full blur-xl group-hover:bg-[var(--color-primary)]/10 transition-colors" />
                        </motion.div>
                    ))}
                </div>

                {/* Scatter Plot */}
                <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-6 rounded-2xl flex-1 flex flex-col min-h-[300px]">
                    <h3 className="font-semibold mb-6 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
                        Departmental Productivity (Impact vs. Effort)
                    </h3>
                    <div className="flex-1 w-full h-full min-h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                                <XAxis type="number" dataKey="effort" name="Effort" stroke="#ffffff30" />
                                <YAxis type="number" dataKey="impact" name="Impact" stroke="#ffffff30" />
                                <ZAxis type="number" dataKey="z" range={[100, 500]} name="Volume" />
                                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: '8px' }} />
                                <Scatter name="Departments" data={scatterData} fill="var(--color-primary)" opacity={0.6} />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Side Global Audit Ledger */}
            <div className="w-full xl:w-80 bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl flex flex-col overflow-hidden max-h-[600px] xl:max-h-full">
                <div className="p-4 border-b border-[var(--color-border)] bg-black/20">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Activity className="w-4 h-4 text-[var(--color-primary)]" /> Global Audit Ledger
                    </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    <AnimatePresence>
                        {logs.map((log) => (
                            <motion.div key={log.id} initial={{ opacity: 0, x: 20, height: 0 }} animate={{ opacity: 1, x: 0, height: 'auto' }} className="flex items-start gap-3 text-sm">
                                <div className="mt-1 w-2 h-2 rounded-full bg-[var(--color-primary)] shadow-[0_0_8px_var(--color-primary)]" />
                                <div className="flex-1">
                                    <p className="font-medium">{log.action}</p>
                                    <p className="text-gray-500 text-xs">by {log.user}</p>
                                </div>
                                <span className="text-xs text-gray-500 whitespace-nowrap">{log.time}</span>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
