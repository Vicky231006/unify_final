"use client";
import React, { useState } from 'react';
import { useAppStore } from '@/store';
import { calculateBurnoutRisk, calculatePerformanceScore } from '@/lib/analytics';
import { ProjectTaskManagement } from './ProjectTaskManagement';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { formatDistanceToNow, parseISO } from 'date-fns';

export function ManagerView() {
    const { employees, tasks, projects, activityLogs, activeWorkspaceId } = useAppStore();

    const activeEmployees = employees.filter(e => e.workspaceId === activeWorkspaceId);

    // Calculate burnout for each employee
    const burnoutData = activeEmployees.map(emp => {
        const riskData = calculateBurnoutRisk(emp, tasks);
        return {
            ...emp,
            burnoutScore: riskData.score,
            riskLevel: riskData.risk,
            log: riskData.log
        };
    });

    // Calculate performance for each employee
    const performanceData = activeEmployees.map(emp => {
        const perfData = calculatePerformanceScore(emp, tasks);
        return {
            ...emp,
            score: perfData.score,
            log: perfData.log
        };
    });

    // Mock chart data for Burnout trend over time (simplified)
    const chartData = [
        { week: 'W1', avgBurnout: 20 },
        { week: 'W2', avgBurnout: 30 },
        { week: 'W3', avgBurnout: Math.round(burnoutData.reduce((acc, emp) => acc + emp.burnoutScore, 0) / (burnoutData.length || 1)) },
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-160px)] overflow-y-auto custom-scrollbar pr-2 pb-4">

            {/* Project & Task Management (Gantt and Modals included) */}
            <div className="col-span-1 lg:col-span-3 bg-[var(--color-card)] border border-[var(--color-border)] p-6 rounded-2xl min-h-[400px]">
                <ProjectTaskManagement />
            </div>

            {/* Performance Scoring & Resource Allocation */}
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-6 rounded-2xl flex flex-col gap-4 col-span-1 lg:col-span-1 h-96 overflow-y-auto custom-scrollbar">
                <h3 className="font-semibold mb-2">Resource Performance</h3>
                <div className="flex-1 space-y-3">
                    {performanceData.length === 0 ? <p className="text-gray-500 text-sm">No employees found.</p> : null}
                    {performanceData.map((user) => (
                        <div key={user.id} className="group relative flex flex-col p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-help">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white uppercase">{user.name[0]}</div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium">{user.name}</p>
                                    <p className="text-xs text-gray-400">{user.role}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-emerald-400">{user.score}/100</p>
                                    <p className="text-[10px] text-gray-500">Score</p>
                                </div>
                            </div>

                            {/* Hover tooltip for concrete reasoning */}
                            <div className="absolute top-14 left-0 w-full z-10 hidden group-hover:block bg-black/90 p-2 rounded text-[10px] text-gray-300 pointer-events-none shadow-xl border border-white/10">
                                <p className="font-bold text-white border-b border-white/20 mb-1 pb-1">Calculation Reasoning:</p>
                                {user.log.map((entry, idx) => <p key={idx}>• {entry}</p>)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Employee Burnout Forecast */}
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-6 rounded-2xl col-span-1 lg:col-span-1 h-96 overflow-y-auto custom-scrollbar flex flex-col">
                <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    Burnout Risk (Concrete Backing)
                </h3>
                <div className="flex-1 space-y-3">
                    {burnoutData.length === 0 ? <p className="text-gray-500 text-sm">No employees found.</p> : null}
                    {burnoutData.map(emp => (
                        <div key={emp.id} className="group relative p-3 rounded-lg bg-white/5 border border-white/5 text-sm">
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-medium">{emp.name}</span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${emp.riskLevel === 'High' ? 'bg-red-500/20 text-red-500' : emp.riskLevel === 'Medium' ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'}`}>
                                    {emp.riskLevel} Risk
                                </span>
                            </div>
                            <div className="w-full bg-black/40 rounded-full h-1 mt-2">
                                <div className={`h-full rounded-full ${emp.riskLevel === 'High' ? 'bg-red-500' : emp.riskLevel === 'Medium' ? 'bg-orange-500' : 'bg-green-500'}`} style={{ width: `${Math.min(emp.burnoutScore, 100)}%` }} />
                            </div>

                            {/* Hover tooltip for concrete reasoning */}
                            <div className="absolute top-12 left-0 w-full z-10 hidden group-hover:block bg-black/95 p-3 rounded text-xs text-gray-300 pointer-events-none shadow-xl border border-white/10">
                                <p className="font-bold text-white border-b border-white/20 mb-1 pb-1">Calculation Logic:</p>
                                {emp.log.map((entry, idx) => <p key={idx} className="mb-0.5">• {entry}</p>)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Activity Logs */}
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-6 rounded-2xl col-span-1 lg:col-span-1 h-96 overflow-y-auto custom-scrollbar flex flex-col">
                <h3 className="font-semibold mb-2 text-sm">Workspace Activity Logs</h3>
                <div className="flex-1 space-y-4 pt-2">
                    {activityLogs.filter(log => log.workspaceId === activeWorkspaceId).length === 0 ? (
                        <p className="text-gray-500 text-sm text-center mt-4">No recent activity.</p>
                    ) : (
                        activityLogs.filter(log => log.workspaceId === activeWorkspaceId).slice(0, 15).map(log => (
                            <div key={log.id} className="flex gap-3 text-sm">
                                <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] mt-1.5 shrink-0" />
                                <div>
                                    <p className="text-gray-200">{log.action}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{formatDistanceToNow(parseISO(log.timestamp), { addSuffix: true })}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

        </div>
    );
}
