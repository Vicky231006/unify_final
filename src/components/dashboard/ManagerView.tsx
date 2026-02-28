"use client";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const burnoutData = [
    { week: 'W1', engineering: 30, sales: 20, hr: 10 },
    { week: 'W2', engineering: 45, sales: 25, hr: 15 },
    { week: 'W3', engineering: 60, sales: 30, hr: 20 },
    { week: 'W4', engineering: 85, sales: 40, hr: 25 },
    { week: 'W5', engineering: 95, sales: 50, hr: 30 },
];

export function ManagerView() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-160px)] overflow-y-auto custom-scrollbar pr-2 pb-4">
            {/* Employee Burnout Heatmap (using AreaChart as substitute for complex heatmap) */}
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-6 rounded-2xl col-span-1 lg:col-span-2 min-h-[300px] flex flex-col">
                <h3 className="font-semibold mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    Employee Burnout Forecast
                </h3>
                <div className="flex-1 w-full min-h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={burnoutData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorEng" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="week" stroke="#ffffff30" />
                            <YAxis stroke="#ffffff30" />
                            <Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: '8px' }} />
                            <Area type="monotone" dataKey="engineering" stroke="#ef4444" fillOpacity={1} fill="url(#colorEng)" />
                            <Area type="monotone" dataKey="sales" stroke="#f59e0b" fillOpacity={1} fill="url(#colorSales)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Gantt-Flow */}
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-6 rounded-2xl flex flex-col gap-4">
                <h3 className="font-semibold mb-2">Active Initiatives (Gantt-Flow)</h3>
                <div className="flex-1 space-y-4">
                    {['Project Phoenix', 'Q3 Pipeline', 'Infra Migration'].map((proj, i) => (
                        <div key={proj} className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span>{proj}</span>
                                <span className="text-gray-400">{(i + 1) * 20}%</span>
                            </div>
                            <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden border border-[var(--color-border)]">
                                <div className="bg-[var(--color-primary)] h-full transition-all duration-1000 ease-out" style={{ width: `${(i + 1) * 20}%` }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Resource Allocation */}
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-6 rounded-2xl flex flex-col gap-4">
                <h3 className="font-semibold mb-2">Resource Allocation & Performance</h3>
                <div className="flex-1 space-y-3">
                    {[
                        { name: "Sarah Connor", role: "Frontend Lead", score: 98 },
                        { name: "John Smith", role: "Backend Eng", score: 85 },
                        { name: "Alice Wang", role: "Designer", score: 92 },
                    ].map((user) => (
                        <div key={user.name} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white uppercase">{user.name[0]}</div>
                            <div className="flex-1">
                                <p className="text-sm font-medium">{user.name}</p>
                                <p className="text-xs text-gray-400">{user.role}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-emerald-400">{user.score}</p>
                                <p className="text-[10px] text-gray-500">Score</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
