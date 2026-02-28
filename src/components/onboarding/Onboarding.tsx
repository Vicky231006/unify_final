"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, Network, BarChart3, ChevronRight, ArrowRight, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";

export function Onboarding() {
    const [step, setStep] = useState(1);
    const [departments, setDepartments] = useState([{ id: 1 }]);
    const [wsName, setWsName] = useState("");
    const [managerId, setManagerId] = useState("");
    const [csvFile, setCsvFile] = useState<File | null>(null);

    const { setWorkspaceData } = useWorkspace();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleNext = () => {
        if (step < 5) setStep(step + 1);
    };

    const addDepartment = () => {
        setDepartments([...departments, { id: Date.now() }]);
    };

    const removeDepartment = (id: number) => {
        setDepartments(departments.filter(d => d.id !== id));
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setCsvFile(file);
    };

    const parseCSVAndSubmit = () => {
        if (!csvFile) {
            // Send empty if no file
            setWorkspaceData(wsName || "New Workspace", managerId || "ADM-001", []);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            // Simple CSV parser
            const lines = text.split('\n');
            const transactions = [];

            // Assuming header: Date,Amount,Type,Category
            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;
                const [date, amountStr, type, category] = lines[i].split(',').map(s => s.trim());
                transactions.push({
                    Date: date,
                    Amount: parseFloat(amountStr) || 0,
                    Type: type as 'Revenue' | 'Expense',
                    Category: category
                });
            }

            setWorkspaceData(wsName || "New Workspace", managerId || "ADM-001", transactions);
        };
        reader.readAsText(csvFile);
    };

    const currentStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <motion.div key="step1" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="flex flex-col gap-6">
                        <div>
                            <h2 className="text-2xl font-bold mb-2">The Identity</h2>
                            <p className="text-gray-400 text-sm">Let's start with who you are.</p>
                        </div>
                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="text-sm text-gray-400 mb-1 block">Organization Name</label>
                                <input value={wsName} onChange={e => setWsName(e.target.value)} type="text" className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg p-3 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors" placeholder="Acme Corp" />
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 mb-1 block">Your Manager ID (Optional)</label>
                                <input value={managerId} onChange={e => setManagerId(e.target.value)} type="text" className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg p-3 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors" placeholder="e.g. ADM-001" />
                            </div>
                        </div>
                        <button onClick={handleNext} className="mt-4 w-full bg-[var(--color-primary)] text-white p-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-opacity-90 transition-opacity cursor-pointer">
                            Continue <ChevronRight className="w-4 h-4" />
                        </button>
                    </motion.div>
                );
            case 2:
                return (
                    <motion.div key="step2" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="flex flex-col gap-6">
                        <div>
                            <h2 className="text-2xl font-bold mb-2">The Team</h2>
                            <p className="text-gray-400 text-sm">Map out your departments.</p>
                        </div>
                        <div className="flex flex-col gap-4 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
                            {departments.map((dept, index) => (
                                <div key={dept.id} className="flex gap-2 items-end">
                                    <div className="flex-1">
                                        <label className="text-sm text-gray-400 mb-1 block">{index === 0 ? "Department Name" : "\u00A0"}</label>
                                        <input type="text" className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg p-3 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors" placeholder="e.g. Engineering" />
                                    </div>
                                    <div className="w-24">
                                        <label className="text-sm text-gray-400 mb-1 block">{index === 0 ? "Headcount" : "\u00A0"}</label>
                                        <input type="number" className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg p-3 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors" placeholder="10" />
                                    </div>
                                    {departments.length > 1 && (
                                        <button onClick={() => removeDepartment(dept.id)} className="p-3 text-gray-500 hover:text-red-400 transition-colors shrink-0">✕</button>
                                    )}
                                </div>
                            ))}
                            <button onClick={addDepartment} className="text-[var(--color-primary)] text-sm font-medium self-start hover:underline cursor-pointer mt-2">+ Add another department</button>
                        </div>
                        <button onClick={handleNext} className="mt-4 w-full bg-[var(--color-primary)] text-white p-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-opacity-90 transition-opacity cursor-pointer">
                            Continue <ChevronRight className="w-4 h-4" />
                        </button>
                    </motion.div>
                );
            case 3:
                return (
                    <motion.div key="step3" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="flex flex-col gap-6">
                        <div>
                            <h2 className="text-2xl font-bold mb-2">The Goals</h2>
                            <p className="text-gray-400 text-sm">Select primary pain points.</p>
                        </div>
                        <div className="flex flex-col gap-3">
                            {['Employee Burnout', 'Project Delays', 'Asset Loss', 'Siloed Knowledge'].map((point) => (
                                <label key={point} className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-border)] cursor-pointer hover:border-[var(--color-primary)] transition-colors">
                                    <input type="checkbox" className="w-4 h-4 accent-[var(--color-primary)]" />
                                    <span>{point}</span>
                                </label>
                            ))}
                        </div>
                        <button onClick={handleNext} className="mt-4 w-full bg-[var(--color-primary)] text-white p-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-opacity-90 transition-opacity cursor-pointer">
                            Continue <ChevronRight className="w-4 h-4" />
                        </button>
                    </motion.div>
                );
            case 4:
                return (
                    <motion.div key="step4" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="flex flex-col gap-6">
                        <div>
                            <h2 className="text-2xl font-bold mb-2">Ingest Data</h2>
                            <p className="text-gray-400 text-sm">Upload financial records for real-time analytics.</p>
                        </div>

                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${csvFile ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5' : 'border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-white/5'}`}
                        >
                            <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                            <div className="w-12 h-12 rounded-full bg-white/5 flex flex-col items-center justify-center">
                                <UploadCloud className={`w-6 h-6 ${csvFile ? 'text-[var(--color-primary)]' : 'text-gray-400'}`} />
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
                return <LoadingState onComplete={() => router.push('/dashboard')} />;
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
                <AnimatePresence mode="wait">
                    {currentStepContent()}
                </AnimatePresence>
            </div>
        </div>
    );
}

function LoadingState({ onComplete }: { onComplete: () => void }) {
    const [loadingText, setLoadingText] = useState("Analyzing silos...");
    const [activeIcon, setActiveIcon] = useState(0);

    useEffect(() => {
        const timeouts = [
            setTimeout(() => { setLoadingText("Mapping dependencies..."); setActiveIcon(1); }, 2000),
            setTimeout(() => { setLoadingText("Ready."); setActiveIcon(2); }, 4000),
            setTimeout(() => { onComplete(); }, 5500)
        ];
        return () => timeouts.forEach(clearTimeout);
    }, [onComplete]);

    return (
        <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12 gap-8 text-center"
        >
            <div className="relative w-24 h-24 flex items-center justify-center">
                {/* Animated icons layer */}
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
                    <motion.p
                        key={loadingText}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-lg font-medium text-gray-300"
                    >
                        {loadingText}
                    </motion.p>
                </AnimatePresence>
            </div>
            <h3 className="text-[var(--color-primary)] font-bold tracking-widest uppercase text-sm">Cooking your Workspace</h3>
        </motion.div>
    );
}
