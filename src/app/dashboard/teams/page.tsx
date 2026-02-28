"use client";
import { motion } from "framer-motion";
import { Users, Mail, Phone, MoreVertical } from "lucide-react";

const teams = [
    { id: 1, name: "Engineering", headcount: 45, lead: "Sarah Connor", status: "Nominal" },
    { id: 2, name: "Product", headcount: 12, lead: "John Doe", status: "High Risk" },
    { id: 3, name: "Design", headcount: 8, lead: "Alice Wang", status: "Nominal" },
    { id: 4, name: "Marketing", headcount: 22, lead: "Mike Smith", status: "Warning" },
    { id: 5, name: "Sales", headcount: 35, lead: "Emma Davis", status: "Nominal" },
    { id: 6, name: "HR", headcount: 5, lead: "Chris Wilson", status: "Nominal" },
];

export default function TeamsPage() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-[var(--color-card)] p-4 rounded-2xl border border-[var(--color-border)]">
                <div>
                    <h2 className="text-xl font-bold">Teams Directory</h2>
                    <p className="text-sm text-gray-400">Manage and monitor your organization's departments.</p>
                </div>
                <button className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors">
                    + Add Team
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teams.map((team, index) => (
                    <motion.div
                        key={team.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6 flex flex-col hover:border-[var(--color-primary)]/50 transition-colors"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
                                    <Users className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">{team.name}</h3>
                                    <p className="text-sm text-gray-400">{team.headcount} Members</p>
                                </div>
                            </div>
                            <button className="text-gray-400 hover:text-white">
                                <MoreVertical className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 space-y-4">
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Team Lead</p>
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-[10px] font-bold text-white">
                                        {team.lead.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <p className="text-sm font-medium">{team.lead}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Burnout Risk</p>
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${team.status === 'Nominal' ? 'bg-emerald-400' :
                                            team.status === 'Warning' ? 'bg-yellow-400' : 'bg-red-500 animate-pulse'
                                        }`} />
                                    <p className={`text-sm font-medium ${team.status === 'Nominal' ? 'text-emerald-400' :
                                            team.status === 'Warning' ? 'text-yellow-400' : 'text-red-500'
                                        }`}>{team.status}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-[var(--color-border)] flex gap-2">
                            <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm text-gray-300">
                                <Mail className="w-4 h-4" /> Message
                            </button>
                            <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm text-gray-300">
                                <Phone className="w-4 h-4" /> Call
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
