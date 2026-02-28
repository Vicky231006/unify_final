"use client";
import { ProjectTaskManagement } from "@/components/dashboard/ProjectTaskManagement";

// /dashboard/projects — Manager project/Gantt view (own route so sidebar highlights correctly)
export default function ProjectsPage() {
    return (
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-6 rounded-2xl h-[calc(100vh-100px)]">
            <ProjectTaskManagement />
        </div>
    );
}
