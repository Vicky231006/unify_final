"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Lock, Mail, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { CanvasEffect } from "@/components/landing/CanvasEffect";

// Demo credentials — in production these come from a JWT-authenticated backend
const DEMO_USERS = [
    { email: "alex@acmecorp.com", password: "ceo123", name: "Alex Chen", role: "CEO" as const },
    { email: "sarah@acmecorp.com", password: "mgr123", name: "Sarah Miller", role: "Manager" as const },
    { email: "james@acmecorp.com", password: "emp123", name: "James Wilson", role: "Employee" as const },
];

export default function LoginPage() {
    const router = useRouter();
    const { setUserRole } = useWorkspace();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPwd, setShowPwd] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        // Simulate network latency
        await new Promise(r => setTimeout(r, 600));

        const user = DEMO_USERS.find(
            u => u.email.toLowerCase() === email.toLowerCase().trim() && u.password === password
        );

        if (!user) {
            setError("Invalid email or password. Try a demo account below.");
            setIsLoading(false);
            return;
        }

        // Persist role
        setUserRole(user.role);

        // Role-based post-login routing:
        // CEO & Manager → workspaces (choose org)
        // Employee → dashboard directly (no org switching)
        if (user.role === "Employee") {
            router.push("/dashboard");
        } else {
            router.push("/workspaces");
        }
    };

    const fillDemo = (u: typeof DEMO_USERS[0]) => {
        setEmail(u.email);
        setPassword(u.password);
        setError("");
    };

    return (
        <div className="min-h-screen bg-[var(--color-background)] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
            <CanvasEffect />
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[var(--color-primary)]/10 to-transparent opacity-50 pointer-events-none" />

            <div className="relative z-10 w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-[var(--color-primary)] tracking-widest mb-2">UNIFY</h1>
                    <p className="text-gray-400 text-sm">Sign in to your enterprise workspace</p>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[var(--color-card)]/80 backdrop-blur-xl border border-[var(--color-border)] rounded-2xl p-8 shadow-2xl"
                >
                    <h2 className="text-xl font-bold mb-6">Welcome back</h2>

                    <form onSubmit={handleLogin} className="space-y-4">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1.5">Email address</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                    placeholder="you@company.com"
                                    className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1.5">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type={showPwd ? "text" : "password"}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg pl-10 pr-11 py-2.5 text-white text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPwd(v => !v)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <motion.p
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
                            >
                                {error}
                            </motion.p>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/80 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 mt-2"
                        >
                            {isLoading ? (
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>Sign In <ArrowRight className="w-4 h-4" /></>
                            )}
                        </button>
                    </form>

                    {/* Demo accounts */}
                    <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
                        <p className="text-xs text-gray-500 text-center mb-3">Demo accounts — click to fill</p>
                        <div className="grid grid-cols-3 gap-2">
                            {DEMO_USERS.map(u => (
                                <button
                                    key={u.email}
                                    onClick={() => fillDemo(u)}
                                    className="flex flex-col items-center gap-1 p-2 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/5 transition-all text-center"
                                >
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${u.role === 'CEO' ? 'bg-blue-500/20 text-blue-400' :
                                            u.role === 'Manager' ? 'bg-purple-500/20 text-purple-400' :
                                                'bg-emerald-500/20 text-emerald-400'
                                        }`}>{u.role}</span>
                                    <span className="text-[10px] text-gray-500 truncate w-full">{u.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>

                <p className="text-center text-xs text-gray-600 mt-6">
                    New to UNIFY?{" "}
                    <a href="/" className="text-[var(--color-primary)] hover:underline">Get started</a>
                </p>
            </div>
        </div>
    );
}
