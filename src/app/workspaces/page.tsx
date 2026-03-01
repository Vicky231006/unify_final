"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Building2, ChevronRight, X, Upload, FileText, Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAppStore, NormalizedWorkspaceData } from "@/store";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { formatDistanceToNow } from "date-fns";
import { parseCSVsClientSide } from "@/lib/csvParser";

// ── Dummy seed data (used when no CSVs uploaded) ──────────────────────────────
const DUMMY: NormalizedWorkspaceData = {
    departments: [{ name: "Engineering" }, { name: "Marketing" }, { name: "Sales" }],
    employees: [
        { name: "Alex Johnson", role: "Engineer", capacity: 100 },
        { name: "Maria Garcia", role: "Designer", capacity: 90 },
        { name: "Sam Lee", role: "Marketing Lead", capacity: 95 },
        { name: "Priya Patel", role: "Sales Executive", capacity: 85 },
        { name: "Tom Wilson", role: "QA Engineer", capacity: 100 },
    ],
    projects: [
        { name: "Platform Relaunch", description: "Full redesign of the core platform", status: "In Progress", startDate: new Date().toISOString(), endDate: new Date(Date.now() + 86400000 * 45).toISOString() },
        { name: "Q2 Marketing Push", description: "Campaign targeting enterprise segment", status: "Not Started", startDate: new Date(Date.now() + 86400000 * 5).toISOString(), endDate: new Date(Date.now() + 86400000 * 30).toISOString() },
        { name: "Sales Pipeline CRM", description: "Integrate CRM with internal tooling", status: "In Progress", startDate: new Date(Date.now() - 86400000 * 5).toISOString(), endDate: new Date(Date.now() + 86400000 * 20).toISOString() },
    ],
    tasks: [
        { title: "Design system audit", projectName: "Platform Relaunch", assigneeName: "Maria Garcia", status: "In Progress", weight: 7, startDate: new Date().toISOString(), endDate: new Date(Date.now() + 86400000 * 10).toISOString() },
        { title: "Backend API migration", projectName: "Platform Relaunch", assigneeName: "Alex Johnson", status: "To Do", weight: 9, startDate: new Date(Date.now() + 86400000 * 2).toISOString(), endDate: new Date(Date.now() + 86400000 * 20).toISOString() },
        { title: "Influencer outreach", projectName: "Q2 Marketing Push", assigneeName: "Sam Lee", status: "To Do", weight: 5, startDate: new Date(Date.now() + 86400000 * 5).toISOString(), endDate: new Date(Date.now() + 86400000 * 15).toISOString() },
        { title: "CRM data migration", projectName: "Sales Pipeline CRM", assigneeName: "Priya Patel", status: "In Progress", weight: 8, startDate: new Date(Date.now() - 86400000 * 2).toISOString(), endDate: new Date(Date.now() + 86400000 * 10).toISOString() },
        { title: "Integration testing", projectName: "Platform Relaunch", assigneeName: "Tom Wilson", status: "To Do", weight: 6, startDate: new Date(Date.now() + 86400000 * 15).toISOString(), endDate: new Date(Date.now() + 86400000 * 25).toISOString() },
    ],
    transactions: [
        { Date: new Date(Date.now() - 86400000 * 10).toISOString().split("T")[0], Amount: 85000, Type: "Revenue", Category: "Enterprise Sales" },
        { Date: new Date(Date.now() - 86400000 * 8).toISOString().split("T")[0], Amount: 12000, Type: "Expense", Category: "Cloud Infrastructure" },
        { Date: new Date(Date.now() - 86400000 * 5).toISOString().split("T")[0], Amount: 45000, Type: "Revenue", Category: "SaaS Subscriptions" },
        { Date: new Date(Date.now() - 86400000 * 3).toISOString().split("T")[0], Amount: 8500, Type: "Expense", Category: "Marketing" },
        { Date: new Date(Date.now() - 86400000 * 1).toISOString().split("T")[0], Amount: 120000, Type: "Revenue", Category: "Enterprise Sales" },
    ],
};

export default function WorkspacesPage() {
    const { workspaces, addWorkspace, setActiveWorkspaceId, bulkIngestWorkspaceData } = useAppStore();
    const { setUserRole, setWorkspaceData } = useWorkspace();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    const selectingRef = useRef(false);

    // Modal state
    const [step, setStep] = useState<1 | 2>(1);
    const [isCreating, setIsCreating] = useState(false);
    const [newWsName, setNewWsName] = useState("");
    const [newWsRole, setNewWsRole] = useState<"Manager" | "CEO" | "Employee">("Manager");
    const [pendingWsId, setPendingWsId] = useState<string | null>(null);

    // CSV state
    const [csvFiles, setCsvFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processResult, setProcessResult] = useState<"success" | "error" | "dummy" | null>(null);
    const [processMsg, setProcessMsg] = useState("");
    const fileRef = useRef<HTMLInputElement>(null);

    const handleSelectWorkspace = (id: string) => {
        if (selectingRef.current) return;
        selectingRef.current = true;
        setActiveWorkspaceId(id);
        router.push("/dashboard");
        setTimeout(() => { selectingRef.current = false; }, 500);
    };

    // Step 1: create workspace record, advance to CSV step
    const handleStep1 = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newWsName.trim()) return;
        const colors = ["from-blue-500 to-indigo-500", "from-red-500 to-orange-500", "from-emerald-500 to-teal-500", "from-purple-500 to-pink-500", "from-cyan-500 to-blue-500"];
        addWorkspace({
            name: newWsName,
            role: newWsRole,
            color: colors[Math.floor(Math.random() * colors.length)],
        });
        // The last added workspace will be the one we just created
        const latest = useAppStore.getState().workspaces.at(-1);
        if (latest) setPendingWsId(latest.id);
        setStep(2);
    };

    const addFiles = (incoming: FileList | null) => {
        if (!incoming) return;
        const valid = Array.from(incoming).filter(f => f.name.endsWith('.csv') || f.type === 'text/csv' || f.type === 'application/vnd.ms-excel');
        setCsvFiles(prev => [...prev, ...valid]);
    };

    // Step 2a: process CSVs via LLM
    const handleIngest = async () => {
        if (!pendingWsId) return;
        setIsProcessing(true);
        setProcessResult(null);
        setProcessMsg('Parsing CSV files...');

        try {
            let normalized: NormalizedWorkspaceData;

            // ── No files: use demo data ──────────────────────────────────
            if (csvFiles.length === 0) {
                normalized = DUMMY;
                setProcessMsg(`No CSVs uploaded — loaded demo data: ${DUMMY.employees.length} employees, ${DUMMY.projects.length} projects.`);
                setProcessResult('dummy');
                finalize(normalized);
                return;
            }

            // ── STEP 1: Client-side parse (instant, no API) ──────────────
            const csvContents = await Promise.all(csvFiles.map(f => f.text()));
            const clientParsed = parseCSVsClientSide(csvContents);
            const clientHasData = clientParsed.employees.length > 0 || clientParsed.projects.length > 0 || clientParsed.tasks.length > 0;

            setProcessMsg(`Client parsed: ${clientParsed.employees.length} employees, ${clientParsed.projects.length} projects, ${clientParsed.tasks.length} tasks. Enhancing with AI...`);

            // ── STEP 2: Gemini enhancement via SSE ────────────────────────
            let geminiSucceeded = false;
            try {
                const res = await fetch('/api/normalize-csv', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ csvContents }),
                    signal: AbortSignal.timeout(90_000), // 90s max (covers 4 retries)
                });

                if (res.body) {
                    const reader = res.body.getReader();
                    const decoder = new TextDecoder();
                    let buffer = '';

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        buffer += decoder.decode(value, { stream: true });

                        // Parse SSE events from buffer
                        const events = buffer.split('\n\n');
                        buffer = events.pop() || '';

                        for (const event of events) {
                            // Each SSE event can have multiple lines; only 'data:' lines carry JSON
                            for (const line of event.split('\n')) {
                                if (!line.startsWith('data: ')) continue;
                                const jsonStr = line.slice(6).trim(); // strip 'data: '
                                if (!jsonStr) continue;
                                try {
                                    const msg = JSON.parse(jsonStr);

                                    if (msg.status === 'processing') {
                                        setProcessMsg('AI normalizing data...');
                                    } else if (msg.status === 'retrying') {
                                        const secs = Math.round((msg.waitMs || 5000) / 1000);
                                        setProcessMsg(`Rate limited — retrying in ${secs}s (attempt ${(msg.attempt ?? 0) + 1}/4)...`);
                                    } else if (msg.status === 'done' && msg.result) {
                                        normalized = msg.result;
                                        const r = msg.result;
                                        setProcessMsg(`AI extracted: ${r.employees.length} employees, ${r.projects.length} projects, ${r.tasks.length} tasks, ${r.transactions.length} transactions.`);
                                        setProcessResult('success');
                                        geminiSucceeded = true;
                                    } else if (msg.status === 'error') {
                                        console.warn('[normalize-csv] Gemini error:', msg.error);
                                    }
                                } catch (parseErr) {
                                    // skip malformed JSON lines silently
                                }
                            }
                        }

                        if (geminiSucceeded) break;
                    }
                }
            } catch (fetchErr: any) {
                console.warn('[normalize-csv] Gemini fetch failed:', fetchErr.message);
            }

            // ── STEP 3: Fallback to client-side if Gemini failed ─────────
            if (!geminiSucceeded) {
                normalized = clientHasData ? clientParsed : DUMMY;
                if (clientHasData) {
                    setProcessMsg(`AI unavailable — using client-parsed data: ${clientParsed.employees.length} employees, ${clientParsed.projects.length} projects, ${clientParsed.tasks.length} tasks.`);
                    setProcessResult('dummy');
                } else {
                    setProcessMsg('Could not parse CSV — loaded demo data instead.');
                    setProcessResult('dummy');
                }
            }

            finalize(normalized!);

        } catch (err: any) {
            setProcessMsg(err.message || 'An error occurred');
            setProcessResult('error');
            setIsProcessing(false);
        }
    };

    const finalize = (normalized: NormalizedWorkspaceData) => {
        if (!pendingWsId) return;
        bulkIngestWorkspaceData(pendingWsId, normalized);
        setWorkspaceData(newWsName, pendingWsId, normalized.transactions as any);
        setUserRole(newWsRole as any);
        setIsProcessing(false);
    };


    // Step 2b: finish — set active workspace and navigate
    const handleFinish = () => {
        if (!pendingWsId) return;
        setActiveWorkspaceId(pendingWsId);
        router.push("/dashboard");
    };

    const resetModal = () => {
        setIsCreating(false);
        setStep(1);
        setNewWsName("");
        setNewWsRole("Manager");
        setCsvFiles([]);
        setProcessResult(null);
        setProcessMsg("");
        setPendingWsId(null);
    };

    return (
        <div className="min-h-screen bg-[var(--color-background)] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background */}
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
                                <span suppressHydrationWarning>
                                    Last active: {mounted && ws.lastActive ? formatDistanceToNow(new Date(ws.lastActive), { addSuffix: true }) : '—'}
                                </span>
                                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                            </div>
                        </motion.div>
                    ))}

                    {/* Create New Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 }}
                        onClick={() => router.push("/onboarding")}
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

            {/* ── Creation Modal ── */}
            <AnimatePresence>
                {isCreating && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={resetModal}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Step indicator */}
                            <div className="flex border-b border-[var(--color-border)]">
                                {["Workspace Details", "Import Data"].map((label, i) => (
                                    <div key={i} className={`flex-1 py-3 text-center text-xs font-semibold transition-colors ${step === i + 1 ? "text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]" : "text-gray-500"}`}>
                                        {i + 1}. {label}
                                    </div>
                                ))}
                            </div>

                            <button onClick={resetModal} className="absolute top-3 right-4 text-gray-400 hover:text-white z-10">
                                <X className="w-5 h-5" />
                            </button>

                            {/* ── STEP 1: Name + Role ── */}
                            {step === 1 && (
                                <div className="p-6">
                                    <h2 className="text-xl font-bold mb-5">New Workspace</h2>
                                    <form onSubmit={handleStep1} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">Company / Workspace Name</label>
                                            <input
                                                type="text" value={newWsName} onChange={e => setNewWsName(e.target.value)}
                                                className="w-full bg-white/5 border border-[var(--color-border)] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                                                placeholder="e.g. Acme Corp" autoFocus required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">Your Role</label>
                                            <select
                                                value={newWsRole} onChange={e => setNewWsRole(e.target.value as any)}
                                                className="w-full bg-[#111] border border-[var(--color-border)] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors appearance-none"
                                            >
                                                <option value="Manager">Manager</option>
                                                <option value="CEO">CEO</option>
                                                <option value="Employee">Employee</option>
                                            </select>
                                        </div>
                                        <button type="submit" className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/80 text-white font-medium py-2.5 rounded-lg transition-colors mt-2 flex items-center justify-center gap-2">
                                            Next: Import Data <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* ── STEP 2: CSV Upload ── */}
                            {step === 2 && (
                                <div className="p-6 space-y-5">
                                    <div>
                                        <h2 className="text-xl font-bold">Import Your Data</h2>
                                        <p className="text-sm text-gray-400 mt-1">Upload any CSV files — employee lists, project sheets, financial exports. Our AI will normalize everything automatically.</p>
                                    </div>

                                    {/* Drop zone */}
                                    <div
                                        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                                        onDragLeave={() => setIsDragging(false)}
                                        onDrop={e => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files); }}
                                        onClick={() => fileRef.current?.click()}
                                        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragging ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10" : "border-white/10 hover:border-white/20 hover:bg-white/5"}`}
                                    >
                                        <input ref={fileRef} type="file" accept=".csv" multiple className="hidden" onChange={e => addFiles(e.target.files)} />
                                        <Upload className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                                        <p className="text-sm font-medium text-gray-300">Drop CSV files here or <span className="text-[var(--color-primary)]">browse</span></p>
                                        <p className="text-xs text-gray-600 mt-1">Employees, projects, financials — any format accepted</p>
                                    </div>

                                    {/* File list */}
                                    {csvFiles.length > 0 && (
                                        <div className="space-y-2">
                                            {csvFiles.map((f, i) => (
                                                <div key={i} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                                                    <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                                                    <span className="text-sm text-gray-200 flex-1 truncate">{f.name}</span>
                                                    <span className="text-xs text-gray-500">{(f.size / 1024).toFixed(1)} KB</span>
                                                    <button onClick={() => setCsvFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-gray-600 hover:text-red-400 transition-colors">
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Result message */}
                                    {processResult && (
                                        <div className={`flex items-start gap-3 rounded-xl p-3 border text-sm ${processResult === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" :
                                            processResult === "dummy" ? "bg-blue-500/10   border-blue-500/20   text-blue-300" :
                                                "bg-red-500/10 border-red-500/20 text-red-300"
                                            }`}>
                                            {processResult === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> :
                                                processResult === "dummy" ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> :
                                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                                            {processMsg}
                                        </div>
                                    )}

                                    {/* Action buttons */}
                                    <div className="flex gap-3 pt-1">
                                        {processResult === null || processResult === "error" ? (
                                            <>
                                                <button
                                                    onClick={handleIngest}
                                                    disabled={isProcessing}
                                                    className="flex-1 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/80 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 text-sm"
                                                >
                                                    {isProcessing
                                                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Normalizing with AI...</>
                                                        : csvFiles.length > 0
                                                            ? <><Upload className="w-4 h-4" /> Process {csvFiles.length} File{csvFiles.length > 1 ? 's' : ''}</>
                                                            : <> Use Demo Data</>
                                                    }
                                                </button>
                                                <button onClick={handleIngest} disabled={isProcessing} className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white rounded-lg text-sm transition-all">
                                                    Skip
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={handleFinish}
                                                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 text-sm"
                                            >
                                                <CheckCircle2 className="w-4 h-4" /> Open Workspace
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
