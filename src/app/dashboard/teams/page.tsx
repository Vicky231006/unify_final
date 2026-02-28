"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Mail, Phone, MoreVertical, Plus, Trash, Edit, X } from "lucide-react";
import { useAppStore } from "@/store";

export default function TeamsPage() {
    const {
        departments, addDepartment, updateDepartment, deleteDepartment,
        teams, addTeam, updateTeam, deleteTeam,
        employees, addEmployee, updateEmployee, deleteEmployee,
        activeWorkspaceId
    } = useAppStore();

    // Modals
    const [modals, setModals] = useState({ dept: false, team: false, emp: false });

    // Forms
    const [deptForm, setDeptForm] = useState({ id: '', name: '', managerId: '' });
    const [teamForm, setTeamForm] = useState({ id: '', name: '', departmentId: '' });
    const [empForm, setEmpForm] = useState({ id: '', name: '', role: '', departmentId: '', teamId: '', capacity: 40 });

    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, type: 'dept' | 'team' | 'emp' } | null>(null);

    const activeDepts = departments.filter(d => d.workspaceId === activeWorkspaceId);
    const activeTeams = teams.filter(t => t.workspaceId === activeWorkspaceId);
    const activeEmps = employees.filter(e => e.workspaceId === activeWorkspaceId);

    const handleDeptSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeWorkspaceId) return;
        if (deptForm.id) updateDepartment(deptForm.id, deptForm);
        else addDepartment({ workspaceId: activeWorkspaceId, name: deptForm.name, managerId: deptForm.managerId || null });
        setModals({ ...modals, dept: false });
        setDeptForm({ id: '', name: '', managerId: '' });
    };

    const handleTeamSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeWorkspaceId) return;
        if (teamForm.id) updateTeam(teamForm.id, teamForm);
        else addTeam({ workspaceId: activeWorkspaceId, name: teamForm.name, departmentId: teamForm.departmentId || null });
        setModals({ ...modals, team: false });
        setTeamForm({ id: '', name: '', departmentId: '' });
    };

    const handleEmpSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeWorkspaceId) return;
        if (empForm.id) updateEmployee(empForm.id, empForm);
        else addEmployee({
            workspaceId: activeWorkspaceId,
            name: empForm.name,
            role: empForm.role,
            departmentId: empForm.departmentId || null,
            teamId: empForm.teamId || null,
            isActive: true,
            capacity: empForm.capacity,
            joinedDate: new Date().toISOString()
        });
        setModals({ ...modals, emp: false });
        setEmpForm({ id: '', name: '', role: '', departmentId: '', teamId: '', capacity: 40 });
    };

    const handleDelete = () => {
        if (!deleteConfirm) return;
        if (deleteConfirm.type === 'dept') deleteDepartment(deleteConfirm.id);
        if (deleteConfirm.type === 'team') deleteTeam(deleteConfirm.id);
        if (deleteConfirm.type === 'emp') deleteEmployee(deleteConfirm.id);
        setDeleteConfirm(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[var(--color-card)] p-4 rounded-2xl border border-[var(--color-border)] gap-4">
                <div>
                    <h2 className="text-xl font-bold">Teams & Directory</h2>
                    <p className="text-sm text-gray-400">Manage departments, teams, and assign employees.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button onClick={() => setModals({ ...modals, dept: true })} className="bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors border border-[var(--color-border)]">+ Dept</button>
                    <button onClick={() => setModals({ ...modals, team: true })} className="bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors border border-[var(--color-border)]">+ Team</button>
                    <button onClick={() => setModals({ ...modals, emp: true })} className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors">+ Employee</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeDepts.map((dept, index) => {
                    const deptEmps = activeEmps.filter(e => e.departmentId === dept.id);
                    const manager = activeEmps.find(e => e.id === dept.managerId);

                    return (
                        <motion.div
                            key={dept.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6 flex flex-col hover:border-[var(--color-primary)]/50 transition-colors group relative"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">{dept.name} (Dept)</h3>
                                        <p className="text-sm text-gray-400">{deptEmps.length} Members</p>
                                    </div>
                                </div>
                                <div className="relative group/menu">
                                    <button className="text-gray-400 hover:text-white p-1">
                                        <MoreVertical className="w-5 h-5" />
                                    </button>
                                    <div className="absolute right-0 top-6 hidden group-hover/menu:block bg-[#111] border border-[var(--color-border)] rounded shadow-xl py-1 z-10 w-24">
                                        <button onClick={() => { setDeptForm({ ...dept, managerId: dept.managerId || '' }); setModals({ ...modals, dept: true }) }} className="w-full text-left px-3 py-1 text-sm hover:bg-white/10 flex items-center gap-2"><Edit className="w-3 h-3" /> Edit</button>
                                        <button onClick={() => setDeleteConfirm({ id: dept.id, type: 'dept' })} className="w-full text-left px-3 py-1 text-sm text-red-400 hover:bg-red-400/10 flex items-center gap-2"><Trash className="w-3 h-3" /> Delete</button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 space-y-4">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Dept Manager</p>
                                    {manager ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-[10px] font-bold text-white">
                                                {manager.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <p className="text-sm font-medium">{manager.name}</p>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-400 italic">Unassigned</p>
                                    )}
                                </div>

                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Teams</p>
                                    <div className="flex flex-wrap gap-1">
                                        {activeTeams.filter(t => t.departmentId === dept.id).map(t => (
                                            <span key={t.id} className="text-[10px] bg-white/10 px-2 py-0.5 rounded border border-white/5">{t.name}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* List All Employees simply */}
            <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-4 mt-6">
                <h3 className="font-semibold mb-4">All Employees</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-400 bg-white/5 uppercase">
                            <tr>
                                <th className="px-4 py-3 rounded-tl-lg">Name</th>
                                <th className="px-4 py-3">Role</th>
                                <th className="px-4 py-3">Department</th>
                                <th className="px-4 py-3 font-medium">Team</th>
                                <th className="px-4 py-3 rounded-tr-lg">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activeEmps.map(emp => (
                                <tr key={emp.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-3 font-medium flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-[var(--color-primary)] text-white text-[10px] flex items-center justify-center">{emp.name.substring(0, 2).toUpperCase()}</div>
                                        {emp.name}
                                    </td>
                                    <td className="px-4 py-3">{emp.role}</td>
                                    <td className="px-4 py-3">{activeDepts.find(d => d.id === emp.departmentId)?.name || '-'}</td>
                                    <td className="px-4 py-3">{activeTeams.find(t => t.id === emp.teamId)?.name || '-'}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => { setEmpForm(emp as any); setModals({ ...modals, emp: true }); }} className="text-gray-400 hover:text-white"><Edit className="w-4 h-4" /></button>
                                            <button onClick={() => setDeleteConfirm({ id: emp.id, type: 'emp' })} className="text-red-400 hover:text-red-300"><Trash className="w-4 h-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {activeEmps.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No employees added yet.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl max-w-sm p-6 w-full text-center">
                            <Trash className="w-12 h-12 text-red-500 mx-auto mb-4" />
                            <h3 className="text-lg font-bold mb-2">Confirm Deletion</h3>
                            <p className="text-gray-400 text-sm mb-6">Are you sure you want to delete this {deleteConfirm.type === 'emp' ? 'employee' : deleteConfirm.type}? This action cannot be undone.</p>
                            <div className="flex gap-4">
                                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">Cancel</button>
                                <button onClick={handleDelete} className="flex-1 py-2 rounded-lg bg-red-500 hover:bg-red-600 transition-colors text-white font-medium">Delete</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Department Modal */}
            <AnimatePresence>
                {modals.dept && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl max-w-md w-full p-6 relative">
                            <button onClick={() => setModals({ ...modals, dept: false })} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
                            <h3 className="text-lg font-bold mb-4">{deptForm.id ? 'Edit Department' : 'New Department'}</h3>
                            <form onSubmit={handleDeptSubmit} className="space-y-4">
                                <div>
                                    <label className="text-xs text-gray-400 block mb-1">Name</label>
                                    <input required type="text" value={deptForm.name} onChange={e => setDeptForm({ ...deptForm, name: e.target.value })} className="w-full bg-white/5 border border-[var(--color-border)] rounded p-2 focus:border-[var(--color-primary)] outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 block mb-1">Manager</label>
                                    <select value={deptForm.managerId} onChange={e => setDeptForm({ ...deptForm, managerId: e.target.value })} className="w-full bg-[#111] border border-[var(--color-border)] rounded p-2 focus:border-[var(--color-primary)] outline-none">
                                        <option value="">Unassigned</option>
                                        {activeEmps.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                    </select>
                                </div>
                                <button type="submit" className="w-full bg-[var(--color-primary)] text-white py-2 rounded-lg font-medium">{deptForm.id ? 'Save Changes' : 'Create'}</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Team Modal */}
            <AnimatePresence>
                {modals.team && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl max-w-md w-full p-6 relative">
                            <button onClick={() => setModals({ ...modals, team: false })} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
                            <h3 className="text-lg font-bold mb-4">{teamForm.id ? 'Edit Team' : 'New Team'}</h3>
                            <form onSubmit={handleTeamSubmit} className="space-y-4">
                                <div>
                                    <label className="text-xs text-gray-400 block mb-1">Name</label>
                                    <input required type="text" value={teamForm.name} onChange={e => setTeamForm({ ...teamForm, name: e.target.value })} className="w-full bg-white/5 border border-[var(--color-border)] rounded p-2 focus:border-[var(--color-primary)] outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 block mb-1">Department</label>
                                    <select required value={teamForm.departmentId} onChange={e => setTeamForm({ ...teamForm, departmentId: e.target.value })} className="w-full bg-[#111] border border-[var(--color-border)] rounded p-2 focus:border-[var(--color-primary)] outline-none">
                                        <option value="">Select Dept</option>
                                        {activeDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                                <button type="submit" className="w-full bg-[var(--color-primary)] text-white py-2 rounded-lg font-medium">{teamForm.id ? 'Save Changes' : 'Create'}</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Employee Modal */}
            <AnimatePresence>
                {modals.emp && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl max-w-md w-full p-6 relative">
                            <button onClick={() => setModals({ ...modals, emp: false })} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
                            <h3 className="text-lg font-bold mb-4">{empForm.id ? 'Edit Employee' : 'New Employee'}</h3>
                            <form onSubmit={handleEmpSubmit} className="space-y-4">
                                <div>
                                    <label className="text-xs text-gray-400 block mb-1">Name</label>
                                    <input required type="text" value={empForm.name} onChange={e => setEmpForm({ ...empForm, name: e.target.value })} className="w-full bg-white/5 border border-[var(--color-border)] rounded p-2 focus:border-[var(--color-primary)] outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 block mb-1">Role/Job Title</label>
                                    <input required type="text" value={empForm.role} onChange={e => setEmpForm({ ...empForm, role: e.target.value })} className="w-full bg-white/5 border border-[var(--color-border)] rounded p-2 focus:border-[var(--color-primary)] outline-none" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-400 block mb-1">Department</label>
                                        <select value={empForm.departmentId} onChange={e => setEmpForm({ ...empForm, departmentId: e.target.value, teamId: '' })} className="w-full bg-[#111] border border-[var(--color-border)] rounded p-2 focus:border-[var(--color-primary)] outline-none">
                                            <option value="">None</option>
                                            {activeDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 block mb-1">Team</label>
                                        <select value={empForm.teamId} onChange={e => setEmpForm({ ...empForm, teamId: e.target.value })} className="w-full bg-[#111] border border-[var(--color-border)] rounded p-2 focus:border-[var(--color-primary)] outline-none">
                                            <option value="">None</option>
                                            {activeTeams.filter(t => !empForm.departmentId || t.departmentId === empForm.departmentId).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 block mb-1">Work Capacity (hrs/week)</label>
                                    <input required type="number" value={empForm.capacity} onChange={e => setEmpForm({ ...empForm, capacity: Number(e.target.value) })} className="w-full bg-white/5 border border-[var(--color-border)] rounded p-2 focus:border-[var(--color-primary)] outline-none" />
                                </div>
                                <button type="submit" className="w-full bg-[var(--color-primary)] text-white py-2 rounded-lg font-medium">{empForm.id ? 'Save Changes' : 'Add Employee'}</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
