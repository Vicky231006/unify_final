"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Mail, Phone, MoreVertical, Plus, CheckCircle, Award, Target } from "lucide-react";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";

export default function TeamsPage() {
    const { userRole } = useWorkspace();

    const [managers, setManagers] = useState([
        { id: 'm1', name: 'Sarah Miller', dept: 'Engineering' },
        { id: 'm2', name: 'David Lee', dept: 'Marketing' }
    ]);

    const [employees, setEmployees] = useState([
        { id: 'e1', name: 'James Wilson', role: 'Frontend Developer', managerId: 'm1' },
        { id: 'e2', name: 'Alice Chen', role: 'UX Designer', managerId: 'm1' }
    ]);

    const [tasks, setTasks] = useState([
        { id: 't1', empId: 'e1', title: 'Implement Dashboard UI', kpi: 'Complete by Friday with 0 bugs', status: 'In Progress', rewarded: false },
        { id: 't2', empId: 'e2', title: 'User Research Q3', kpi: 'Interview 10 users', status: 'Completed', rewarded: false }
    ]);

    const [showModal, setShowModal] = useState<'manager' | 'employee' | 'task' | null>(null);
    const [selectedEmpId, setSelectedEmpId] = useState('');

    const [formData, setFormData] = useState({ name: '', dept: '', role: '', title: '', kpi: '' });

    const handleAddManager = () => {
        if (!formData.name) return;
        setManagers([...managers, { id: Date.now().toString(), name: formData.name, dept: formData.dept || 'General' }]);
        setFormData({ name: '', dept: '', role: '', title: '', kpi: '' });
        setShowModal(null);
    };

    const handleAddEmployee = () => {
        if (!formData.name) return;
        setEmployees([...employees, { id: Date.now().toString(), name: formData.name, role: formData.role || 'Staff', managerId: 'm1' }]);
        setFormData({ name: '', dept: '', role: '', title: '', kpi: '' });
        setShowModal(null);
    };

    const handleAddTask = () => {
        if (!formData.title || !selectedEmpId) return;
        setTasks([...tasks, { id: Date.now().toString(), empId: selectedEmpId, title: formData.title, kpi: formData.kpi, status: 'Not Started', rewarded: false }]);
        setFormData({ name: '', dept: '', role: '', title: '', kpi: '' });
        setShowModal(null);
    };

    const toggleTaskStatus = (taskId: string) => {
        setTasks(tasks.map(t => {
            if (t.id === taskId) {
                const nextStatus = t.status === 'Not Started' ? 'In Progress' : t.status === 'In Progress' ? 'Completed' : 'Not Started';
                return { ...t, status: nextStatus };
            }
            return t;
        }));
    };

    const rewardEmployee = (taskId: string) => {
        setTasks(tasks.map(t => t.id === taskId ? { ...t, rewarded: true } : t));
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center bg-[var(--color-card)] p-4 rounded-2xl border border-[var(--color-border)]">
                <div>
                    <h2 className="text-xl font-bold">{userRole === 'CEO' ? 'Executive Oversight' : userRole === 'Manager' ? 'Team Management' : 'My Team'}</h2>
                    <p className="text-sm text-gray-400">Manage structure, assign tasks, and track KPIs.</p>
                </div>
                {userRole === 'CEO' && (
                    <button onClick={() => setShowModal('manager')} className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-opacity-90 flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Add Manager
                    </button>
                )}
                {userRole === 'Manager' && (
                    <button onClick={() => setShowModal('employee')} className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-opacity-90 flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Add Employee
                    </button>
                )}
            </div>

            {/* CEO View */}
            {userRole === 'CEO' && (
                <div className="flex flex-col gap-6">
                    <h3 className="text-xl font-semibold border-b border-[var(--color-border)] pb-2">Direct Reports (Managers)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {managers.map(m => (
                            <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[var(--color-card)] border border-[var(--color-border)] p-6 rounded-2xl">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-lg">
                                        {m.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold">{m.name}</h4>
                                        <p className="text-sm text-gray-400">{m.dept} Director</p>
                                    </div>
                                </div>
                                <div className="bg-white/5 p-3 rounded-xl border border-[var(--color-border)] text-sm space-y-2">
                                    <div className="flex justify-between"><span className="text-gray-400">Team Size:</span> <span className="font-semibold">{employees.length * 3}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-400">KPI Status:</span> <span className="text-emerald-400 font-semibold">92% Met</span></div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Manager View */}
            {userRole === 'Manager' && (
                <div className="flex flex-col gap-8">
                    <section>
                        <h3 className="text-xl font-semibold border-b border-[var(--color-border)] pb-2 mb-6">My Team</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {employees.map(emp => (
                                <div key={emp.id} className="bg-[var(--color-card)] border border-[var(--color-border)] p-6 rounded-2xl flex flex-col gap-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                                                {emp.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-bold">{emp.name}</h4>
                                                <p className="text-sm text-gray-400">{emp.role}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => { setSelectedEmpId(emp.id); setShowModal('task'); }} className="text-xs bg-white/10 hover:bg-white/20 transition-colors px-3 py-1.5 rounded-lg border border-white/10">
                                            Assign Task
                                        </button>
                                    </div>

                                    <div className="bg-black/20 p-4 rounded-xl space-y-3">
                                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Assigned Task KPIs</p>
                                        {tasks.filter(t => t.empId === emp.id).map(t => (
                                            <div key={t.id} className="bg-white/5 border border-white/5 p-3 rounded-lg text-sm relative overflow-hidden group">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="font-semibold truncate pr-4">{t.title}</span>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${t.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400' : t.status === 'In Progress' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                                        {t.status}
                                                    </span>
                                                </div>
                                                <p className="text-gray-400 text-xs flex items-center gap-1"><Target className="w-3 h-3 text-[var(--color-primary)]" /> {t.kpi}</p>

                                                {/* Actions */}
                                                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                                                    <button onClick={() => toggleTaskStatus(t.id)} className="text-xs text-blue-400 hover:underline">Toggle Toggle</button>
                                                    <div className="flex-1" />
                                                    {t.status === 'Completed' && !t.rewarded && (
                                                        <button onClick={() => rewardEmployee(t.id)} className="text-xs bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30 px-2 py-1 rounded transition-colors flex items-center gap-1">
                                                            <Award className="w-3 h-3" /> Reward
                                                        </button>
                                                    )}
                                                    {t.rewarded && <span className="text-xs text-yellow-500 flex items-center gap-1"><Award className="w-3 h-3" /> Rewarded</span>}
                                                </div>
                                            </div>
                                        ))}
                                        {tasks.filter(t => t.empId === emp.id).length === 0 && <p className="text-sm text-gray-500">No active tasks.</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            )}

            {/* Employee View */}
            {userRole === 'Employee' && (
                <div className="flex flex-col gap-6">
                    <h3 className="text-xl font-semibold border-b border-[var(--color-border)] pb-2">My Assigned Tasks</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {tasks.filter(t => t.empId === 'e1').map(t => (
                            <div key={t.id} className="bg-[var(--color-card)] border border-[var(--color-border)] p-6 rounded-2xl flex flex-col gap-4 relative overflow-hidden">
                                {t.rewarded && <div className="absolute top-0 right-0 p-4"><Award className="w-6 h-6 text-yellow-500" /></div>}
                                <h4 className="font-bold text-lg">{t.title}</h4>
                                <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">KPI Target</p>
                                    <p className="text-sm font-medium flex items-center gap-2"><Target className="w-4 h-4 text-[var(--color-primary)]" /> {t.kpi}</p>
                                </div>
                                <div className="flex justify-between items-center mt-auto">
                                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${t.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400' : t.status === 'In Progress' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-300'}`}>
                                        {t.status}
                                    </span>
                                    <button onClick={() => toggleTaskStatus(t.id)} className="bg-[var(--color-primary)] text-white text-sm px-4 py-2 rounded-lg font-medium">Update Progress</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modals */}
            <AnimatePresence>
                {showModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-[var(--color-card)] border border-[var(--color-border)] p-6 rounded-2xl w-full max-w-md shadow-2xl">
                            <h3 className="text-xl font-bold mb-4">
                                {showModal === 'manager' && 'Add New Manager'}
                                {showModal === 'employee' && 'Add New Employee'}
                                {showModal === 'task' && 'Allocate Task & KPI'}
                            </h3>
                            <div className="space-y-4">
                                {(showModal === 'manager' || showModal === 'employee') && (
                                    <>
                                        <div><label className="text-sm text-gray-400 block mb-1">Full Name</label><input autoFocus value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg p-3 text-white focus:outline-none focus:border-[var(--color-primary)]" placeholder="Jane Doe" /></div>
                                        {showModal === 'manager' && <div><label className="text-sm text-gray-400 block mb-1">Department</label><input value={formData.dept} onChange={e => setFormData({ ...formData, dept: e.target.value })} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg p-3 text-white focus:outline-none focus:border-[var(--color-primary)]" placeholder="Sales" /></div>}
                                        {showModal === 'employee' && <div><label className="text-sm text-gray-400 block mb-1">Role Title</label><input value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg p-3 text-white focus:outline-none focus:border-[var(--color-primary)]" placeholder="Frontend Developer" /></div>}
                                    </>
                                )}
                                {showModal === 'task' && (
                                    <>
                                        <div><label className="text-sm text-gray-400 block mb-1">Task Title</label><input autoFocus value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg p-3 text-white focus:outline-none focus:border-[var(--color-primary)]" placeholder="Design Review" /></div>
                                        <div><label className="text-sm text-gray-400 block mb-1">KPI Definition (Measurement of Success)</label><input value={formData.kpi} onChange={e => setFormData({ ...formData, kpi: e.target.value })} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg p-3 text-white focus:outline-none focus:border-[var(--color-primary)]" placeholder="E.g. Finalize 5 mocks by EoD" /></div>
                                    </>
                                )}
                            </div>
                            <div className="flex justify-end gap-3 mt-8">
                                <button onClick={() => setShowModal(null)} className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
                                <button onClick={() => {
                                    if (showModal === 'manager') handleAddManager();
                                    if (showModal === 'employee') handleAddEmployee();
                                    if (showModal === 'task') handleAddTask();
                                }} className="bg-[var(--color-primary)] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors">Confirm</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
