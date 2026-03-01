"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import {
    CheckCircle2, Clock, AlertCircle, ChevronRight, Upload,
    X, FileText, Calendar, User, Tag, Layers,
    Paperclip, Send, MoreHorizontal, Eye, ArrowLeft
} from "lucide-react";
import { formatDistanceToNow, parseISO, isPast } from "date-fns";

// Deterministic color from string
function colorFromString(str: string) {
    const palette = [
        { bg: "from-blue-600 to-indigo-600", text: "text-white" },
        { bg: "from-purple-600 to-pink-600", text: "text-white" },
        { bg: "from-emerald-600 to-teal-600", text: "text-white" },
        { bg: "from-orange-500 to-red-500", text: "text-white" },
        { bg: "from-cyan-500 to-blue-500", text: "text-white" },
        { bg: "from-rose-500 to-pink-500", text: "text-white" },
        { bg: "from-yellow-500 to-orange-500", text: "text-white" },
        { bg: "from-violet-600 to-purple-600", text: "text-white" },
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return palette[Math.abs(hash) % palette.length];
}

function initials(name: string) {
    return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

type Submission = { fileName: string; uploadedAt: string; file?: File };

// ────────────────────────────────────────────────────────────────────────────────
// Task Detail Panel (opens when a task card is clicked)
// ────────────────────────────────────────────────────────────────────────────────
function TaskDetailPanel({
    task,
    project,
    assignedByName,
    onClose,
}: {
    task: any;
    project: any;
    assignedByName: string;
    onClose: () => void;
}) {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [note, setNote] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const { updateTask } = useAppStore();

    const isOverdue = isPast(new Date(task.endDate)) && task.status !== "Done";
    const isDone = task.status === "Done";

    const handleFiles = (files: FileList | null) => {
        if (!files) return;
        const newSubs: Submission[] = Array.from(files).map(f => ({
            fileName: f.name,
            uploadedAt: new Date().toISOString(),
            file: f,
        }));
        setSubmissions(prev => [...prev, ...newSubs]);
    };

    const handleSubmit = () => {
        if (submissions.length === 0 && !note.trim()) return;
        updateTask(task.id, { status: "Review" });
        setSubmitted(true);
    };

    const markDone = () => {
        updateTask(task.id, { status: "Done", completedDate: new Date().toISOString() });
    };

    const statusColor = isDone ? "text-emerald-400 bg-emerald-400/10 border-emerald-500/30"
        : isOverdue ? "text-red-400 bg-red-400/10 border-red-500/30"
            : task.status === "Review" ? "text-yellow-400 bg-yellow-400/10 border-yellow-500/30"
                : task.status === "In Progress" ? "text-blue-400 bg-blue-400/10 border-blue-500/30"
                    : "text-gray-400 bg-white/5 border-white/10";

    const col = colorFromString(project?.name || task.title);

    return (
        <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            className="fixed inset-0 z-50 flex"
        >
            {/* Scrim */}
            <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Panel */}
            <div className="w-full max-w-xl bg-[var(--color-card)] border-l border-[var(--color-border)] h-full overflow-y-auto flex flex-col custom-scrollbar">
                {/* Header */}
                <div className={`bg-gradient-to-r ${col.bg} p-6`}>
                    <div className="flex items-start justify-between mb-4">
                        <button onClick={onClose} className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur transition-colors">
                            <X className="w-4 h-4 text-white" />
                        </button>
                        <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${statusColor}`}>
                            {isOverdue && !isDone ? "OVERDUE" : task.status}
                        </span>
                    </div>
                    <h2 className="text-xl font-bold text-white leading-snug mb-1">{task.title}</h2>
                    <p className="text-white/60 text-sm">{project?.name || "Unlinked Project"}</p>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-3 p-5 border-b border-[var(--color-border)]">
                    {[
                        { icon: User, label: "Assigned By", value: assignedByName },
                        { icon: Tag, label: "Type", value: task.type || "Task" },
                        { icon: Calendar, label: "Deadline", value: new Date(task.endDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) },
                        { icon: Layers, label: "Weight / Priority", value: `${task.weight} pts` },
                    ].map(({ icon: Icon, label, value }) => (
                        <div key={label} className="bg-white/4 rounded-xl p-3 border border-white/5">
                            <div className="flex items-center gap-1.5 text-gray-500 text-[10px] uppercase tracking-wider mb-1">
                                <Icon className="w-3 h-3" /> {label}
                            </div>
                            <p className="text-sm font-semibold text-white">{value}</p>
                        </div>
                    ))}
                </div>

                {/* Task requirements */}
                <div className="p-5 border-b border-[var(--color-border)]">
                    <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[var(--color-primary)]" /> Task Requirements
                    </h3>
                    <div className="bg-black/20 rounded-xl p-4 border border-white/5 space-y-2 text-sm text-gray-300 leading-relaxed">
                        <p>• Complete assigned deliverables by the deadline above.</p>
                        <p>• Ensure at least one file submission or a written status note.</p>
                        <p>• Task weight <strong className="text-white">{task.weight} pts</strong> will be awarded on manager approval.</p>
                        <p>• Status auto-updates to <span className="text-yellow-400 font-medium">Review</span> upon submission.</p>
                    </div>
                </div>

                {/* Deadline banner */}
                <div className={`mx-5 mt-4 rounded-xl p-3 flex items-center gap-3 border ${isOverdue ? "bg-red-500/10 border-red-500/20" :
                    isDone ? "bg-emerald-500/10 border-emerald-500/20" :
                        "bg-blue-500/10 border-blue-500/20"
                    }`}>
                    {isOverdue ? <AlertCircle className="w-4 h-4 text-red-400 shrink-0" /> :
                        isDone ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> :
                            <Clock className="w-4 h-4 text-blue-400 shrink-0" />}
                    <p className="text-xs">
                        {isDone ? "Task completed and graded." :
                            isOverdue ? `This task was due ${formatDistanceToNow(new Date(task.endDate), { addSuffix: true })}` :
                                `Due ${formatDistanceToNow(new Date(task.endDate), { addSuffix: true })}`}
                    </p>
                </div>

                {/* Submission Section */}
                {!isDone && (
                    <div className="p-5 flex-1">
                        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                            <Upload className="w-4 h-4 text-[var(--color-primary)]" /> Upload Submission
                        </h3>

                        {/* Drop zone */}
                        <div
                            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={e => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
                            onClick={() => fileRef.current?.click()}
                            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all mb-4 ${isDragging ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10" :
                                "border-white/10 hover:border-white/20 hover:bg-white/5"
                                }`}
                        >
                            <input ref={fileRef} type="file" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
                            <Paperclip className="w-6 h-6 text-gray-500 mx-auto mb-2" />
                            <p className="text-sm text-gray-400">Drop files here or <span className="text-[var(--color-primary)]">browse</span></p>
                            <p className="text-xs text-gray-600 mt-1">PDF, DOCX, ZIP, Images — any format</p>
                        </div>

                        {/* Attached files */}
                        {submissions.length > 0 && (
                            <div className="space-y-2 mb-4">
                                {submissions.map((s, i) => (
                                    <div key={i} className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2 border border-white/10">
                                        <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                                        <span className="text-sm text-gray-200 flex-1 truncate">{s.fileName}</span>
                                        <button onClick={() => setSubmissions(prev => prev.filter((_, idx) => idx !== i))}
                                            className="p-1 text-gray-500 hover:text-red-400 transition-colors">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Note */}
                        <textarea
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="Add a submission note (optional)..."
                            rows={3}
                            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[var(--color-primary)] transition-colors resize-none mb-4"
                        />

                        {/* Actions */}
                        <div className="flex gap-3">
                            {submitted ? (
                                <div className="flex-1 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center gap-2 text-emerald-400 text-sm font-medium">
                                    <CheckCircle2 className="w-4 h-4" /> Submitted — awaiting review
                                </div>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    disabled={submissions.length === 0 && !note.trim()}
                                    className="flex-1 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/80 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                                >
                                    <Send className="w-4 h-4" /> Submit for Review
                                </button>
                            )}
                            <button
                                onClick={markDone}
                                className="px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
                            >
                                <CheckCircle2 className="w-4 h-4" /> Mark Done
                            </button>
                        </div>
                    </div>
                )}

                {isDone && (
                    <div className="p-5">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center">
                            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                            <p className="font-bold text-emerald-400 mb-1">Task Completed!</p>
                            <p className="text-gray-500 text-sm">+{task.weight * 10} XP awarded</p>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// ────────────────────────────────────────────────────────────────────────────────
// Task Card (Teams-style)
// ────────────────────────────────────────────────────────────────────────────────
function TaskCard({ task, project, assignedByName, onClick }: {
    task: any; project: any; assignedByName: string; onClick: () => void;
}) {
    const col = colorFromString(project?.name || task.title);
    const isOverdue = isPast(new Date(task.endDate)) && task.status !== "Done";
    const isDone = task.status === "Done";

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2, scale: 1.01 }}
            onClick={onClick}
            className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl overflow-hidden cursor-pointer group hover:border-[var(--color-primary)]/40 hover:shadow-lg hover:shadow-black/40 transition-all"
        >
            {/* Color Banner */}
            <div className={`h-2 bg-gradient-to-r ${col.bg}`} />

            <div className="p-4">
                {/* Avatar + Project */}
                <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${col.bg} flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg`}>
                        {initials(project?.name || task.title)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 truncate">{project?.name || "No Project"}</p>
                        <p className="text-sm font-semibold text-white truncate group-hover:text-[var(--color-primary)] transition-colors">{task.title}</p>
                    </div>
                    <button onClick={e => e.stopPropagation()} className="p-1 text-gray-600 hover:text-white transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                </div>

                {/* Type badge + status */}
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded uppercase tracking-wider text-gray-400 font-medium">
                        {task.type || "Task"}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-bold border ${isDone ? "text-emerald-400 bg-emerald-400/10 border-emerald-500/20" :
                        isOverdue ? "text-red-400 bg-red-400/10 border-red-500/20" :
                            task.status === "Review" ? "text-yellow-400 bg-yellow-400/10 border-yellow-500/20" :
                                task.status === "In Progress" ? "text-blue-400 bg-blue-400/10 border-blue-500/20" :
                                    "text-gray-500 bg-white/5 border-white/10"
                        }`}>
                        {isOverdue && !isDone ? "Overdue" : task.status}
                    </span>
                </div>

                {/* Meta row */}
                <div className="flex items-center justify-between text-[11px] text-gray-500 border-t border-white/5 pt-3 gap-2">
                    <div className="flex items-center gap-1 min-w-0">
                        <User className="w-3 h-3 shrink-0" />
                        <span className="truncate">{assignedByName}</span>
                    </div>
                    <div className={`flex items-center gap-1 shrink-0 ${isOverdue && !isDone ? "text-red-400" : ""}`}>
                        <Calendar className="w-3 h-3" />
                        {new Date(task.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                </div>

                {/* Action icons row (Teams-style) */}
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                    <div className="flex items-center gap-3 text-gray-600">
                        <button onClick={e => { e.stopPropagation(); onClick(); }} className="hover:text-[var(--color-primary)] transition-colors flex items-center gap-1 text-[11px]">
                            <Eye className="w-3.5 h-3.5" /> View
                        </button>
                        <button onClick={e => { e.stopPropagation(); onClick(); }} className="hover:text-blue-400 transition-colors flex items-center gap-1 text-[11px]">
                            <Upload className="w-3.5 h-3.5" /> Submit
                        </button>
                        <button onClick={e => { e.stopPropagation(); onClick(); }} className="hover:text-purple-400 transition-colors flex items-center gap-1 text-[11px]">
                            <FileText className="w-3.5 h-3.5" /> Details
                        </button>
                    </div>
                    <span className="text-[10px] font-bold text-[var(--color-primary)]">+{task.weight * 10} XP</span>
                </div>
            </div>
        </motion.div>
    );
}

// ────────────────────────────────────────────────────────────────────────────────
// Main Employee View
// ────────────────────────────────────────────────────────────────────────────────
export function EmployeeView() {
    const { employees, tasks, projects, activeWorkspaceId, workspaces, fetchSupabaseTasks } = useAppStore();
    const targetWorkspaceId = activeWorkspaceId || workspaces[0]?.id || null;
    const [selectedTask, setSelectedTask] = useState<any | null>(null);
    const [filter, setFilter] = useState<"All" | "In Progress" | "Review" | "Done" | "Overdue">("All");

    useEffect(() => {
        if (targetWorkspaceId) {
            fetchSupabaseTasks(targetWorkspaceId);
        }
    }, [targetWorkspaceId, fetchSupabaseTasks]);

    // Active "user" = first employee in workspace
    const currentUser = employees.find(e => e.workspaceId === targetWorkspaceId);
    const workspaceTasks = tasks.filter(t => {
        const proj = projects.find(p => p.id === t.projectId);
        return proj?.workspaceId === targetWorkspaceId;
    });

    const userTasks = currentUser
        ? workspaceTasks.filter(t => t.assigneeId === currentUser.id)
        : workspaceTasks;

    const now = new Date();
    const getGroup = (t: any) => {
        if (t.status === "Done") return "Done";
        if (isPast(new Date(t.endDate))) return "Overdue";
        if (t.status === "Review") return "Review";
        if (t.status === "In Progress") return "In Progress";
        return "To Do";
    };

    const filteredTasks = filter === "All" ? userTasks :
        filter === "Overdue" ? userTasks.filter(t => getGroup(t) === "Overdue") :
            userTasks.filter(t => t.status === filter);

    const stats = {
        total: userTasks.length,
        inProgress: userTasks.filter(t => t.status === "In Progress").length,
        review: userTasks.filter(t => t.status === "Review").length,
        done: userTasks.filter(t => t.status === "Done").length,
        overdue: userTasks.filter(t => getGroup(t) === "Overdue").length,
    };

    // Get assigner name (project manager / first employee found, or "Manager")
    const getAssignedBy = (task: any) => {
        const proj = projects.find(p => p.id === task.projectId);
        if (!proj) return "Manager";
        const dept = employees.find(e => e.workspaceId === targetWorkspaceId && e.role?.toLowerCase().includes("manager"));
        return dept?.name || "Project Manager";
    };

    const FILTERS: typeof filter[] = ["All", "In Progress", "Review", "Done", "Overdue"];

    const selectedProject = selectedTask ? projects.find(p => p.id === selectedTask.projectId) : null;

    return (
        <>
            <div className="flex flex-col gap-5 h-[calc(100vh-160px)] overflow-y-auto custom-scrollbar pr-1 pb-4">

                {/* ── Stats row ── */}
                <div className="grid grid-cols-5 gap-3">
                    {[
                        { label: "Total", value: stats.total, color: "text-gray-300" },
                        { label: "In Progress", value: stats.inProgress, color: "text-blue-400" },
                        { label: "In Review", value: stats.review, color: "text-yellow-400" },
                        { label: "Completed", value: stats.done, color: "text-emerald-400" },
                        { label: "Overdue", value: stats.overdue, color: "text-red-400" },
                    ].map(s => (
                        <div key={s.label} className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-3 text-center">
                            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* ── Filter tabs + header ── */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="font-bold text-lg">
                            {currentUser ? `${currentUser.name}'s Assignments` : "My Assignments"}
                        </h2>
                        <p className="text-xs text-gray-500">{filteredTasks.length} tasks · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-1">
                        {FILTERS.map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${filter === f
                                    ? "bg-[var(--color-primary)] text-white shadow-sm"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                                    }`}
                            >
                                {f}
                                {f === "Overdue" && stats.overdue > 0 && (
                                    <span className="ml-1 bg-red-500 text-white text-[9px] px-1.5 rounded-full font-bold">{stats.overdue}</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Teams-style card grid ── */}
                {filteredTasks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredTasks.map(task => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                project={projects.find(p => p.id === task.projectId)}
                                assignedByName={getAssignedBy(task)}
                                onClick={() => setSelectedTask(task)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center flex-1 gap-4 py-20 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-2">
                            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                        </div>
                        <p className="font-semibold text-gray-300">
                            {filter === "All" ? "No tasks assigned yet" : `No ${filter.toLowerCase()} tasks`}
                        </p>
                        <p className="text-sm text-gray-600 max-w-xs">
                            {filter === "All"
                                ? "Your manager will assign tasks to you. Check back soon."
                                : `You don't have any tasks with status "${filter}" right now.`}
                        </p>
                    </div>
                )}
            </div>

            {/* ── Task Detail Panel ── */}
            <AnimatePresence>
                {selectedTask && (
                    <TaskDetailPanel
                        task={selectedTask}
                        project={selectedProject}
                        assignedByName={getAssignedBy(selectedTask)}
                        onClose={() => setSelectedTask(null)}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
