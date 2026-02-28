"use client";
import { useMemo, useState } from "react";
import { useAppStore } from "@/store";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { motion } from "framer-motion";
import {
    differenceInDays, addDays, format, parseISO, isToday,
    isBefore, isAfter, startOfDay
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar, Clock, CheckCircle2, AlertCircle, Circle } from "lucide-react";

const STATUS_STYLES: Record<string, { bar: string; badge: string; text: string }> = {
    "Done": { bar: "bg-emerald-500", badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", text: "text-emerald-400" },
    "In Progress": { bar: "bg-[var(--color-primary)]", badge: "bg-blue-500/15 text-blue-400 border-blue-500/30", text: "text-blue-400" },
    "Review": { bar: "bg-yellow-500", badge: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", text: "text-yellow-400" },
    "To Do": { bar: "bg-gray-500", badge: "bg-white/5 text-gray-400 border-white/10", text: "text-gray-400" },
    "Overdue": { bar: "bg-red-500", badge: "bg-red-500/15 text-red-400 border-red-500/30", text: "text-red-400" },
};

function getEffectiveStatus(task: any): string {
    if (task.status === "Done") return "Done";
    if (isBefore(parseISO(task.endDate), startOfDay(new Date()))) return "Overdue";
    return task.status;
}

export default function SchedulePage() {
    const { employees, tasks, projects, activeWorkspaceId } = useAppStore();
    const { userRole } = useWorkspace();
    const [viewOffset, setViewOffset] = useState(0); // pan days
    const VISIBLE_DAYS = 28; // 4 weeks visible

    // Current user (Employee) or all workspace tasks (Manager/CEO)
    const currentUser = employees.find(e => e.workspaceId === activeWorkspaceId);
    const workspaceProjects = projects.filter(p => p.workspaceId === activeWorkspaceId);

    const relevantTasks = useMemo(() => {
        const wsTaskIds = workspaceProjects.map(p => p.id);
        const wsTasks = tasks.filter(t => wsTaskIds.includes(t.projectId));
        if (userRole === "Employee" && currentUser) {
            return wsTasks.filter(t => t.assigneeId === currentUser.id);
        }
        return wsTasks;
    }, [tasks, workspaceProjects, userRole, currentUser]);

    // Timeline window
    const windowStart = addDays(startOfDay(new Date()), viewOffset);
    const windowEnd = addDays(windowStart, VISIBLE_DAYS - 1);
    const dayHeaders = Array.from({ length: VISIBLE_DAYS }, (_, i) => addDays(windowStart, i));

    // Compute bar position & width for a task
    const getBarStyle = (task: any) => {
        const start = parseISO(task.startDate);
        const end = parseISO(task.endDate);
        const left = Math.max(differenceInDays(start, windowStart), 0);
        const right = Math.min(differenceInDays(end, windowStart), VISIBLE_DAYS - 1);
        const width = right - left + 1;

        if (right < 0 || left >= VISIBLE_DAYS || width <= 0) return null;
        const pct = (1 / VISIBLE_DAYS) * 100;
        return { left: `${left * pct}%`, width: `${Math.max(width * pct, pct * 0.5)}%` };
    };

    // Stats
    const done = relevantTasks.filter(t => t.status === "Done").length;
    const overdue = relevantTasks.filter(t => getEffectiveStatus(t) === "Overdue").length;
    const active = relevantTasks.filter(t => t.status === "In Progress").length;

    return (
        <div className="flex flex-col gap-5 h-[calc(100vh-90px)] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h2 className="font-bold text-lg">Schedule &amp; Timeline</h2>
                    <p className="text-xs text-gray-500">
                        {relevantTasks.length} tasks across {workspaceProjects.length} projects
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Stats strip */}
                    <div className="flex items-center gap-2 text-xs mr-2">
                        <span className="flex items-center gap-1 text-blue-400"><Circle className="w-3 h-3 fill-blue-400" />{active} active</span>
                        <span className="flex items-center gap-1 text-emerald-400"><CheckCircle2 className="w-3 h-3" />{done} done</span>
                        {overdue > 0 && <span className="flex items-center gap-1 text-red-400"><AlertCircle className="w-3 h-3" />{overdue} overdue</span>}
                    </div>
                    {/* Pan controls */}
                    <button
                        onClick={() => setViewOffset(v => v - 7)}
                        className="p-1.5 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewOffset(0)}
                        className="px-3 py-1.5 text-xs bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white flex items-center gap-1.5"
                    >
                        <Calendar className="w-3 h-3" /> Today
                    </button>
                    <button
                        onClick={() => setViewOffset(v => v + 7)}
                        className="p-1.5 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Gantt chart container */}
            <div className="flex-1 bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl overflow-hidden flex flex-col">
                {/* Day header row */}
                <div className="flex border-b border-[var(--color-border)] shrink-0">
                    {/* Task label column header */}
                    <div className="w-56 shrink-0 px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider border-r border-[var(--color-border)]">
                        Task
                    </div>
                    {/* Days */}
                    <div className="flex-1 relative overflow-hidden">
                        <div className="flex h-full">
                            {dayHeaders.map((day, i) => {
                                const today = isToday(day);
                                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                                return (
                                    <div
                                        key={i}
                                        className={`flex-1 text-center py-2.5 text-[10px] font-medium border-r last:border-r-0 ${today ? "text-[var(--color-primary)] font-bold" :
                                                isWeekend ? "text-gray-600" : "text-gray-500"
                                            }`}
                                        style={{ borderColor: "var(--color-border)" }}
                                    >
                                        <div>{format(day, "EEE")[0]}</div>
                                        <div className={`mt-0.5 ${today ? "bg-[var(--color-primary)] text-white rounded-full w-5 h-5 flex items-center justify-center mx-auto text-[9px]" : ""}`}>
                                            {format(day, "d")}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Rows */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {relevantTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
                            <Clock className="w-10 h-10 text-gray-700" />
                            <p className="font-medium">No tasks in the timeline</p>
                            <p className="text-sm text-gray-600">Tasks assigned to you will appear here as timeline bars</p>
                        </div>
                    ) : (
                        relevantTasks.map((task, idx) => {
                            const barStyle = getBarStyle(task);
                            const status = getEffectiveStatus(task);
                            const styles = STATUS_STYLES[status] || STATUS_STYLES["To Do"];
                            const proj = workspaceProjects.find(p => p.id === task.projectId);

                            return (
                                <motion.div
                                    key={task.id}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.03 }}
                                    className="flex border-b last:border-b-0 hover:bg-white/3 transition-colors group"
                                    style={{ borderColor: "var(--color-border)", minHeight: 48 }}
                                >
                                    {/* Task label */}
                                    <div className="w-56 shrink-0 flex flex-col justify-center px-4 py-2 border-r" style={{ borderColor: "var(--color-border)" }}>
                                        <p className="text-sm font-medium leading-tight truncate">{task.title}</p>
                                        <p className="text-[10px] text-gray-600 truncate mt-0.5">{proj?.name || "No project"}</p>
                                        <span className={`mt-1 text-[9px] font-bold uppercase tracking-wider border rounded px-1 py-0.5 w-fit ${styles.badge}`}>
                                            {status}
                                        </span>
                                    </div>

                                    {/* Bar track */}
                                    <div className="flex-1 relative flex items-center px-0">
                                        {/* Weekend shading columns */}
                                        {dayHeaders.map((day, i) => {
                                            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                                            const today = isToday(day);
                                            return (
                                                <div
                                                    key={i}
                                                    className={`absolute top-0 bottom-0 ${isWeekend ? "bg-white/2" : ""} ${today ? "bg-[var(--color-primary)]/4" : ""}`}
                                                    style={{
                                                        left: `${(i / VISIBLE_DAYS) * 100}%`,
                                                        width: `${(1 / VISIBLE_DAYS) * 100}%`,
                                                        borderRight: "1px solid var(--color-border)",
                                                    }}
                                                />
                                            );
                                        })}

                                        {/* Gantt bar */}
                                        {barStyle && (
                                            <motion.div
                                                initial={{ scaleX: 0 }}
                                                animate={{ scaleX: 1 }}
                                                style={{
                                                    position: "absolute",
                                                    left: barStyle.left,
                                                    width: barStyle.width,
                                                    originX: 0,
                                                }}
                                                transition={{ duration: 0.4, delay: idx * 0.04 }}
                                                className={`h-6 rounded-md ${styles.bar} opacity-80 group-hover:opacity-100 transition-opacity flex items-center px-2 shadow-sm`}
                                                title={`${task.title} · ${format(parseISO(task.startDate), "MMM d")} → ${format(parseISO(task.endDate), "MMM d")}`}
                                            >
                                                <span className="text-[9px] font-semibold text-white truncate leading-none">
                                                    {task.title}
                                                </span>
                                            </motion.div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 px-4 py-2.5 border-t shrink-0" style={{ borderColor: "var(--color-border)" }}>
                    <span className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold">Legend:</span>
                    {Object.entries(STATUS_STYLES).map(([status, s]) => (
                        <div key={status} className="flex items-center gap-1.5">
                            <div className={`w-3 h-3 rounded ${s.bar}`} />
                            <span className="text-[10px] text-gray-500">{status}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
