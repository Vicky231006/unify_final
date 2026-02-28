"use client";
import { motion } from "framer-motion";
import { Users, Briefcase, UserCog, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { CanvasEffect } from "@/components/landing/CanvasEffect";

const dummyRoles = [
    { id: 'ADM-001', role: 'CEO', name: 'Alex Chen', icon: Briefcase, color: "from-blue-500 to-indigo-500" },
    { id: 'MGR-042', role: 'Manager', name: 'Sarah Miller', icon: UserCog, color: "from-purple-500 to-pink-500" },
    { id: 'EMP-809', role: 'Employee', name: 'James Wilson', icon: Users, color: "from-emerald-500 to-teal-500" },
];

export default function LoginPage() {
    const router = useRouter();
    const { setUserRole } = useWorkspace();

    const handleLogin = (role: 'CEO' | 'Manager' | 'Employee') => {
        setUserRole(role);
        router.push('/workspaces');
    };

    return (
        <div className="min-h-screen bg-[var(--color-background)] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
            <CanvasEffect />
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[var(--color-primary)]/10 to-transparent opacity-50 pointer-events-none" />

            <div className="relative z-10 w-full max-w-4xl pt-10">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold mb-4">Select Identity</h1>
                    <p className="text-gray-400">Choose a simulated user profile to explore UNIFY capabilities.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {dummyRoles.map((user, i) => (
                        <motion.div
                            key={user.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            onClick={() => handleLogin(user.role as any)}
                            className="group relative bg-[var(--color-card)]/50 backdrop-blur-sm border border-[var(--color-border)] p-8 rounded-2xl hover:border-[var(--color-primary)]/50 transition-all cursor-pointer h-full flex flex-col items-center text-center"
                        >
                            <div className={`w-20 h-20 rounded-full mb-6 flex items-center justify-center bg-gradient-to-tr ${user.color} text-white shadow-lg`}>
                                <user.icon className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2 group-hover:text-[var(--color-primary)] transition-colors">{user.role}</h3>
                            <p className="text-gray-300 font-medium mb-1">{user.name}</p>
                            <p className="text-sm text-gray-500 mb-8">ID: {user.id}</p>

                            <div className="mt-auto w-full flex items-center justify-center text-sm font-bold text-white bg-white/5 py-3 rounded-xl group-hover:bg-[var(--color-primary)] transition-colors">
                                Login <ArrowRight className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
