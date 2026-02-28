"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Lock, Mail, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { CanvasEffect } from "@/components/landing/CanvasEffect";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPwd, setShowPwd] = useState(false);

    // Users can pick their role upon signup
    const [role, setRole] = useState<"Employee" | "Manager" | "CEO">("Employee");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setIsLoading(true);

        const emailLower = email.toLowerCase().trim();

        // ── Real Supabase Signup ─────────────────────────────────────────────
        const { data, error: authError } = await supabase.auth.signUp({
            email: emailLower,
            password,
            options: {
                data: {
                    full_name: name,
                    role: role // Triggers will pick this up
                }
            }
        });

        if (authError) {
            setError(authError.message);
            setIsLoading(false);
            return;
        }

        if (data.user?.identities?.length === 0) {
            setError("An account with this email already exists.");
            setIsLoading(false);
            return;
        }

        setSuccess("Account created successfully! Redirecting to login...");

        // Brief pause for UX before routing
        setTimeout(() => {
            router.push("/login");
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-[var(--color-background)] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
            <CanvasEffect />
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[var(--color-primary)]/10 to-transparent opacity-50 pointer-events-none" />

            <div className="relative z-10 w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-[var(--color-primary)] tracking-widest mb-2">UNIFY</h1>
                    <p className="text-gray-400 text-sm">Create your enterprise workspace account</p>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[var(--color-card)]/80 backdrop-blur-xl border border-[var(--color-border)] rounded-2xl p-8 shadow-2xl"
                >
                    <h2 className="text-xl font-bold mb-6">Sign Up</h2>

                    {success ? (
                        <div className="text-emerald-400 text-center bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                            {success}
                        </div>
                    ) : (
                        <form onSubmit={handleSignup} className="space-y-4">
                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1.5">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        required
                                        placeholder="Alex Chen"
                                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                                    />
                                </div>
                            </div>

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

                            {/* Role Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1.5">Select Role</label>
                                <select
                                    value={role} onChange={e => setRole(e.target.value as "Employee" | "Manager" | "CEO")}
                                    className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors appearance-none"
                                >
                                    <option value="Employee">Employee (Dashboard Access)</option>
                                    <option value="Manager">Manager (Team Control)</option>
                                    <option value="CEO">CEO (Executive Overview)</option>
                                </select>
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
                                        minLength={6}
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
                                    <>Create Account <ArrowRight className="w-4 h-4" /></>
                                )}
                            </button>
                        </form>
                    )}
                </motion.div>

                <p className="text-center text-xs text-gray-600 mt-6">
                    Already have an account?{" "}
                    <a href="/login" className="text-[var(--color-primary)] hover:underline">Sign in</a>
                </p>
            </div>
        </div>
    );
}
