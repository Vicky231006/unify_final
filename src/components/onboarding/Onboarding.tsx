"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, Network, BarChart3, ChevronRight, ArrowRight, UploadCloud, Plus, X, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Department {
    id: number;
    name: string;
    headcount: string;
}

interface CustomGoal {
    id: number;
    value: string;
    checked: boolean;
}

// ─── Validation helper ────────────────────────────────────────────────────────
function FieldError({ msg }: { msg: string }) {
    return (
        <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-1 text-red-400 text-xs mt-1"
        >
            <AlertCircle className="w-3 h-3" /> {msg}
        </motion.p>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function Onboarding() {
    const [step, setStep] = useState(1);

    // Step 1
    const [wsName, setWsName] = useState("");
    const [industry, setIndustry] = useState("");
    const [orgSize, setOrgSize] = useState("");
    const [managerId, setManagerId] = useState("");
    const [isDeptManager, setIsDeptManager] = useState(false);
    const [errors1, setErrors1] = useState<Record<string, string>>({});

    // Step 2
    const [departments, setDepartments] = useState<Department[]>([
        { id: 1, name: "", headcount: "" },
    ]);
    const [errors2, setErrors2] = useState<Record<number, Record<string, string>>>({});

    // Step 3
    const PRESET_GOALS = ["Employee Burnout", "Project Delays", "Asset Loss", "Siloed Knowledge", "Budget Overruns", "Poor Visibility"];
    const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
    const [customGoals, setCustomGoals] = useState<CustomGoal[]>([]);
    const [errors3, setErrors3] = useState("");

    // Step 4
    const [csvFile, setCsvFile] = useState<File | null>(null);

    const { setWorkspaceData } = useWorkspace();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Dept helpers ───────────────────────────────────────────────────────────
    const addDepartment = () =>
        setDepartments([...departments, { id: Date.now(), name: "", headcount: "" }]);

    const removeDepartment = (id: number) =>
        setDepartments(departments.filter((d) => d.id !== id));

    const updateDept = (id: number, field: keyof Omit<Department, "id">, value: string) =>
        setDepartments((prev) => prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)));

    // ── Goal helpers ───────────────────────────────────────────────────────────
    const toggleGoal = (g: string) =>
        setSelectedGoals((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));

    const addCustomGoal = () =>
        setCustomGoals((prev) => [...prev, { id: Date.now(), value: "", checked: true }]);

    const updateCustomGoal = (id: number, value: string) =>
        setCustomGoals((prev) => prev.map((g) => (g.id === id ? { ...g, value } : g)));

    const toggleCustomGoal = (id: number) =>
        setCustomGoals((prev) => prev.map((g) => (g.id === id ? { ...g, checked: !g.checked } : g)));

    const removeCustomGoal = (id: number) =>
        setCustomGoals((prev) => prev.filter((g) => g.id !== id));

    // ── Validators ─────────────────────────────────────────────────────────────
    const validateStep1 = () => {
        const e: Record<string, string> = {};
        if (!wsName.trim()) e.wsName = "Organization name is required.";
        if (!industry.trim()) e.industry = "Industry is required.";
        if (!orgSize) e.orgSize = "Please select an organization size.";
        if (!managerId.trim()) e.managerId = "Manager ID is required.";
        setErrors1(e);
        return Object.keys(e).length === 0;
    };

    const validateStep2 = () => {
        const e: Record<number, Record<string, string>> = {};
        departments.forEach((d) => {
            const de: Record<string, string> = {};
            if (!d.name.trim()) de.name = "Department name is required.";
            if (d.headcount === "") de.headcount = "Headcount is required.";
            else if (Number(d.headcount) < 1) de.headcount = "Headcount must be at least 1.";
            if (Object.keys(de).length) e[d.id] = de;
        });
        setErrors2(e);
        return Object.keys(e).length === 0;
    };

    const validateStep3 = () => {
        const allGoals = [
            ...selectedGoals,
            ...customGoals.filter((g) => g.checked && g.value.trim()).map((g) => g.value.trim()),
        ];
        if (allGoals.length === 0) {
            setErrors3("Please select or add at least one goal.");
            return false;
        }
        setErrors3("");
        return true;
    };

    // ── Navigation ─────────────────────────────────────────────────────────────
    const handleNext = () => {
        if (step === 1 && !validateStep1()) return;
        if (step === 2 && !validateStep2()) return;
        if (step === 3 && !validateStep3()) return;
        if (step < 5) setStep(step + 1);
    };

    // ── CSV / Submit ───────────────────────────────────────────────────────────
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setCsvFile(file);
    };

    const parseCSVAndSubmit = () => {
        if (!csvFile) {
            setWorkspaceData(wsName, managerId, []);
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const lines = text.split("\n");
            const transactions: { Date: string; Amount: number; Type: "Revenue" | "Expense"; Category: string }[] = [];
            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;
                const [date, amountStr, type, category] = lines[i].split(",").map((s) => s.trim());
                transactions.push({
                    Date: date,
                    Amount: parseFloat(amountStr) || 0,
                    Type: type as "Revenue" | "Expense",
                    Category: category,
                });
            }
            setWorkspaceData(wsName, managerId, transactions);
        };
        reader.readAsText(csvFile);
    };

    // ── Input class helper ────────────────────────────────────────────────────
    const inputCls = (hasError?: boolean) =>
        `w-full bg-[var(--color-background)] border ${hasError ? "border-red-500" : "border-[var(--color-border)]"} rounded-lg p-3 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors text-sm`;

    // ── Step content ───────────────────────────────────────────────────────────
    const currentStepContent = () => {
        switch (step) {
            // ── STEP 1: Identity ──────────────────────────────────────────────
            case 1:
                return (
                    <motion.div key="step1" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="flex flex-col gap-5">
                        <div>
                            <h2 className="text-2xl font-bold mb-1">The Identity</h2>
                            <p className="text-gray-400 text-sm">Tell us about your organization before we build your workspace.</p>
                        </div>

                        {/* Org Name */}
                        <div>
                            <label className="text-sm text-gray-400 mb-1 block">Organization Name <span className="text-red-400">*</span></label>
                            <input value={wsName} onChange={(e) => setWsName(e.target.value)} type="text" className={inputCls(!!errors1.wsName)} placeholder="e.g. Acme Corp" />
                            {errors1.wsName && <FieldError msg={errors1.wsName} />}
                        </div>

                        {/* Industry */}
                        <div>
                            <label className="text-sm text-gray-400 mb-1 block">Industry <span className="text-red-400">*</span></label>
                            <input value={industry} onChange={(e) => setIndustry(e.target.value)} type="text" className={inputCls(!!errors1.industry)} placeholder="e.g. Technology, Healthcare, Finance" />
                            {errors1.industry && <FieldError msg={errors1.industry} />}
                        </div>

                        {/* Org Size */}
                        <div>
                            <label className="text-sm text-gray-400 mb-1 block">Organization Size <span className="text-red-400">*</span></label>
                            <select value={orgSize} onChange={(e) => setOrgSize(e.target.value)} className={inputCls(!!errors1.orgSize) + " cursor-pointer"} style={{ backgroundColor: "var(--color-background)" }}>
                                <option value="" disabled>Select size…</option>
                                <option value="1-10">1–10 employees</option>
                                <option value="11-50">11–50 employees</option>
                                <option value="51-200">51–200 employees</option>
                                <option value="201-1000">201–1,000 employees</option>
                                <option value="1000+">1,000+ employees</option>
                            </select>
                            {errors1.orgSize && <FieldError msg={errors1.orgSize} />}
                        </div>

                        {/* Manager ID + Dept Manager toggle */}
                        <div>
                            <label className="text-sm text-gray-400 mb-1 block">Your Manager ID <span className="text-red-400">*</span></label>
                            <div className="flex items-center gap-2">
                                <input value={managerId} onChange={(e) => setManagerId(e.target.value)} type="text" className={inputCls(!!errors1.managerId)} placeholder="e.g. ADM-001" />
                                <label className="flex items-center gap-2 shrink-0 cursor-pointer select-none px-3 py-3 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors text-xs text-gray-300 whitespace-nowrap"
                                    title="Also assign as Department Manager">
                                    <input type="checkbox" checked={isDeptManager} onChange={(e) => setIsDeptManager(e.target.checked)} className="accent-[var(--color-primary)] w-3.5 h-3.5" />
                                    Dept. Manager
                                </label>
                            </div>
                            {errors1.managerId && <FieldError msg={errors1.managerId} />}
                            {isDeptManager && (
                                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-[var(--color-primary)] mt-1">
                                    ✓ This manager will also be set as Department Manager.
                                </motion.p>
                            )}
                        </div>

                        <button onClick={handleNext} className="mt-2 w-full bg-[var(--color-primary)] text-white p-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-opacity-90 transition-opacity cursor-pointer">
                            Continue <ChevronRight className="w-4 h-4" />
                        </button>
                    </motion.div>
                );

            // ── STEP 2: Team / Departments ────────────────────────────────────
            case 2:
                return (
                    <motion.div key="step2" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="flex flex-col gap-5">
                        <div>
                            <h2 className="text-2xl font-bold mb-1">The Team</h2>
                            <p className="text-gray-400 text-sm">Map out your departments. Every field is required.</p>
                        </div>

                        <div className="flex flex-col gap-4 max-h-[38vh] overflow-y-auto pr-1 custom-scrollbar">
                            {departments.map((dept, index) => (
                                <div key={dept.id} className="flex gap-2 items-start">
                                    {/* Name */}
                                    <div className="flex-1">
                                        {index === 0 && <label className="text-xs text-gray-400 mb-1 block">Department Name <span className="text-red-400">*</span></label>}
                                        <input
                                            type="text"
                                            value={dept.name}
                                            onChange={(e) => updateDept(dept.id, "name", e.target.value)}
                                            className={inputCls(!!errors2[dept.id]?.name)}
                                            placeholder="e.g. Engineering"
                                        />
                                        {errors2[dept.id]?.name && <FieldError msg={errors2[dept.id].name} />}
                                    </div>

                                    {/* Headcount */}
                                    <div className="w-28">
                                        {index === 0 && <label className="text-xs text-gray-400 mb-1 block">Headcount <span className="text-red-400">*</span></label>}
                                        <input
                                            type="number"
                                            min={1}
                                            value={dept.headcount}
                                            onChange={(e) => updateDept(dept.id, "headcount", e.target.value)}
                                            className={inputCls(!!errors2[dept.id]?.headcount)}
                                            placeholder="≥ 1"
                                        />
                                        {errors2[dept.id]?.headcount && <FieldError msg={errors2[dept.id].headcount} />}
                                    </div>

                                    {/* Remove */}
                                    {departments.length > 1 && (
                                        <button
                                            onClick={() => removeDepartment(dept.id)}
                                            className={`p-2.5 text-gray-500 hover:text-red-400 transition-colors shrink-0 ${index === 0 ? "mt-5" : ""}`}
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}

                            <button onClick={addDepartment} className="flex items-center gap-1.5 text-[var(--color-primary)] text-sm font-medium self-start hover:underline cursor-pointer mt-1">
                                <Plus className="w-4 h-4" /> Add department
                            </button>
                        </div>

                        <button onClick={handleNext} className="mt-2 w-full bg-[var(--color-primary)] text-white p-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-opacity-90 transition-opacity cursor-pointer">
                            Continue <ChevronRight className="w-4 h-4" />
                        </button>
                    </motion.div>
                );

            // ── STEP 3: Goals ─────────────────────────────────────────────────
            case 3:
                return (
                    <motion.div key="step3" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="flex flex-col gap-5">
                        <div>
                            <h2 className="text-2xl font-bold mb-1">The Goals</h2>
                            <p className="text-gray-400 text-sm">Select or add the pain points Unify should tackle. Pick at least one.</p>
                        </div>

                        <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto pr-1 custom-scrollbar">
                            {/* Preset goals */}
                            {PRESET_GOALS.map((point) => (
                                <label key={point} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedGoals.includes(point) ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10" : "border-[var(--color-border)] hover:border-[var(--color-primary)]"}`}>
                                    <input type="checkbox" checked={selectedGoals.includes(point)} onChange={() => toggleGoal(point)} className="w-4 h-4 accent-[var(--color-primary)]" />
                                    <span className="text-sm">{point}</span>
                                </label>
                            ))}

                            {/* Custom goals */}
                            {customGoals.map((g) => (
                                <div key={g.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${g.checked ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10" : "border-[var(--color-border)]"}`}>
                                    <input
                                        type="checkbox"
                                        checked={g.checked}
                                        onChange={() => toggleCustomGoal(g.id)}
                                        className="w-4 h-4 accent-[var(--color-primary)] shrink-0 cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={g.value}
                                        onChange={(e) => updateCustomGoal(g.id, e.target.value)}
                                        placeholder="Add goal…"
                                        className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-500 focus:outline-none"
                                        autoFocus
                                    />
                                    <button onClick={() => removeCustomGoal(g.id)} className="p-1 text-gray-500 hover:text-red-400 transition-colors shrink-0">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}

                            {/* Add goal button */}
                            <button onClick={addCustomGoal} className="flex items-center gap-1.5 text-[var(--color-primary)] text-sm font-medium self-start hover:underline cursor-pointer mt-1">
                                <Plus className="w-4 h-4" /> Add goal
                            </button>
                        </div>

                        {errors3 && <FieldError msg={errors3} />}

                        <button onClick={handleNext} className="mt-2 w-full bg-[var(--color-primary)] text-white p-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-opacity-90 transition-opacity cursor-pointer">
                            Continue <ChevronRight className="w-4 h-4" />
                        </button>
                    </motion.div>
                );

            // ── STEP 4: Ingest Data ───────────────────────────────────────────
            case 4:
                return (
                    <motion.div key="step4" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="flex flex-col gap-6">
                        <div>
                            <h2 className="text-2xl font-bold mb-1">Ingest Data</h2>
                            <p className="text-gray-400 text-sm">Upload financial records for real-time analytics. <span className="text-gray-500">(Optional)</span></p>
                        </div>

                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${csvFile ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5" : "border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-white/5"}`}
                        >
                            <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                                <UploadCloud className={`w-6 h-6 ${csvFile ? "text-[var(--color-primary)]" : "text-gray-400"}`} />
                            </div>
                            <div className="text-center">
                                {csvFile ? (
                                    <>
                                        <p className="font-semibold text-[var(--color-primary)]">{csvFile.name}</p>
                                        <p className="text-xs text-gray-400 mt-1">{(csvFile.size / 1024).toFixed(2)} KB</p>
                                    </>
                                ) : (
                                    <>
                                        <p className="font-semibold text-gray-300">Click to upload CSV</p>
                                        <p className="text-xs text-gray-500 mt-1">Format: Date, Amount, Type, Category</p>
                                    </>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                parseCSVAndSubmit();
                                handleNext();
                            }}
                            className="mt-4 w-full bg-[var(--color-primary)] text-white p-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-opacity-90 transition-opacity cursor-pointer"
                        >
                            Compile Workspace <ArrowRight className="w-4 h-4" />
                        </button>
                    </motion.div>
                );

            case 5:
                return <LoadingState onComplete={() => router.push("/dashboard")} />;
        }
    };

    return (
        <div className="h-full w-full flex items-center justify-center px-4 relative z-10">
            <div className="w-full max-w-md bg-[var(--color-card)]/80 backdrop-blur-xl border border-[var(--color-border)] p-8 rounded-2xl shadow-2xl relative overflow-hidden">
                {step < 5 && (
                    <div className="absolute top-0 left-0 h-1 bg-[var(--color-border)] w-full">
                        <motion.div
                            className="h-full bg-[var(--color-primary)]"
                            initial={{ width: `${(step - 1) * 25}%` }}
                            animate={{ width: `${step * 25}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                )}
                <AnimatePresence mode="wait">{currentStepContent()}</AnimatePresence>
            </div>
        </div>
    );
}

// ─── Loading State ─────────────────────────────────────────────────────────────
function LoadingState({ onComplete }: { onComplete: () => void }) {
    const [loadingText, setLoadingText] = useState("Analyzing silos...");
    const [activeIcon, setActiveIcon] = useState(0);

    useEffect(() => {
        const timeouts = [
            setTimeout(() => { setLoadingText("Mapping dependencies..."); setActiveIcon(1); }, 2000),
            setTimeout(() => { setLoadingText("Ready."); setActiveIcon(2); }, 4000),
            setTimeout(() => { onComplete(); }, 5500),
        ];
        return () => timeouts.forEach(clearTimeout);
    }, [onComplete]);

    return (
        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-12 gap-8 text-center">
            <div className="relative w-24 h-24 flex items-center justify-center">
                <AnimatePresence mode="wait">
                    {activeIcon === 0 && (
                        <motion.div key="icon1" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute">
                            <BrainCircuit className="w-16 h-16 text-[var(--color-primary)] animate-pulse" />
                        </motion.div>
                    )}
                    {activeIcon === 1 && (
                        <motion.div key="icon2" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute">
                            <Network className="w-16 h-16 text-emerald-400 animate-[spin_3s_linear_infinite]" />
                        </motion.div>
                    )}
                    {activeIcon === 2 && (
                        <motion.div key="icon3" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute">
                            <BarChart3 className="w-16 h-16 text-blue-400" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <div className="h-8">
                <AnimatePresence mode="wait">
                    <motion.p key={loadingText} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-lg font-medium text-gray-300">
                        {loadingText}
                    </motion.p>
                </AnimatePresence>
            </div>
            <h3 className="text-[var(--color-primary)] font-bold tracking-widest uppercase text-sm">Cooking your Workspace</h3>
        </motion.div>
    );
}
