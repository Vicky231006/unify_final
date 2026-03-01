/**
 * useWorkspaceMetrics
 * ──────────────────
 * Single source of truth for all dashboard metric calculations.
 * Reads directly from the Zustand store — so data flows from CSV ingestion
 * through bulkIngestWorkspaceData straight into every dashboard view.
 *
 * FORMULAS (all industry-standard):
 *
 * ── Financial ──────────────────────────────────────────────────────────────
 * Revenue               = SUM of all Revenue transactions
 * Expense               = SUM of all Expense transactions
 * Net Income            = Revenue - Expense
 * Gross Margin %        = (Revenue - Expense) / Revenue * 100
 * Revenue Forecast      = last-30d run-rate * 3   (simple linear projection)
 *
 * ── Task / Productivity ────────────────────────────────────────────────────
 * On-Time Rate %        = Done tasks completed on or before endDate / Total Done tasks
 * Task Completion Rate  = Done tasks / Total tasks
 * Team Velocity (pts)   = SUM of weight of Done tasks in last 7 days
 * Overdue Rate %        = Overdue tasks / Total open tasks
 *
 * ── Org Health (composite) ─────────────────────────────────────────────────
 * Org Health % = 0.40 * On-Time Rate
 *             + 0.30 * (1 - Overdue Rate)
 *             + 0.20 * (1 - AvgBurnoutScore/100)
 *             + 0.10 * Gross Margin normalised to [0,1]
 *
 * ── Risk Score ─────────────────────────────────────────────────────────────
 * Risk = 0.40 * Overdue Rate
 *      + 0.30 * (High Burnout Employees / Total Employees)
 *      + 0.20 * (Projects Behind Schedule / Total Projects)
 *      + 0.10 * (Expense / Revenue) clamped [0,1]
 *
 * ── Per-Department ─────────────────────────────────────────────────────────
 * Each department: task completion %, avg burnout, headcount
 */

import { useMemo } from 'react';
import { useAppStore, Employee, Task, Project } from '@/store';
import { useWorkspace } from '@/components/providers/WorkspaceProvider';
import { parseISO, isBefore, isAfter, subDays, startOfDay } from 'date-fns';
import { calculateBurnoutRisk } from './analytics';

// ── Types ──────────────────────────────────────────────────────────────────
export type OrgMetrics = {
    // Financial
    totalRevenue: number;
    totalExpense: number;
    netIncome: number;
    grossMarginPct: number;
    revenueForecast: number;
    revenueStr: string;
    forecastStr: string;

    // Task
    totalTasks: number;
    doneTasks: number;
    openTasks: number;
    overdueTasks: number;
    completionRate: number;   // 0-100
    onTimeRate: number;   // 0-100
    teamVelocity: number;   // weight pts in last 7d
    overdueRate: number;   // 0-100

    // People
    totalEmployees: number;
    avgBurnout: number;   // 0-100
    highBurnoutCount: number;

    // Projects
    totalProjects: number;
    behindProjects: number;   // projects where today > endDate and not Completed

    // Composite
    orgHealthPct: number;   // 0-100
    riskScore: number;   // 0-100
    riskLabel: 'Low' | 'Medium' | 'High';
    productivityGrowth: number; // % change week-over-week velocity

    // Charts
    deptStats: Array<{
        name: string;
        completionRate: number;
        avgBurnout: number;
        headcount: number;
        effort: number;  // total task weight assigned
        impact: number;  // done task weight / total weight * 100
    }>;
    weeklyVelocity: Array<{ week: string; velocity: number; target: number }>;
    transactionTrend: Array<{ date: string; revenue: number; expense: number }>;
    transactions: any[];
};

// ── Helpers ────────────────────────────────────────────────────────────────
function formatMoney(v: number): string {
    if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
    if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
    return `$${v.toFixed(0)}`;
}

function clamp(v: number, lo = 0, hi = 100) { return Math.max(lo, Math.min(hi, v)); }

// ── Hook ───────────────────────────────────────────────────────────────────
export function useWorkspaceMetrics(workspaceId: string | null): OrgMetrics {
    const { employees, tasks, projects, departments } = useAppStore();
    const { transactions } = useWorkspace();

    return useMemo<OrgMetrics>(() => {
        if (!workspaceId) return emptyMetrics();

        const now = startOfDay(new Date());
        const day7ago = subDays(now, 7);
        const day14ago = subDays(now, 14);
        const day30ago = subDays(now, 30);

        // ── Filter to workspace ──────────────────────────────────────────
        const wsProjects = projects.filter(p => p.workspaceId === workspaceId);
        const wsProjIds = new Set(wsProjects.map(p => p.id));
        const wsTasks = tasks.filter(t => wsProjIds.has(t.projectId));
        const wsEmps = employees.filter(e => e.workspaceId === workspaceId);
        const wsDepts = departments.filter(d => d.workspaceId === workspaceId);

        // ── Financial: read from WorkspaceContext ────────────────────────
        const txs: Array<{ Date: string; Amount: number; Type: string; Category: string }> = transactions || [];

        const revTxs = txs.filter(t => t.Type === 'Revenue');
        const expTxs = txs.filter(t => t.Type === 'Expense');
        const totalRevenue = revTxs.reduce((s, t) => s + t.Amount, 0);
        const totalExpense = expTxs.reduce((s, t) => s + t.Amount, 0);
        const netIncome = totalRevenue - totalExpense;
        const grossMarginPct = totalRevenue > 0 ? clamp((netIncome / totalRevenue) * 100) : 0;

        // Revenue Forecast = last-30d revenue * (365/30) / 12  → annualized then monthly
        const last30dRev = revTxs
            .filter(t => isAfter(parseISO(t.Date), day30ago))
            .reduce((s, t) => s + t.Amount, 0);
        const revenueForecast = last30dRev > 0 ? last30dRev * (365 / 30) : totalRevenue * 1.15;

        // ── Tasks ────────────────────────────────────────────────────────
        const doneTasks = wsTasks.filter(t => t.status === 'Done');
        const openTasks = wsTasks.filter(t => t.status !== 'Done');
        const overdueTasks = openTasks.filter(t => isBefore(parseISO(t.endDate), now));

        const completionRate = wsTasks.length > 0 ? (doneTasks.length / wsTasks.length) * 100 : 0;
        const overdueRate = openTasks.length > 0 ? (overdueTasks.length / openTasks.length) * 100 : 0;

        // On-time: done tasks where completedDate <= endDate
        const doneOnTime = doneTasks.filter(t =>
            t.completedDate && isBefore(parseISO(t.completedDate), parseISO(t.endDate))
        ).length;
        const onTimeRate = doneTasks.length > 0 ? (doneOnTime / doneTasks.length) * 100 : 100;

        // Team velocity: weight of tasks done in last 7 days
        const teamVelocity = doneTasks
            .filter(t => t.completedDate && isAfter(parseISO(t.completedDate), day7ago))
            .reduce((s, t) => s + t.weight, 0);

        // Previous-week velocity for growth calculation
        const prevVelocity = doneTasks
            .filter(t => t.completedDate && isAfter(parseISO(t.completedDate), day14ago) && isBefore(parseISO(t.completedDate), day7ago))
            .reduce((s, t) => s + t.weight, 0);
        const productivityGrowth = prevVelocity > 0 ? ((teamVelocity - prevVelocity) / prevVelocity) * 100 : 0;

        // ── People ───────────────────────────────────────────────────────
        const burnoutResults = wsEmps.map(e => calculateBurnoutRisk(e, wsTasks));
        const avgBurnout = burnoutResults.length > 0
            ? burnoutResults.reduce((s, r) => s + r.score, 0) / burnoutResults.length
            : 0;
        const highBurnoutCount = burnoutResults.filter(r => r.risk === 'High').length;

        // ── Projects ─────────────────────────────────────────────────────
        const behindProjects = wsProjects.filter(p =>
            p.status !== 'Completed' && isBefore(parseISO(p.endDate), now)
        ).length;

        // ── Composite: Org Health 0-100 ──────────────────────────────────
        const orgHealthPct = clamp(
            0.40 * onTimeRate
            + 0.30 * (100 - overdueRate)
            + 0.20 * (100 - avgBurnout)
            + 0.10 * Math.min(grossMarginPct, 100)
        );

        // ── Composite: Risk 0-100 ────────────────────────────────────────
        const expenseRatio = totalRevenue > 0 ? clamp((totalExpense / totalRevenue) * 100) : 50;
        const projectBehindRatio = wsProjects.length > 0 ? (behindProjects / wsProjects.length) * 100 : 0;
        const riskScore = clamp(
            0.40 * overdueRate
            + 0.30 * (wsEmps.length > 0 ? (highBurnoutCount / wsEmps.length) * 100 : 0)
            + 0.20 * projectBehindRatio
            + 0.10 * expenseRatio
        );
        const riskLabel: 'Low' | 'Medium' | 'High' = riskScore > 65 ? 'High' : riskScore > 35 ? 'Medium' : 'Low';

        // ── Per-Department stats for chart ───────────────────────────────
        const deptStats = (wsDepts.length > 0 ? wsDepts : [{ id: 'all', name: 'All Teams' }]).map(d => {
            const deptEmps = wsDepts.length > 0 ? wsEmps.filter(e => e.departmentId === d.id) : wsEmps;
            const deptEmpIds = new Set(deptEmps.map(e => e.id));
            const deptTasks = wsTasks.filter(t => t.assigneeId && deptEmpIds.has(t.assigneeId));
            const deptDone = deptTasks.filter(t => t.status === 'Done');
            const totalWeight = deptTasks.reduce((s, t) => s + t.weight, 0);
            const doneWeight = deptDone.reduce((s, t) => s + t.weight, 0);
            const deptBurnout = deptEmps.length > 0
                ? deptEmps.map(e => calculateBurnoutRisk(e, wsTasks).score).reduce((a, b) => a + b, 0) / deptEmps.length
                : 0;

            return {
                name: d.name,
                completionRate: deptTasks.length > 0 ? Math.round((deptDone.length / deptTasks.length) * 100) : 0,
                avgBurnout: Math.round(deptBurnout),
                headcount: deptEmps.length,
                effort: totalWeight,
                impact: totalWeight > 0 ? Math.round((doneWeight / totalWeight) * 100) : 0,
            };
        });

        // ── Weekly velocity chart (last 4 weeks) ─────────────────────────
        const weeklyVelocity = [3, 2, 1, 0].map(weeksAgo => {
            const weekStart = subDays(now, (weeksAgo + 1) * 7);
            const weekEnd = subDays(now, weeksAgo * 7);
            const vel = doneTasks
                .filter(t => t.completedDate && isAfter(parseISO(t.completedDate), weekStart) && isBefore(parseISO(t.completedDate), weekEnd))
                .reduce((s, t) => s + t.weight, 0);
            return {
                week: `W-${weeksAgo === 0 ? 'now' : weeksAgo}`,
                velocity: vel,
                target: Math.max(teamVelocity * 0.8, 5),
            };
        });

        // ── Transaction trend (last 30d, weekly buckets) ──────────────────
        const transactionTrend = [3, 2, 1, 0].map(w => {
            const wkStart = subDays(now, (w + 1) * 7);
            const wkEnd = subDays(now, w * 7);
            const rev = revTxs.filter(t => isAfter(parseISO(t.Date), wkStart) && isBefore(parseISO(t.Date), wkEnd)).reduce((s, t) => s + t.Amount, 0);
            const exp = expTxs.filter(t => isAfter(parseISO(t.Date), wkStart) && isBefore(parseISO(t.Date), wkEnd)).reduce((s, t) => s + t.Amount, 0);
            return { date: `W-${w === 0 ? 'now' : w}`, revenue: rev, expense: exp };
        });

        return {
            totalRevenue, totalExpense, netIncome, grossMarginPct,
            revenueForecast,
            revenueStr: totalRevenue > 0 ? formatMoney(totalRevenue) : '—',
            forecastStr: formatMoney(revenueForecast),
            totalTasks: wsTasks.length,
            doneTasks: doneTasks.length,
            openTasks: openTasks.length,
            overdueTasks: overdueTasks.length,
            completionRate: Math.round(completionRate),
            onTimeRate: Math.round(onTimeRate),
            teamVelocity,
            overdueRate: Math.round(overdueRate),
            totalEmployees: wsEmps.length,
            avgBurnout: Math.round(avgBurnout),
            highBurnoutCount,
            totalProjects: wsProjects.length,
            behindProjects,
            orgHealthPct: Math.round(orgHealthPct),
            riskScore: Math.round(riskScore),
            riskLabel,
            productivityGrowth: Math.round(productivityGrowth),
            deptStats,
            weeklyVelocity,
            transactionTrend,
            transactions: txs,
        };
    }, [workspaceId, employees, tasks, projects, departments]);
}

function emptyMetrics(): OrgMetrics {
    return {
        totalRevenue: 0, totalExpense: 0, netIncome: 0, grossMarginPct: 0,
        revenueForecast: 0, revenueStr: '—', forecastStr: '—',
        totalTasks: 0, doneTasks: 0, openTasks: 0, overdueTasks: 0,
        completionRate: 0, onTimeRate: 0, teamVelocity: 0, overdueRate: 0,
        totalEmployees: 0, avgBurnout: 0, highBurnoutCount: 0,
        totalProjects: 0, behindProjects: 0,
        orgHealthPct: 0, riskScore: 0, riskLabel: 'Low', productivityGrowth: 0,
        deptStats: [], weeklyVelocity: [], transactionTrend: [],
        transactions: [],
    };
}
