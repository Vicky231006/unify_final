"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, LogIn, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";

// ── Dummy credentials ──────────────────────────────────────────────────────────
const DUMMY_USERS = [
    { email: "admin@unify.io", password: "unify123", name: "Alex Carter" },
    { email: "demo@unify.io", password: "demo1234", name: "Jordan Blake" },
];

// ── Login Modal ────────────────────────────────────────────────────────────────
function LoginModal({ onClose }: { onClose: () => void }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        setTimeout(() => {
            const user = DUMMY_USERS.find(
                (u) => u.email === email.trim().toLowerCase() && u.password === password
            );
            setLoading(false);
            if (user) {
                setSuccess(`Welcome back, ${user.name}!`);
                setTimeout(() => onClose(), 1500);
            } else {
                setError("Invalid email or password. Try admin@unify.io / unify123");
            }
        }, 900);
    };

    return (
        <motion.div
            className="fixed inset-0 z-[999] flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Backdrop */}
            <motion.div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            />

            {/* Card */}
            <motion.div
                className="relative z-10 w-full max-w-md bg-[#0f1012]/90 border border-white/10 rounded-2xl p-8 shadow-2xl"
                initial={{ opacity: 0, scale: 0.92, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 24 }}
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
            >
                {/* Glowing accent */}
                <div className="absolute -top-px left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-[#5e6ad2] to-transparent" />

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Welcome back</h2>
                        <p className="text-sm text-gray-400 mt-1">Sign in to your Unify account</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleLogin} className="flex flex-col gap-5">
                    {/* Email */}
                    <div>
                        <label className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-2 block">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@unify.io"
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#5e6ad2]/70 focus:bg-white/8 transition-all text-sm"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-2 block">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPass ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-600 focus:outline-none focus:border-[#5e6ad2]/70 focus:bg-white/8 transition-all text-sm"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass(!showPass)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                            >
                                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Feedback */}
                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div
                                key="error"
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg p-3"
                            >
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                {error}
                            </motion.div>
                        )}
                        {success && (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg p-3"
                            >
                                <CheckCircle2 className="w-4 h-4 shrink-0" />
                                {success}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading || !!success}
                        className="relative w-full bg-[#5e6ad2] hover:bg-[#6b78e5] disabled:opacity-60 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                        <span className="relative z-10 flex items-center gap-2">
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                    Verifying...
                                </span>
                            ) : (
                                <>
                                    <LogIn className="w-4 h-4" /> Sign In
                                </>
                            )}
                        </span>
                    </button>
                </form>

                {/* Hint */}
                <p className="text-center text-xs text-gray-600 mt-6">
                    Demo:{" "}
                    <span className="text-gray-400 font-mono">admin@unify.io</span>{" "}
                    /{" "}
                    <span className="text-gray-400 font-mono">unify123</span>
                </p>
            </motion.div>
        </motion.div>
    );
}

// ── Navbar ─────────────────────────────────────────────────────────────────────
export function Navbar({ onSignUp }: { onSignUp: () => void }) {
    const [showLogin, setShowLogin] = useState(false);

    return (
        <>
            <motion.nav
                className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
            >
                {/* Logo */}
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#5e6ad2] flex items-center justify-center font-bold text-white text-xs tracking-wide shadow-lg shadow-[#5e6ad2]/30">
                        U
                    </div>
                    <span className="text-white font-semibold text-sm tracking-wide hidden sm:block">
                        UNIFY
                    </span>
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-3">
                    {/* Log In */}
                    <motion.button
                        id="navbar-login-btn"
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setShowLogin(true)}
                        className="px-5 py-2 rounded-full text-sm font-medium text-gray-300 border border-white/10 bg-white/5 hover:bg-white/10 hover:text-white hover:border-white/20 backdrop-blur-sm transition-all"
                    >
                        Log In
                    </motion.button>

                    {/* Sign Up */}
                    <motion.button
                        id="navbar-signup-btn"
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={onSignUp}
                        className="relative px-5 py-2 rounded-full text-sm font-semibold text-white bg-[#5e6ad2] hover:bg-[#6b78e5] shadow-lg shadow-[#5e6ad2]/25 transition-all overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-white/15 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out rounded-full" />
                        <span className="relative z-10">Sign Up</span>
                    </motion.button>
                </div>
            </motion.nav>

            {/* Login Modal */}
            <AnimatePresence>
                {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
            </AnimatePresence>
        </>
    );
}
