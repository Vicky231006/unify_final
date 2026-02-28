"use client";
import React, { useState } from 'react';
import { useAppStore, Project, Task } from '@/store';
import { Plus, GitCommit, Calendar, User, AlignLeft, X, MoreVertical, Edit, Trash, FolderOpen, ArrowLeft } from 'lucide-react';
import { format, differenceInDays, parseISO, isAfter, isBefore } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export function ProjectTaskManagement() {
    const {
        projects, tasks, employees, activeWorkspaceId,
        addProject, updateProject, deleteProject,
        addTask, updateTask, deleteTask
    } = useAppStore();

    const [isProjectModalOpen, setProjectModalOpen] = useState(false);
    const [isTaskModalOpen, setTaskModalOpen] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

    // Form states
    const [newProject, setNewProject] = useState({ id: '', name: '', description: '', startDate: '', endDate: '' });
    const [newTask, setNewTask] = useState({
        id: '', projectId: '', title: '', type: 'Feature', assigneeId: '',
        status: 'To Do', weight: 5, startDate: '', endDate: '', dependencies: [] as string[]
    });

    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, type: 'project' | 'task' } | null>(null);

    const activeProjects = projects.filter(p => p.workspaceId === activeWorkspaceId);

    // Sort tasks logically or just use state
    const currentTasks = tasks.filter(t => activeProjects.some(p => p.id === t.projectId));

    const handleCreateProject = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeWorkspaceId) return;

        if (newProject.id) {
            updateProject(newProject.id, {
                name: newProject.name,
                description: newProject.description,
                startDate: newProject.startDate,
                endDate: newProject.endDate
            });
        } else {
            addProject({
                workspaceId: activeWorkspaceId,
                name: newProject.name,
                description: newProject.description,
                status: 'Not Started',
                startDate: newProject.startDate || new Date().toISOString(),
                endDate: newProject.endDate || new Date(Date.now() + 86400000 * 7).toISOString(),
            });
        }
        setProjectModalOpen(false);
        setNewProject({ id: '', name: '', description: '', startDate: '', endDate: '' });
    };

    const handleCreateTask = (e: React.FormEvent) => {
        e.preventDefault();

        if (newTask.id) {
            updateTask(newTask.id, {
                projectId: newTask.projectId,
                title: newTask.title,
                type: newTask.type,
                assigneeId: newTask.assigneeId || null,
                status: newTask.status as any,
                weight: Number(newTask.weight),
                startDate: newTask.startDate,
                endDate: newTask.endDate,
                dependencies: newTask.dependencies
            });
        } else {
            addTask({
                projectId: newTask.projectId,
                title: newTask.title,
                type: newTask.type,
                assigneeId: newTask.assigneeId || null,
                status: newTask.status as any,
                weight: Number(newTask.weight),
                startDate: newTask.startDate || new Date().toISOString(),
                endDate: newTask.endDate || new Date(Date.now() + 86400000 * 3).toISOString(),
                completedDate: null,
                qualityIndicator: 100,
                dependencies: newTask.dependencies
            });
        }
        setTaskModalOpen(false);
        setNewTask({ id: '', projectId: '', title: '', type: 'Feature', assigneeId: '', status: 'To Do', weight: 5, startDate: '', endDate: '', dependencies: [] });
    };

    const handleDelete = () => {
        if (!deleteConfirm) return;
        if (deleteConfirm.type === 'project') {
            deleteProject(deleteConfirm.id);
            if (selectedProjectId === deleteConfirm.id) setSelectedProjectId(null);
        }
        if (deleteConfirm.type === 'task') deleteTask(deleteConfirm.id);
        setDeleteConfirm(null);
    };

    const renderProjectsGrid = () => {
        if (activeProjects.length === 0) {
            return (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500 py-16 border border-dashed border-white/10 rounded-xl mt-6">
                    <FolderOpen className="w-12 h-12 mb-4 text-gray-600" />
                    <p className="text-lg font-medium">No projects yet</p>
                    <p className="text-sm">Create your first project to start tracking work.</p>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-6 overflow-y-auto custom-scrollbar flex-1 pr-2 pb-2">
                {activeProjects.map(p => {
                    const projectTasks = currentTasks.filter(t => t.projectId === p.id);
                    const completedTasks = projectTasks.filter(t => t.status === 'Done').length;
                    const progress = projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0;

                    return (
                        <div key={p.id} onClick={() => setSelectedProjectId(p.id)} className="bg-white/5 border border-white/10 p-5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer group flex flex-col min-h-[160px] relative">
                            <div className="flex justify-between items-start mb-2 gap-4">
                                <h3 className="font-bold text-lg leading-tight group-hover:text-[var(--color-primary)] transition-colors">{p.name}</h3>
                                <div className="flex items-center gap-2">
                                    <span className={`shrink-0 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${p.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400' : p.status === 'In Progress' ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]' : 'bg-gray-500/20 text-gray-400'}`}>
                                        {p.status}
                                    </span>
                                </div>
                            </div>
                            <p className="text-sm text-gray-400 mb-6 flex-1 line-clamp-2">{p.description || 'No description provided.'}</p>

                            <div className="flex flex-col gap-2 mt-auto">
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>{format(parseISO(p.startDate), 'MMM dd')} - {format(parseISO(p.endDate), 'MMM dd')}</span>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={(e) => {
                                            e.stopPropagation();
                                            setNewProject({ id: p.id, name: p.name, description: p.description, startDate: p.startDate.substring(0, 10), endDate: p.endDate.substring(0, 10) });
                                            setProjectModalOpen(true);
                                        }} className="p-1.5 bg-white/5 hover:bg-white/20 rounded-md text-gray-300 hover:text-white transition-colors" title="Edit">
                                            <Edit className="w-3 h-3" />
                                        </button>
                                        <button onClick={(e) => {
                                            e.stopPropagation();
                                            setDeleteConfirm({ id: p.id, type: 'project' });
                                        }} className="p-1.5 bg-red-500/10 hover:bg-red-500/30 rounded-md text-red-400 hover:text-red-300 transition-colors" title="Delete">
                                            <Trash className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-1 text-xs flex justify-between items-center text-gray-400">
                                    <span className="font-medium text-gray-300">Progress</span>
                                    <span>{progress}% ({completedTasks}/{projectTasks.length})</span>
                                </div>
                                <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-[var(--color-primary)] h-full transition-all duration-500" style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    // Calculate dates for Gantt
    const getMinMaxDates = () => {
        let min = new Date();
        let max = new Date(Date.now() + 86400000 * 30); // default span 1 month
        const allTasks = selectedProjectId ? currentTasks.filter(t => t.projectId === selectedProjectId) : currentTasks;

        if (allTasks.length > 0) {
            min = new Date(Math.min(...allTasks.map(t => parseISO(t.startDate).getTime())));
            max = new Date(Math.max(...allTasks.map(t => parseISO(t.endDate).getTime())));
        }
        return { min, max, totalDays: Math.max(differenceInDays(max, min), 1) };
    };

    const { min, totalDays } = getMinMaxDates();

    const renderGantt = () => {
        const displayTasks = selectedProjectId ? currentTasks.filter(t => t.projectId === selectedProjectId) : currentTasks;

        return (
            <div className="mt-6 flex-1 overflow-x-auto overflow-y-auto border border-white/10 rounded-xl bg-white/5 p-4 custom-scrollbar relative flex flex-col min-h-[300px]">
                {displayTasks.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                        <p className="text-lg">No tasks in this project.</p>
                        <p className="text-sm">Click "New Task" above to get started.</p>
                    </div>
                ) : (
                    <div className="min-w-[800px]">
                        {/* Time Header */}
                        <div className="flex text-xs text-gray-500 mb-4 border-b border-[var(--color-border)] pb-2 relative h-6">
                            <div className="w-1/4 shrink-0 font-medium">Task / Dependency</div>
                            <div className="flex-1 relative">
                                <span className="absolute left-0">{format(min, 'MMM dd')}</span>
                                <span className="absolute right-0">{format(new Date(min.getTime() + totalDays * 86400000), 'MMM dd')}</span>
                            </div>
                        </div>

                        {displayTasks.map((t) => {
                            const startOffsetDays = differenceInDays(parseISO(t.startDate), min);
                            const durationDays = differenceInDays(parseISO(t.endDate), parseISO(t.startDate)) || 1;

                            const leftPct = Math.max(0, (startOffsetDays / totalDays) * 100);
                            const widthPct = Math.min(100 - leftPct, (durationDays / totalDays) * 100);

                            const hasDeps = t.dependencies.length > 0;
                            const assignee = employees.find(e => e.id === t.assigneeId)?.name || 'Unassigned';

                            return (
                                <div key={t.id} className="flex items-center mb-3 group hover:bg-white/10 p-1.5 rounded-lg transition-colors relative">
                                    <div className="w-1/4 shrink-0 truncate pr-4 text-sm flex flex-col">
                                        <span className="font-medium flex items-center gap-2">
                                            {hasDeps && <GitCommit className="w-3 h-3 text-orange-400" />}
                                            {t.title}
                                        </span>
                                        <span className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                            <User className="w-3 h-3" /> {assignee}
                                        </span>
                                    </div>
                                    <div className="flex-1 relative h-8 bg-black/30 rounded-md py-1">
                                        <div
                                            className={`absolute h-6 rounded-md shadow-lg flex items-center px-2 text-[10px] truncate text-white border border-white/5 ${t.status === 'Done' ? 'bg-emerald-500' : t.status === 'In Progress' ? 'bg-[var(--color-primary)]' : 'bg-gray-700'}`}
                                            style={{ left: `${leftPct}%`, width: `${Math.max(widthPct, 2)}%` }}
                                            title={`${t.title} (${t.status})`}
                                        >
                                            {widthPct > 5 && t.title}
                                        </div>
                                    </div>
                                    {/* Actions dot menu */}
                                    <div className="absolute right-2 opacity-0 group-hover:opacity-100 flex gap-2 items-center bg-[#1a1a1a] border border-white/10 px-2 rounded-md py-1 shadow-md">
                                        <select
                                            className="text-xs bg-transparent outline-none text-white cursor-pointer"
                                            value={t.status}
                                            onChange={(e) => {
                                                const status = e.target.value as any;
                                                updateTask(t.id, {
                                                    status,
                                                    completedDate: status === 'Done' ? new Date().toISOString() : null
                                                });
                                            }}
                                        >
                                            <option className="bg-black" value="To Do">To Do</option>
                                            <option className="bg-black" value="In Progress">In Prog</option>
                                            <option className="bg-black" value="Review">Review</option>
                                            <option className="bg-black" value="Done">Done</option>
                                        </select>
                                        <div className="w-px h-4 bg-white/20 mx-1"></div>
                                        <button onClick={() => {
                                            setNewTask({
                                                id: t.id,
                                                projectId: t.projectId,
                                                title: t.title,
                                                type: t.type,
                                                assigneeId: t.assigneeId || '',
                                                status: t.status,
                                                weight: t.weight,
                                                startDate: t.startDate.substring(0, 10),
                                                endDate: t.endDate.substring(0, 10),
                                                dependencies: t.dependencies
                                            });
                                            setTaskModalOpen(true);
                                        }} className="text-gray-400 hover:text-white transition-colors p-1"><Edit className="w-3 h-3" /></button>
                                        <button onClick={() => setDeleteConfirm({ id: t.id, type: 'task' })} className="text-red-400/80 hover:text-red-400 transition-colors p-1"><Trash className="w-3 h-3" /></button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        )
    };

    const activeProject = activeProjects.find(p => p.id === selectedProjectId);

    return (
        <div className="flex flex-col h-full relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-0 gap-4">
                <div className="flex flex-wrap items-center gap-4">
                    {selectedProjectId ? (
                        <>
                            <button onClick={() => setSelectedProjectId(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 transition-colors border border-white/10 shadow-sm">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-3">
                                    {activeProject?.name}
                                    <span className="text-xs bg-[var(--color-primary)]/20 text-[var(--color-primary)] px-2 py-0.5 rounded-full uppercase tracking-wider">{activeProject?.status}</span>
                                </h2>
                                <p className="text-sm text-gray-400 mt-1 line-clamp-1 max-w-lg">{activeProject?.description}</p>
                            </div>
                        </>
                    ) : (
                        <div>
                            <h2 className="text-xl font-bold">Projects</h2>
                            <p className="text-sm text-gray-400 mt-1">Manage workspaces projects and their task breakdowns</p>
                        </div>
                    )}
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                    {!selectedProjectId && (
                        <button onClick={() => { setNewProject({ id: '', name: '', description: '', startDate: '', endDate: '' }); setProjectModalOpen(true); }} className="flex items-center gap-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/80 text-white px-4 py-2 rounded-lg text-sm transition-colors shadow-sm">
                            <Plus className="w-4 h-4" /> New Project
                        </button>
                    )}
                    {selectedProjectId && (
                        <button onClick={() => { setNewTask({ id: '', projectId: selectedProjectId, title: '', type: 'Feature', assigneeId: '', status: 'To Do', weight: 5, startDate: '', endDate: '', dependencies: [] }); setTaskModalOpen(true); }} className="flex items-center gap-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/80 text-white px-4 py-2 rounded-lg text-sm transition-colors shadow-sm">
                            <Plus className="w-4 h-4" /> New Task
                        </button>
                    )}
                </div>
            </div>

            {selectedProjectId ? renderGantt() : renderProjectsGrid()}

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#111] border border-white/10 rounded-2xl max-w-sm p-6 w-full text-center shadow-2xl">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold mb-2">Confirm {deleteConfirm.type === 'project' ? 'Project' : 'Task'} Deletion</h3>
                            <p className="text-gray-400 text-sm mb-6 leading-relaxed">Are you sure you want to delete this {deleteConfirm.type}? This action is permanent and cannot be reversed.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-colors font-medium">Cancel</button>
                                <button onClick={handleDelete} className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition-colors text-white font-medium shadow-lg shadow-red-500/20">Delete Forever</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modals */}
            <AnimatePresence>
                {isProjectModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
                            <button onClick={() => setProjectModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-md transition-colors"><X className="w-4 h-4" /></button>
                            <h3 className="text-xl font-bold mb-6">{newProject.id ? 'Edit Project' : 'Create New Project'}</h3>
                            <form onSubmit={handleCreateProject} className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-300 mb-1.5 block">Project Name *</label>
                                    <input type="text" required value={newProject.name} onChange={e => setNewProject({ ...newProject, name: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:border-[var(--color-primary)] outline-none transition-colors" placeholder="e.g. Q4 Migration" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-300 mb-1.5 block">Description</label>
                                    <textarea rows={3} value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:border-[var(--color-primary)] outline-none transition-colors resize-none" placeholder="What is this project about?" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-300 mb-1.5 block">Start Date *</label>
                                        <input type="date" required value={newProject.startDate} onChange={e => setNewProject({ ...newProject, startDate: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:border-[var(--color-primary)] outline-none transition-colors color-scheme-dark" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-300 mb-1.5 block">End Date *</label>
                                        <input type="date" required value={newProject.endDate} onChange={e => setNewProject({ ...newProject, endDate: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:border-[var(--color-primary)] outline-none transition-colors color-scheme-dark" />
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <button type="submit" className="w-full bg-gradient-to-r from-[var(--color-primary)] to-purple-600 hover:opacity-90 text-white py-2.5 rounded-lg font-bold transition-all shadow-lg shadow-[var(--color-primary)]/20">
                                        {newProject.id ? 'Save Changes' : 'Create Project'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isTaskModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-xl p-6 relative shadow-2xl">
                            <button onClick={() => setTaskModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-md transition-colors"><X className="w-4 h-4" /></button>
                            <h3 className="text-xl font-bold mb-6">{newTask.id ? 'Edit Task' : 'Create New Task'}</h3>
                            <form onSubmit={handleCreateTask} className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-300 mb-1.5 block">Task Title *</label>
                                    <input type="text" required value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:border-[var(--color-primary)] outline-none transition-colors" placeholder="e.g. Implement Navigation" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-300 mb-1.5 block">Assignee</label>
                                        <select value={newTask.assigneeId} onChange={e => setNewTask({ ...newTask, assigneeId: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:border-[var(--color-primary)] outline-none transition-colors cursor-pointer">
                                            <option value="">Unassigned</option>
                                            {employees.filter(e => e.workspaceId === activeWorkspaceId).map(e => (
                                                <option key={e.id} value={e.id}>{e.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-300 mb-1.5 block">Task Type</label>
                                        <select value={newTask.type} onChange={e => setNewTask({ ...newTask, type: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:border-[var(--color-primary)] outline-none transition-colors cursor-pointer">
                                            <option value="Feature">Feature</option>
                                            <option value="Bug">Bug</option>
                                            <option value="Documentation">Documentation</option>
                                            <option value="Design">Design</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-300 mb-1.5 block">Start Date *</label>
                                        <input type="date" required value={newTask.startDate} onChange={e => setNewTask({ ...newTask, startDate: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:border-[var(--color-primary)] outline-none transition-colors color-scheme-dark" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-300 mb-1.5 block">Deadline (End Date) *</label>
                                        <input type="date" required value={newTask.endDate} onChange={e => setNewTask({ ...newTask, endDate: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:border-[var(--color-primary)] outline-none transition-colors color-scheme-dark" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-300 mb-1.5 block">Effort Weight (1-10)</label>
                                        <input type="number" min="1" max="10" value={newTask.weight} onChange={e => setNewTask({ ...newTask, weight: parseInt(e.target.value) })} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:border-[var(--color-primary)] outline-none transition-colors" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-300 mb-1.5 block">Dependencies</label>
                                        <div className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm max-h-24 overflow-y-auto custom-scrollbar">
                                            {newTask.projectId ? currentTasks.filter(t => t.projectId === newTask.projectId && t.id !== newTask.id).map(t => (
                                                <label key={t.id} className="flex items-center gap-2 mb-1 cursor-pointer">
                                                    <input type="checkbox" checked={newTask.dependencies.includes(t.id)}
                                                        className="rounded bg-white/10 border-white/20 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                                                        onChange={(e) => {
                                                            const deps = e.target.checked
                                                                ? [...newTask.dependencies, t.id]
                                                                : newTask.dependencies.filter(id => id !== t.id);
                                                            setNewTask({ ...newTask, dependencies: deps });
                                                        }}
                                                    />
                                                    <span className="truncate">{t.title}</span>
                                                </label>
                                            )) : <span className="text-gray-500">Auto-filled based on project</span>}
                                            {newTask.projectId && currentTasks.filter(t => t.projectId === newTask.projectId && t.id !== newTask.id).length === 0 && <span className="text-gray-500">No other tasks to depend on.</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <button type="submit" className="w-full bg-gradient-to-r from-[var(--color-primary)] to-purple-600 hover:opacity-90 text-white py-2.5 rounded-lg font-bold transition-all shadow-lg shadow-[var(--color-primary)]/20">
                                        {newTask.id ? 'Save Changes' : 'Create Task'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
