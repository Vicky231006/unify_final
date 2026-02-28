"use client";
import { useState } from 'react';
import { useAppStore } from '@/store';
import { calculateBurnoutRisk, calculatePerformanceScore } from '@/lib/analytics';
import { ProjectTaskManagement } from './ProjectTaskManagement';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { CheckCircle2, Zap, ListTodo, AlertTriangle, UserPlus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Assign Task Modal ─────────────────────────────────────────────────────────
function AssignTaskModal({ onClose }: { onClose: () => void }) {
    const { employees, projects, tasks, activeWorkspaceId, addTask } = useAppStore();
    const wsEmployees = employees.filter(e => e.workspaceId === activeWorkspaceId);
    const wsProjects = projects.filter(p => p.workspaceId === activeWorkspaceId);

    const [form, setForm] = useState({
        title: '',
        assigneeId: wsEmployees[0]?.id || '',
        projectId: wsProjects[0]?.id || '',
        status: 'To Do' as const,
        weight: 5,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
        type: 'Task',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim() || !form.projectId) return;
        addTask({
            projectId: form.projectId,
            title: form.title,
            type: form.type,
            assigneeId: form.assigneeId || null,
            status: form.status,
            weight: form.weight,
            startDate: new Date(form.startDate).toISOString(),
            endDate: new Date(form.endDate).toISOString(),
            completedDate: null,
            qualityIndicator: 80,
            dependencies: [],
        });
        onClose();
    };

    const fieldClass = "w-full bg-white/5 border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors";
    const labelClass = "block text-xs font-medium text-gray-400 mb-1";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                className="relative w-full max-w-md bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6 shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-[var(--color-primary)]" /> Assign Task
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className={labelClass}>Task Title *</label>
                        <input type="text" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                            className={fieldClass} placeholder="e.g. Design dashboard mockup" autoFocus />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelClass}>Assign To</label>
                            <select value={form.assigneeId} onChange={e => setForm(f => ({ ...f, assigneeId: e.target.value }))} className={fieldClass + " bg-[#111]"}>
                                <option value="">Unassigned</option>
                                {wsEmployees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Project *</label>
                            <select required value={form.projectId} onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))} className={fieldClass + " bg-[#111]"}>
                                <option value="">Select project</option>
                                {wsProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelClass}>Type</label>
                            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={fieldClass + " bg-[#111]"}>
                                {['Task', 'Feature', 'Bug', 'Review', 'Research'].map(t => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Status</label>
                            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))} className={fieldClass + " bg-[#111]"}>
                                {['To Do', 'In Progress', 'Review', 'Done'].map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelClass}>Start Date</label>
                            <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className={fieldClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Due Date</label>
                            <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className={fieldClass} />
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>Weight / Complexity: <span className="text-white font-semibold">{form.weight}</span></label>
                        <input type="range" min={1} max={10} value={form.weight}
                            onChange={e => setForm(f => ({ ...f, weight: Number(e.target.value) }))}
                            className="w-full accent-[var(--color-primary)]" />
                        <div className="flex justify-between text-[10px] text-gray-600 mt-0.5"><span>Simple</span><span>Complex</span></div>
                    </div>

                    {wsProjects.length === 0 && (
                        <p className="text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 rounded-lg px-3 py-2">
                            ⚠ No projects found. Create a project first from the Projects tab.
                        </p>
                    )}

                    <button type="submit" disabled={wsProjects.length === 0}
                        className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/80 disabled:opacity-40 text-white font-semibold py-2.5 rounded-lg transition-all text-sm mt-1">
                        Assign Task
                    </button>
                </form>
            </motion.div>
        </div>
    );
}

// ── Manager View ───────────────────────────────────────────────────────────────
export function ManagerView() {
    const { employees, tasks, projects, activityLogs, activeWorkspaceId } = useAppStore();
    const [showAssignModal, setShowAssignModal] = useState(false);

    const activeEmployees = employees.filter(e => e.workspaceId === activeWorkspaceId);

    const burnoutData = activeEmployees.map(emp => {
        const riskData = calculateBurnoutRisk(emp, tasks);
        return { ...emp, burnoutScore: riskData.score, riskLevel: riskData.risk, log: riskData.log };
    });

    const performanceData = activeEmployees.map(emp => {
        const perfData = calculatePerformanceScore(emp, tasks);
        return { ...emp, score: perfData.score, log: perfData.log };
    });

    const doneTasks = tasks.filter(t => t.status === 'Done');
    const openTasks = tasks.filter(t => t.status !== 'Done');
    const highBurnout = burnoutData.filter(e => e.riskLevel === 'High');

    const kpis = [
        { label: 'On-Time %', value: tasks.length > 0 ? `${Math.round((doneTasks.length / Math.max(tasks.length, 1)) * 100)}%` : '—', icon: CheckCircle2, color: 'text-emerald-400' },
        { label: 'Team Velocity', value: `${doneTasks.length} done`, icon: Zap, color: 'text-blue-400' },
        { label: 'Open Tasks', value: openTasks.length, icon: ListTodo, color: 'text-yellow-400' },
        { label: 'Burnout Risk', value: highBurnout.length > 0 ? `${highBurnout.length} high` : 'None', icon: AlertTriangle, color: highBurnout.length > 0 ? 'text-red-400' : 'text-emerald-400' },
    ];

    return (
        <>
            <AnimatePresence>
                {showAssignModal && <AssignTaskModal onClose={() => setShowAssignModal(false)} />}
            </AnimatePresence>

            <div className="flex flex-col gap-5 h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar pr-2 pb-4">

                {/* ── Action row ── */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="font-bold text-lg">Projects & Team</h2>
                        <p className="text-xs text-gray-500">
                            {projects.filter(p => p.workspaceId === activeWorkspaceId).length} active projects · {activeEmployees.length} team members
                        </p>
                    </div>
                    <button
                        onClick={() => setShowAssignModal(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-80"
                        style={{ background: 'var(--color-primary)' }}
                    >
                        <UserPlus className="w-4 h-4" /> Assign Task
                    </button>
                </div>

                {/* ── KPI strip ── */}
                <div className="grid grid-cols-4 gap-3">
                    {kpis.map((kpi, i) => (
                        <div key={i} className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-3 flex items-center gap-3">
                            <kpi.icon className={`w-4 h-4 shrink-0 ${kpi.color}`} />
                            <div>
                                <p className="text-xs text-gray-500">{kpi.label}</p>
                                <p className="font-bold text-sm">{kpi.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Main 3-col grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 flex-1">

                    {/* Project & Task Management — full width */}
                    <div className="col-span-3 bg-[var(--color-card)] border border-[var(--color-border)] p-6 rounded-2xl min-h-[380px]">
                        <ProjectTaskManagement />
                    </div>

                    {/* Resource Performance */}
                    <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-5 rounded-2xl flex flex-col gap-3 h-80 overflow-y-auto custom-scrollbar">
                        <h3 className="font-semibold text-sm">Resource Performance</h3>
                        {performanceData.length === 0
                            ? <p className="text-gray-500 text-sm">No employees found. Import data or add employees from Teams.</p>
                            : performanceData.map(user => (
                                <div key={user.id}
                                    className="group relative flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-help">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white uppercase shrink-0">
                                        {user.name[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{user.name}</p>
                                        <p className="text-xs text-gray-400 truncate">{user.role}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-sm font-bold text-emerald-400">{user.score}/100</p>
                                        <p className="text-[10px] text-gray-500">Score</p>
                                    </div>
                                    <div className="absolute top-14 left-0 w-full z-20 hidden group-hover:block bg-black/90 p-2 rounded text-[10px] text-gray-300 pointer-events-none shadow-xl border border-white/10">
                                        <p className="font-bold text-white border-b border-white/20 mb-1 pb-1">Calculation Reasoning:</p>
                                        {user.log.map((entry, idx) => <p key={idx}>• {entry}</p>)}
                                    </div>
                                </div>
                            ))
                        }
                    </div>

                    {/* Burnout Risk */}
                    <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-5 rounded-2xl h-80 overflow-y-auto custom-scrollbar flex flex-col gap-3">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Burnout Risk
                        </h3>
                        {burnoutData.length === 0
                            ? <p className="text-gray-500 text-sm">No team data available.</p>
                            : burnoutData.map(emp => (
                                <div key={emp.id} className="group relative p-3 rounded-lg bg-white/5 border border-white/5 text-sm">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-medium">{emp.name}</span>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${emp.riskLevel === 'High' ? 'bg-red-500/20 text-red-400' : emp.riskLevel === 'Medium' ? 'bg-orange-500/20 text-orange-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                            {emp.riskLevel}
                                        </span>
                                    </div>
                                    <div className="w-full bg-white/10 rounded-full h-1">
                                        <div className={`h-full rounded-full ${emp.riskLevel === 'High' ? 'bg-red-500' : emp.riskLevel === 'Medium' ? 'bg-orange-500' : 'bg-emerald-500'}`}
                                            style={{ width: `${Math.min(emp.burnoutScore, 100)}%` }} />
                                    </div>
                                    <div className="absolute top-16 left-0 w-full z-20 hidden group-hover:block bg-black/95 p-3 rounded text-xs text-gray-300 pointer-events-none shadow-xl border border-white/10">
                                        <p className="font-bold text-white border-b border-white/20 mb-1 pb-1">Calculation Logic:</p>
                                        {emp.log.map((entry, idx) => <p key={idx} className="mb-0.5">• {entry}</p>)}
                                    </div>
                                </div>
                            ))
                        }
                    </div>

                    {/* Activity Logs */}
                    <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-5 rounded-2xl h-80 overflow-y-auto custom-scrollbar flex flex-col gap-3">
                        <h3 className="font-semibold text-sm">Workspace Activity</h3>
                        <div className="space-y-3">
                            {activityLogs.filter(log => log.workspaceId === activeWorkspaceId).length === 0
                                ? <p className="text-gray-500 text-sm text-center mt-4">No recent activity.</p>
                                : activityLogs.filter(log => log.workspaceId === activeWorkspaceId).slice(0, 15).map(log => (
                                    <div key={log.id} className="flex gap-3 text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] mt-1.5 shrink-0" />
                                        <div>
                                            <p className="text-gray-200 text-sm">{log.action}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{formatDistanceToNow(parseISO(log.timestamp), { addSuffix: true })}</p>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}
