"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Building2, ChevronRight, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store";
import { formatDistanceToNow } from "date-fns";

export default function WorkspacesPage() {
    const { workspaces, addWorkspace, setActiveWorkspaceId } = useAppStore();
    const router = useRouter();
    const [isCreating, setIsCreating] = useState(false);
    const [newWsName, setNewWsName] = useState("");
    const [newWsRole, setNewWsRole] = useState("Manager");

    const handleSelectWorkspace = (id: string) => {
        setActiveWorkspaceId(id);
        router.push("/dashboard");
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newWsName.trim()) return;

        const colors = [
            "from-blue-500 to-indigo-500",
            "from-red-500 to-orange-500",
            "from-emerald-500 to-teal-500",
            "from-purple-500 to-pink-500",
            "from-cyan-500 to-blue-500"
        ];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        addWorkspace({
            name: newWsName,
            role: newWsRole,
            color: randomColor,
        });

        setIsCreating(false);
        setNewWsName("");
        setNewWsRole("Manager");
    };

    return (
        <div className="min-h-screen bg-[var(--color-background)] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--color-primary)] rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 w-full max-w-4xl">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold mb-4">Select Workspace</h1>
                    <p className="text-gray-400">Choose an existing organization or create a new UNIFY environment.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {workspaces.map((ws, i) => (
                        <motion.div
                            key={ws.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            onClick={() => handleSelectWorkspace(ws.id)}
                            className="group relative bg-[var(--color-card)]/50 backdrop-blur-sm border border-[var(--color-border)] p-6 rounded-2xl hover:border-[var(--color-primary)]/50 transition-all cursor-pointer h-full flex flex-col"
                        >
                            <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center bg-gradient-to-tr ${ws.color} text-white shadow-lg`}>
                                <Building2 className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold mb-1 group-hover:text-[var(--color-primary)] transition-colors">{ws.name}</h3>
                            <p className="text-sm text-gray-400 mb-6">{ws.role}</p>

                            <div className="mt-auto flex items-center justify-between text-xs text-gray-500 border-t border-[var(--color-border)] pt-4">
                                <span>Last active: {ws.lastActive ? formatDistanceToNow(new Date(ws.lastActive), { addSuffix: true }) : 'Just now'}</span>
                                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                            </div>
                        </motion.div>
                    ))}

                    {/* Create New Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 }}
                        onClick={() => setIsCreating(true)}
                        className="h-full border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-primary)] rounded-2xl flex flex-col items-center justify-center gap-4 text-gray-400 hover:text-white hover:bg-[var(--color-primary)]/5 transition-all p-8 cursor-pointer min-h-[220px]"
                    >
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-2">
                            <Plus className="w-6 h-6 text-[var(--color-primary)]" />
                        </div>
                        <p className="font-semibold">Create New Workspace</p>
                        <p className="text-xs text-center px-4">Initialize a new environment with fresh data streams.</p>
                    </motion.div>
                </div>
            </div>

            {/* Create Workspace Modal */}
            <AnimatePresence>
                {isCreating && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setIsCreating(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6 shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setIsCreating(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <h2 className="text-2xl font-bold mb-6">New Workspace</h2>

                            <form onSubmit={handleCreate} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Company / Workspace Name</label>
                                    <input
                                        type="text"
                                        value={newWsName}
                                        onChange={(e) => setNewWsName(e.target.value)}
                                        className="w-full bg-white/5 border border-[var(--color-border)] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                                        placeholder="e.g. Acme Corp"
                                        autoFocus
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Your Role</label>
                                    <select
                                        value={newWsRole}
                                        onChange={(e) => setNewWsRole(e.target.value)}
                                        className="w-full bg-[#111] border border-[var(--color-border)] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors appearance-none"
                                    >
                                        <option value="Manager">Manager</option>
                                        <option value="CEO">CEO</option>
                                        <option value="Employee">Employee</option>
                                    </select>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/80 text-white font-medium py-2 rounded-lg transition-colors mt-2"
                                >
                                    Create Workspace
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
