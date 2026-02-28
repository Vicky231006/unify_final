"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CEOView } from "@/components/dashboard/CEOView";
import { ManagerView } from "@/components/dashboard/ManagerView";
import { EmployeeView } from "@/components/dashboard/EmployeeView";

export default function Dashboard() {
    const [role, setRole] = useState<'CEO' | 'Manager' | 'Employee'>('CEO');

    return (
        <div className="space-y-6">
            <div className="flex gap-2 p-1 bg-[var(--color-card)] rounded-lg w-fit border border-[var(--color-border)]">
                {['CEO', 'Manager', 'Employee'].map((r) => (
                    <button
                        key={r}
                        onClick={() => setRole(r as any)}
                        className={`cursor-pointer px-4 py-2 rounded-md text-sm font-medium transition-colors ${role === r ? 'bg-[var(--color-primary)] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        {r} View
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={role}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    {role === 'CEO' && <CEOView />}
                    {role === 'Manager' && <ManagerView />}
                    {role === 'Employee' && <EmployeeView />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
