"use client";
import { useMemo, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, Legend } from "recharts";
import { motion } from "framer-motion";
import { TrendingUp, ArrowUpRight, ArrowDownRight, Download } from "lucide-react";
import { useAppStore } from "@/store";
import { parseISO, isAfter, startOfWeek, startOfMonth, startOfQuarter, startOfYear } from "date-fns";
import { calculatePerformanceScore } from "@/lib/analytics";

export default function AnalyticsPage() {
    const { activeWorkspaceId, departments, employees, tasks } = useAppStore();
    const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year' | 'all'>('month');
    const [isExporting, setIsExporting] = useState(false);

    // Date Filtering Logic
    const activeTasks = useMemo(() => {
        let allTasks = tasks; // we could filter by active projects, but we'll assume tasks are global to workspace via assignees
        const now = new Date();

        return allTasks.filter(t => {
            if (!t.completedDate && !t.startDate) return true;
            const dateToCompare = t.completedDate ? parseISO(t.completedDate) : parseISO(t.startDate);

            if (dateRange === 'week') return isAfter(dateToCompare, startOfWeek(now));
            if (dateRange === 'month') return isAfter(dateToCompare, startOfMonth(now));
            if (dateRange === 'quarter') return isAfter(dateToCompare, startOfQuarter(now));
            if (dateRange === 'year') return isAfter(dateToCompare, startOfYear(now));
            return true;
        });
    }, [tasks, dateRange]);

    const activeEmps = useMemo(() => employees.filter(e => e.workspaceId === activeWorkspaceId), [employees, activeWorkspaceId]);
    const activeDepts = useMemo(() => departments.filter(d => d.workspaceId === activeWorkspaceId), [departments, activeWorkspaceId]);

    // Department Stats (Strength & Performance)
    const departmentStats = useMemo(() => {
        return activeDepts.map(dept => {
            const deptEmps = activeEmps.filter(e => e.departmentId === dept.id);
            const activeCount = deptEmps.filter(e => e.isActive).length;

            // Average dept performance
            const deptPerf = deptEmps.map(e => calculatePerformanceScore(e, activeTasks).score);
            const avgPerf = deptPerf.length > 0 ? deptPerf.reduce((a, b) => a + b, 0) / deptPerf.length : 0;

            return {
                name: dept.name,
                headcount: deptEmps.length,
                activeCount: activeCount,
                avgPerformance: Math.round(avgPerf)
            };
        });
    }, [activeDepts, activeEmps, activeTasks]);

    // Trend Analysis (Tasks Completed vs Added over time in the range)
    const trendData = useMemo(() => {
        const sorted = [...activeTasks].sort((a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime());
        if (sorted.length === 0) return [];

        const map = new Map<string, { date: string, added: number, completed: number }>();

        sorted.forEach(t => {
            // Group by shortened date (e.g. Month if Year filtered, Day if Month filtered)
            const dateStr = dateRange === 'year' || dateRange === 'all' ? t.startDate.substring(0, 7) : t.startDate.substring(0, 10);

            if (!map.has(dateStr)) map.set(dateStr, { date: dateStr, added: 0, completed: 0 });
            map.get(dateStr)!.added += 1;

            if (t.status === 'Done' && t.completedDate) {
                const cDateStr = dateRange === 'year' || dateRange === 'all' ? t.completedDate.substring(0, 7) : t.completedDate.substring(0, 10);
                if (!map.has(cDateStr)) map.set(cDateStr, { date: cDateStr, added: 0, completed: 0 });
                map.get(cDateStr)!.completed += 1;
            }
        });

        return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
    }, [activeTasks, dateRange]);

    const totalHeadcount = activeEmps.length;
    const completedTasks = activeTasks.filter(t => t.status === 'Done').length;
    const avgScore = departmentStats.length > 0 ? Math.round(departmentStats.reduce((a, d) => a + d.avgPerformance, 0) / departmentStats.length) : 0;

    const statsCards = [
        { title: "Total Headcount", value: totalHeadcount.toString(), change: "Active", isPositive: true },
        { title: "Completed Tasks", value: completedTasks.toString(), change: "In Range", isPositive: true },
        { title: "Avg Organization Score", value: avgScore.toString() + "/100", change: "Performance", isPositive: avgScore >= 70 },
    ];

    const exportPDF = async () => {
        setIsExporting(true);
        try {
            const html2canvas = (await import('html2canvas')).default;
            const jsPDF = (await import('jspdf')).default;
            const element = document.getElementById('analytics-report');
            if (!element) return;

            const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#000000' });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Unify-Analytics-Report-${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error("Failed to export PDF", error);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[var(--color-card)] p-4 rounded-2xl border border-[var(--color-border)] gap-4">
                <div>
                    <h2 className="text-xl font-bold">Advanced Analytics</h2>
                    <p className="text-sm text-gray-400">Deep dive into organization metrics and forecasting.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value as any)}
                        className="bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-primary)]"
                    >
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="quarter">This Quarter</option>
                        <option value="year">This Year</option>
                        <option value="all">All Time</option>
                    </select>
                    <button
                        onClick={exportPDF}
                        disabled={isExporting}
                        className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors disabled:opacity-50"
                    >
                        {isExporting ? 'Generating...' : <><Download className="w-4 h-4" /> Export Report</>}
                    </button>
                </div>
            </div>

            {/* Container for PDF Generation */}
            <div id="analytics-report" className="space-y-6 p-1">
                {/* Header for PDF only, hidden normally but html2canvas picks it up if we style it right... actually just let it render natively */}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {statsCards.map((stat, i) => (
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Historical Performance Trend Chart */}
                    <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-6 rounded-2xl flex flex-col min-h-[400px]">
                        <h3 className="font-semibold mb-6 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-[var(--color-primary)]" />
                            Historical Task Trends
                        </h3>
                        <div className="flex-1 w-full min-h-[300px]">
                            {trendData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorAdded" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#5e6ad2" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#5e6ad2" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorDone" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                        <XAxis dataKey="date" stroke="#ffffff40" fontSize={12} />
                                        <YAxis stroke="#ffffff40" fontSize={12} />
                                        <Tooltip contentStyle={{ backgroundColor: 'black', borderColor: 'var(--color-border)', borderRadius: '8px' }} />
                                        <Legend />
                                        <Area type="monotone" dataKey="added" stroke="#5e6ad2" fillOpacity={1} fill="url(#colorAdded)" name="Tasks Added" />
                                        <Area type="monotone" dataKey="completed" stroke="#10b981" fillOpacity={1} fill="url(#colorDone)" name="Tasks Completed" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-500">No data available for this range.</div>
                            )}
                        </div>
                    </div>

                    {/* Department Comparison Bar Chart */}
                    <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-6 rounded-2xl flex flex-col min-h-[400px]">
                        <h3 className="font-semibold mb-6 text-[var(--color-primary)]">Department Performance Comparison</h3>
                        <div className="flex-1 w-full min-h-[300px]">
                            {departmentStats.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={departmentStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                        <XAxis dataKey="name" stroke="#ffffff40" fontSize={12} />
                                        <YAxis stroke="#ffffff40" fontSize={12} />
                                        <Tooltip cursor={{ fill: '#ffffff10' }} contentStyle={{ backgroundColor: 'black', borderColor: 'var(--color-border)', borderRadius: '8px' }} />
                                        <Legend />
                                        <Bar dataKey="avgPerformance" fill="#5e6ad2" radius={[4, 4, 0, 0]} name="Avg Score (/100)" />
                                        <Bar dataKey="headcount" fill="#10b981" radius={[4, 4, 0, 0]} name="Headcount" />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-500">No departments setup.</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Department Details Table */}
                <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-6 rounded-2xl w-full">
                    <h3 className="font-semibold mb-4">Department Breakdowns</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-400 bg-white/5 uppercase">
                                <tr>
                                    <th className="px-4 py-3 rounded-tl-lg">Department</th>
                                    <th className="px-4 py-3">Headcount</th>
                                    <th className="px-4 py-3">Active Ratio</th>
                                    <th className="px-4 py-3 rounded-tr-lg">Avg Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {departmentStats.map((dept, i) => (
                                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3 font-medium">{dept.name}</td>
                                        <td className="px-4 py-3">{dept.headcount} employees</td>
                                        <td className="px-4 py-3">{dept.headcount ? `${Math.round((dept.activeCount / dept.headcount) * 100)}%` : '0%'}</td>
                                        <td className="px-4 py-3 text-emerald-400 font-bold">{dept.avgPerformance}</td>
                                    </tr>
                                ))}
                                {departmentStats.length === 0 && (
                                    <tr><td colSpan={4} className="text-center py-6 text-gray-500">No data available.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
