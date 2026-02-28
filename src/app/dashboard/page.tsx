"use client";
import { CEOView } from "@/components/dashboard/CEOView";
import { ManagerView } from "@/components/dashboard/ManagerView";
import { EmployeeView } from "@/components/dashboard/EmployeeView";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";

export default function DashboardPage() {
    // ... inside DashboardPage ...
    const { userRole, setWorkspaceData, workspaceName, managerId } = useWorkspace();

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
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
            // Update Context
            setWorkspaceData(workspaceName, managerId, transactions);
        };
        reader.readAsText(file);

        // Reset input
        e.target.value = '';
    };

    return (
        <div className="h-full">
            {/* Header */}
            <header className="flex justify-between items-center mb-6 bg-[var(--color-card)] p-4 rounded-2xl border border-[var(--color-border)]">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        {userRole} Dashboard
                    </h2>
                    <p className="text-sm text-gray-400">
                        {userRole === 'CEO' && 'Global operational view'}
                        {userRole === 'Manager' && 'Team oversight and resource allocation'}
                        {userRole === 'Employee' && 'Personal KPIs and contribution log'}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <label className="cursor-pointer bg-white/5 hover:bg-white/10 border border-[var(--color-border)] px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 text-white">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Upload CSV
                        <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                    </label>
                    <div className="text-sm font-medium text-gray-400 border border-[var(--color-border)] px-4 py-2 rounded-lg">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </div>
                </div>
            </header>

            {/* Render explicit view based on role */}
            <div className="h-full">
                {userRole === 'CEO' && <CEOView />}
                {userRole === 'Manager' && <ManagerView />}
                {userRole === 'Employee' && <EmployeeView />}
            </div>
        </div>
    );
}
