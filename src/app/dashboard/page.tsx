"use client";
import { CEOView } from "@/components/dashboard/CEOView";
import { ManagerView } from "@/components/dashboard/ManagerView";
import { EmployeeView } from "@/components/dashboard/EmployeeView";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";

export default function DashboardPage() {
    const { userRole } = useWorkspace();

    return (
        <div className="h-full">
            {userRole === 'CEO' && <CEOView />}
            {userRole === 'Manager' && <ManagerView />}
            {userRole === 'Employee' && <EmployeeView />}
        </div>
    );
}
