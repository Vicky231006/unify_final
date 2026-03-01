"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, Network, BarChart3, ChevronRight, ArrowRight, UploadCloud, Plus, X, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { useAppStore } from "@/store";
import { parseCSVsClientSide } from "@/lib/csvParser";

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
    const [onboardingRole, setOnboardingRole] = useState<'CEO' | 'Manager' | 'Employee'>('Manager');
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
    const [csvFiles, setCsvFiles] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processMsg, setProcessMsg] = useState("");
    const [processResult, setProcessResult] = useState<"success" | "error" | "dummy" | null>(null);

    const { setWorkspaceData: setWorkspaceProviderData, setUserRole: setWsProviderUserRole } = useWorkspace();
    const { addWorkspace, bulkIngestWorkspaceData, setActiveWorkspaceId } = useAppStore();
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
        const files = e.target.files;
        if (files) {
            const valid = Array.from(files).filter(f => f.name.endsWith('.csv') || f.type === 'text/csv');
            setCsvFiles(prev => [...prev, ...valid]);
        }
    };

    const parseCSVAndSubmit = async () => {
        setIsProcessing(true);
        setProcessResult(null);
        setProcessMsg('Initializing workspace...');

        // 1. Create Workspace in Store
        const colors = ["from-blue-500 to-indigo-500", "from-red-500 to-orange-500", "from-emerald-500 to-teal-500"];
        const allGoals = [
            ...selectedGoals,
            ...customGoals.filter((g) => g.checked && g.value.trim()).map((g) => g.value.trim()),
        ];

        addWorkspace({
            name: wsName,
            role: onboardingRole,
            industry,
            orgSize,
            goals: allGoals,
            color: colors[Math.floor(Math.random() * colors.length)],
        });

        // Get the ID of the workspace we just created
        const latestWs = useAppStore.getState().workspaces.at(-1);
        if (!latestWs) {
            setProcessMsg("Failed to create workspace record.");
            setProcessResult("error");
            setIsProcessing(false);
            return;
        }
        const wsId = latestWs.id;

        // 2. Process CSVs
        if (csvFiles.length === 0) {
            setProcessMsg("No data files uploaded. Creating empty workspace...");
            setWorkspaceProviderData(wsName, managerId, []);
            setWsProviderUserRole(onboardingRole);
            setActiveWorkspaceId(wsId);
            setProcessResult("success");
            setIsProcessing(false);
            return;
        }

        try {
            setProcessMsg(`Parsing ${csvFiles.length} files locally...`);
            const csvContents = await Promise.all(csvFiles.map(f => f.text()));

            // Try client-side parser first
            const clientParsed = parseCSVsClientSide(csvContents);
            const hasData = clientParsed.employees.length > 0 ||
                clientParsed.projects.length > 0 ||
                clientParsed.tasks.length > 0 ||
                clientParsed.transactions.length > 0;

            let finalResult = clientParsed;

            // FALLBACK TO AI
            if (!hasData) {
                setProcessMsg("Local parser found no rows. Trying AI fallback...");
                const res = await fetch('http://127.0.0.1:8000/normalize-csv', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ csvContents }),
                });

                if (res.body) {
                    const reader = res.body.getReader();
                    const decoder = new TextDecoder();

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        const chunk = decoder.decode(value);
                        const lines = chunk.split('\n\n');
                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                try {
                                    const data = JSON.parse(line.slice(6));
                                    if (data.status === 'done') {
                                        finalResult = data.result;
                                    } else if (data.status === 'error') {
                                        console.warn("AI Fallback failed:", data.error);
                                    }
                                } catch (e) { }
                            }
                        }
                    }
                }
            }

            bulkIngestWorkspaceData(wsId, finalResult);

            const normalizedTxs = (finalResult.transactions || []).map((t: any) => ({
                ...t,
                Amount: Number(t.Amount) || 0
            }));
            setWorkspaceProviderData(wsName, managerId, normalizedTxs);

            setWsProviderUserRole(onboardingRole);
            setActiveWorkspaceId(wsId);
            setProcessMsg(hasData ? "Local parsing complete. Workspace ready." : "AI normalization complete. Workspace ready.");
            setProcessResult("success");

        } catch (err: any) {
            setProcessMsg(`Error: ${err.message}. Workspace created with manual details only.`);
            setProcessResult("error");
            setActiveWorkspaceId(wsId);
        } finally {
            setIsProcessing(false);
        }
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

                        {/* Role Selection */}
                        <div>
                            <label className="text-sm text-gray-400 mb-1 block">Your Role <span className="text-red-400">*</span></label>
                            <select
                                value={onboardingRole}
                                onChange={(e) => setOnboardingRole(e.target.value as 'CEO' | 'Manager' | 'Employee')}
                                className={inputCls() + " cursor-pointer"}
                                style={{ backgroundColor: "var(--color-background)" }}
                            >
                                <option value="CEO">CEO — Executive oversight</option>
                                <option value="Manager">Manager — Team execution control</option>
                                <option value="Employee">Employee — Personal task management</option>
                            </select>
                        </div>

                        {/* Manager ID + Dept Manager toggle */}
                        <div>
                            <label className="text-sm text-gray-400 mb-1 block">Your ID <span className="text-red-400">*</span></label>
                            <div className="flex items-center gap-2">
                                <input value={managerId} onChange={(e) => setManagerId(e.target.value)} type="text" className={inputCls(!!errors1.managerId)} placeholder="e.g. ADM-001" />
                                {onboardingRole !== 'Employee' && (
                                    <label className="flex items-center gap-2 shrink-0 cursor-pointer select-none px-3 py-3 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors text-xs text-gray-300 whitespace-nowrap"
                                        title="Also assign as Department Manager">
                                        <input type="checkbox" checked={isDeptManager} onChange={(e) => setIsDeptManager(e.target.checked)} className="accent-[var(--color-primary)] w-3.5 h-3.5" />
                                        Dept. Mgr
                                    </label>
                                )}
                            </div>
                            {errors1.managerId && <FieldError msg={errors1.managerId} />}
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
                            <p className="text-gray-400 text-sm">Upload CSV files for AI-powered workspace normalization. <span className="text-gray-500">(Optional)</span></p>
                        </div>

                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${csvFiles.length > 0 ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5" : "border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-white/5"}`}
                        >
                            <input type="file" accept=".csv" multiple className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                                <UploadCloud className={`w-5 h-5 ${csvFiles.length > 0 ? "text-[var(--color-primary)]" : "text-gray-400"}`} />
                            </div>
                            <div className="text-center">
                                <p className="font-semibold text-gray-300 text-sm">Click to upload CSVs</p>
                                <p className="text-[10px] text-gray-600 mt-1">Employees, Projects, Financials, etc.</p>
                            </div>
                        </div>

                        {/* File list */}
                        {csvFiles.length > 0 && (
                            <div className="space-y-2 max-h-[20vh] overflow-y-auto pr-1 custom-scrollbar">
                                {csvFiles.map((f, i) => (
                                    <div key={i} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs">
                                        <BrainCircuit className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                        <span className="flex-1 truncate text-gray-200">{f.name}</span>
                                        <button onClick={(e) => { e.stopPropagation(); setCsvFiles(prev => prev.filter((_, idx) => idx !== i)); }} className="text-gray-500 hover:text-red-400">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {processMsg && (
                            <div className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${processResult === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
                                {isProcessing ? <BrainCircuit className="w-3.5 h-3.5 animate-pulse shrink-0 mt-0.5" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
                                {processMsg}
                            </div>
                        )}

                        <button
                            onClick={async () => {
                                await parseCSVAndSubmit();
                                if (!isProcessing) handleNext();
                            }}
                            disabled={isProcessing}
                            className="mt-2 w-full bg-[var(--color-primary)] text-white p-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {isProcessing ? "Normalizing..." : "Compile Workspace"} <ArrowRight className="w-4 h-4" />
                        </button>
                    </motion.div>
                );

            case 5:
                return <LoadingState onComplete={() => {
                    router.push('/dashboard');
                }} />;
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center px-4 relative z-10 py-12">
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
