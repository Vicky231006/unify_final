"use client";
import { CheckCircle2, Star, Target, Zap, Briefcase } from "lucide-react";
import { motion } from "framer-motion";
import { useAppStore } from "@/store";
import { formatDistanceToNow, parseISO } from "date-fns";

export function EmployeeView() {
    const { employees, tasks, activeWorkspaceId, projects } = useAppStore();

    // Naively assume the "current user" is the first employee in the workspace, or generate generic stats
    const currentUser = employees.find(e => e.workspaceId === activeWorkspaceId);

    // Get real tasks assigned to this user, or any task if no user exists
    const userTasks = currentUser
        ? tasks.filter(t => t.assigneeId === currentUser.id)
        : tasks.filter(t => projects.some(p => p.id === t.projectId && p.workspaceId === activeWorkspaceId));

    const completedTasks = userTasks.filter(t => t.status === 'Done');
    const pendingTasks = userTasks.filter(t => t.status !== 'Done');

    // Generate real ledger from recently completed tasks or activity
    const ledger = completedTasks.map(t => ({
        title: `Completed: ${t.title}`,
        pts: `+${t.weight * 10} XP`,
        date: t.completedDate ? formatDistanceToNow(parseISO(t.completedDate), { addSuffix: true }) : 'Recently',
        icon: CheckCircle2,
        color: "text-emerald-400"
    }));

    // If empty ledger, add some sample data
    if (ledger.length === 0) {
        ledger.push({ title: "Setup workspace profile", pts: "+50 XP", date: "Just now", icon: Zap, color: "text-blue-400" });
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-160px)] overflow-y-auto custom-scrollbar pr-2 pb-4">
            {/* My Path */}
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-6 rounded-2xl flex flex-col gap-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            <Target className="w-5 h-5 text-[var(--color-primary)]" /> My Path
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">{currentUser ? `Acting as: ${currentUser.name}` : 'Employee Perspective'}</p>
                    </div>
                    <span className="px-3 py-1 bg-[var(--color-primary)]/20 text-[var(--color-primary)] rounded-full text-xs font-bold whitespace-nowrap">Lvl 4 Contributor</span>
                </div>

                <div className="relative pt-8 pb-4">
                    {/* Progress track */}
                    <div className="absolute top-1/2 left-0 w-full h-2 bg-black/40 rounded-full -translate-y-1/2 border border-[var(--color-border)]" />
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '65%' }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="absolute top-1/2 left-0 h-2 bg-gradient-to-r from-[var(--color-primary)] to-purple-400 rounded-full -translate-y-1/2 shadow-[0_0_12px_var(--color-primary)]"
                    />

                    {/* Nodes */}
                    <div className="relative flex justify-between">
                        {[1, 2, 3, 4, 5].map((lvl) => (
                            <div key={lvl} className={`w-8 h-8 rounded-full flex items-center justify-center border-2 z-10 ${lvl <= 3 ? 'bg-[var(--color-primary)] border-white shadow-[0_0_10px_var(--color-primary)]' : 'bg-black/80 border-[var(--color-border)] text-gray-500'}`}>
                                {lvl <= 3 ? <CheckCircle2 className="w-4 h-4 text-white" /> : lvl}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col justify-center">
                        <p className="text-gray-400 text-xs mb-1 uppercase tracking-wider">Current KPI</p>
                        <p className="font-semibold leading-tight mt-1">{pendingTasks.length > 0 ? `Ship ${pendingTasks.length} pending tasks` : 'All caught up!'}</p>
                        <p className={`text-sm mt-2 font-medium ${pendingTasks.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>{pendingTasks.length > 0 ? 'In Progress' : 'On Track'}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col justify-center">
                        <p className="text-gray-400 text-xs mb-1 uppercase tracking-wider">Next Milestone</p>
                        <p className="font-semibold leading-tight mt-1">Team Lead Res.</p>
                        <p className="text-[var(--color-primary)] text-sm mt-2 font-medium">250 XP away</p>
                    </div>
                </div>
            </div>

            {/* Contribution Log */}
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-6 rounded-2xl flex flex-col gap-4">
                <h3 className="font-semibold flex items-center gap-2 mb-2">
                    <Star className="w-5 h-5 text-yellow-500" /> Transparent Ledger
                </h3>
                <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                    {ledger.map((log, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex gap-4 p-4 rounded-xl bg-black/20 border border-white/5 hover:bg-white/5 transition-colors group">
                            <div className="mt-1">
                                <log.icon className={`w-5 h-5 ${log.color}`} />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <p className="font-medium text-sm group-hover:text-[var(--color-primary)] transition-colors pr-4">{log.title}</p>
                                    <span className="text-emerald-400 text-sm font-bold shrink-0">{log.pts}</span>
                                </div>
                                <p className="text-gray-500 text-xs mt-1">{log.date}</p>
                            </div>
                        </motion.div>
                    ))}

                    {/* Render active tasks here as upcoming work */}
                    {pendingTasks.map((t, i) => (
                        <motion.div key={`pending-${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10 opacity-70">
                            <div className="mt-1">
                                <Briefcase className="w-5 h-5 text-gray-400" />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <p className="font-medium text-sm pr-4 text-gray-300">Working: {t.title}</p>
                                    <span className="text-gray-400 text-xs font-medium bg-black/50 px-2 py-0.5 rounded uppercase tracking-wider">{t.status}</span>
                                </div>
                                <p className="text-gray-500 text-xs mt-1">Potential +{t.weight * 10} XP</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
