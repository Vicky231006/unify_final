"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, Network, BarChart3, UploadCloud, Building2, MapPin, Settings, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";

export function Onboarding() {
    const [activeTab, setActiveTab] = useState<'org' | 'fin'>('org');
    const [isLoading, setIsLoading] = useState(false);

    // Org Fields
    const [wsName, setWsName] = useState("");
    const [managerId, setManagerId] = useState("");
    const [location, setLocation] = useState("");

    // Validation
    const [errors, setErrors] = useState<{ wsName?: string, location?: string }>({});

    // Fin Fields
    const [csvFile, setCsvFile] = useState<File | null>(null);

    const { setWorkspaceData } = useWorkspace();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleNextTab = () => {
        const newErrors: { wsName?: string, location?: string } = {};
        if (!wsName.trim()) newErrors.wsName = "Organisation Name is required.";
        if (!location.trim()) newErrors.location = "Primary Location is required.";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        setActiveTab('fin');
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setCsvFile(file);
    };

    const finishOnboarding = (skipCsv: boolean) => {
        const finalWsName = wsName.trim() || "New Workspace";
        const finalManagerId = managerId.trim() || "ADM-001";

        if (skipCsv || !csvFile) {
            setWorkspaceData(finalWsName, finalManagerId, []);
            setIsLoading(true);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const lines = text.split('\n');
            const transactions = [];

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

            setWorkspaceData(finalWsName, finalManagerId, transactions);
            setIsLoading(true);
        };
        reader.readAsText(csvFile);
    };

    if (isLoading) {
        return <LoadingState onComplete={() => router.push('/dashboard')} />;
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 relative z-10 pt-20">
            <div className="w-full max-w-3xl bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                {/* Tabs Header */}
                <div className="flex border-b border-[var(--color-border)] pt-4 px-8 gap-8 bg-black/20">
                    <button
                        onClick={() => setActiveTab('org')}
                        className={`pb-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'org' ? 'border-[var(--color-primary)] text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                    >
                        Organisation <span className="text-xs px-2 py-0.5 rounded-full bg-white/10">1/2</span>
                    </button>
                    <button
                        onClick={() => {
                            if (!wsName.trim() || !location.trim()) {
                                handleNextTab(); // trigger validation
                                return;
                            }
                            setActiveTab('fin');
                        }}
                        className={`pb-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'fin' ? 'border-[var(--color-primary)] text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                    >
                        Financial Operations <span className="text-xs px-2 py-0.5 rounded-full bg-white/10">2/2</span>
                    </button>
                </div>

                {/* Tab Content */}
                <div className="p-8">
                    <AnimatePresence mode="wait">
                        {activeTab === 'org' && (
                            <motion.div key="org" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">

                                {/* ListItem 1 */}
                                <div className="flex gap-4">
                                    <div className="h-10 w-10 shrink-0 rounded-lg flex items-center justify-center border border-[var(--color-border)] bg-white/5">
                                        <Building2 className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-base font-semibold">Add Organisation Details</h3>
                                        <p className="text-sm text-gray-400 mb-4">Add your organisation's name and manager identity.</p>
                                        <div className="space-y-4 max-w-md">
                                            <div>
                                                <input value={wsName} onChange={e => { setWsName(e.target.value); if (errors.wsName) setErrors({ ...errors, wsName: undefined }) }} className={`w-full bg-[var(--color-background)] border ${errors.wsName ? 'border-red-500' : 'border-[var(--color-border)]'} rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-[var(--color-primary)]`} placeholder="Organisation Name *" />
                                                {errors.wsName && <p className="text-red-500 text-xs mt-1">{errors.wsName}</p>}
                                            </div>
                                            <div>
                                                <input value={managerId} onChange={e => setManagerId(e.target.value)} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-[var(--color-primary)]" placeholder="Manager ID (e.g. ADM-001)" />
                                                <p className="text-xs text-gray-500 mt-1">Leave blank to default to ADM-001.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ListItem 2 */}
                                <div className="flex gap-4 border-t border-[var(--color-border)] pt-8">
                                    <div className="h-10 w-10 shrink-0 rounded-lg flex items-center justify-center border border-[var(--color-border)] bg-white/5">
                                        <MapPin className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-base font-semibold">Add Business Locations</h3>
                                        <p className="text-sm text-gray-400 mb-4">Manage your organisation operations across regions.</p>
                                        <div className="max-w-md">
                                            <input value={location} onChange={e => { setLocation(e.target.value); if (errors.location) setErrors({ ...errors, location: undefined }) }} className={`w-full bg-[var(--color-background)] border ${errors.location ? 'border-red-500' : 'border-[var(--color-border)]'} rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-[var(--color-primary)]`} placeholder="Primary Location (e.g. New York) *" />
                                            {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button onClick={handleNextTab} className="bg-[var(--color-primary)] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-opacity-90 transition-all flex items-center gap-2">
                                        Save & Continue
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'fin' && (
                            <motion.div key="fin" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">

                                <div className="flex gap-4">
                                    <div className="h-10 w-10 shrink-0 rounded-lg flex items-center justify-center border border-[var(--color-border)] bg-white/5">
                                        <Settings className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-base font-semibold">Integrate Financial Data</h3>
                                        <p className="text-sm text-gray-400 mb-6">Upload an existing CSV ledger to populate your dashboard immediately, or start afresh.</p>

                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className={`max-w-md border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${csvFile ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5' : 'border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-white/5'}`}
                                        >
                                            <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                                            <UploadCloud className={`w-6 h-6 ${csvFile ? 'text-[var(--color-primary)]' : 'text-gray-400'}`} />
                                            <div className="text-center">
                                                {csvFile ? (
                                                    <div className="flex flex-col items-center">
                                                        <span className="font-semibold text-[var(--color-primary)] flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> {csvFile.name}</span>
                                                        <span className="text-xs text-gray-400 mt-1">{(csvFile.size / 1024).toFixed(2)} KB</span>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span className="font-semibold text-gray-300">Click to upload CSV</span>
                                                        <p className="text-xs text-gray-500 mt-1">Columns req: Date, Amount, Type, Category</p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-8 border-t border-[var(--color-border)]">
                                    <button onClick={() => finishOnboarding(true)} className="text-gray-400 hover:text-white px-4 py-2 text-sm font-medium transition-colors">
                                        Start Afresh (Skip CSV)
                                    </button>
                                    <button onClick={() => finishOnboarding(false)} disabled={!csvFile} className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${csvFile ? 'bg-[var(--color-primary)] text-white hover:bg-opacity-90' : 'bg-white/5 text-gray-500 cursor-not-allowed'}`}>
                                        Compile Workspace
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
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
            className="flex flex-col items-center justify-center p-24 gap-8 text-center bg-[var(--color-card)] max-w-md mx-auto rounded-2xl border border-[var(--color-border)]"
        >
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
