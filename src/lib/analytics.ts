import { Employee, Task, Project } from '@/store';
import { differenceInDays, parseISO, isAfter, isBefore } from 'date-fns';

export function calculateBurnoutRisk(employee: Employee, tasks: Task[]): { score: number, risk: 'Low' | 'Medium' | 'High', log: string[] } {
    const employeeTasks = tasks.filter(t => t.assigneeId === employee.id);
    let log: string[] = [];

    // 1. Workload ratio: assigned weight vs capacity
    // Assume capacity is weekly hours. Let's simplify and say 1 weight unit = 2 hours.
    const totalAssignedWeight = employeeTasks.filter(t => t.status !== 'Done').reduce((acc, t) => acc + t.weight, 0);
    const estimatedHoursReq = totalAssignedWeight * 2;
    const workloadRatio = estimatedHoursReq / (employee.capacity || 40);
    log.push(`Workload Ratio: ${workloadRatio.toFixed(2)} (${estimatedHoursReq}h required vs ${employee.capacity}h capacity)`);

    // 2. Overtime frequency / task overlap density
    let overlappingDays = 0;
    // VERY simple overlap logic: if multiple tasks are active right now
    const now = new Date();
    const activeTasks = employeeTasks.filter(t =>
        t.status !== 'Done' &&
        isBefore(parseISO(t.startDate), now) &&
        isAfter(parseISO(t.endDate), now)
    );

    if (activeTasks.length > 2) {
        log.push(`High Task Overlap Density: ${activeTasks.length} simultaneous active tasks`);
        overlappingDays += 10;
    } else {
        log.push(`Normal Task Overlap Density`);
    }

    // 3. Consecutive high-load cycles (mocking history as if past completed tasks were also dense)
    const recentlyCompleted = employeeTasks.filter(t => t.status === 'Done' && isAfter(parseISO(t.endDate || ''), new Date(now.getTime() - 14 * 86400000)));
    if (recentlyCompleted.length > 3) {
        log.push(`Consecutive high load: ${recentlyCompleted.length} tasks completed in last 14 days`);
        overlappingDays += 10;
    }

    // Calculation
    let burnoutScore = (workloadRatio * 40) + overlappingDays;

    let risk: 'Low' | 'Medium' | 'High' = 'Low';
    if (burnoutScore > 80) risk = 'High';
    else if (burnoutScore > 50) risk = 'Medium';

    return { score: Math.min(burnoutScore, 100), risk, log };
}

export function calculatePerformanceScore(employee: Employee, tasks: Task[]): { score: number, log: string[] } {
    const employeeTasks = tasks.filter(t => t.assigneeId === employee.id && t.status === 'Done');
    let log: string[] = [];
    if (employeeTasks.length === 0) {
        return { score: 0, log: ['No completed tasks found for evaluation.'] };
    }

    // Milestone Completion Rate & Deadline adherence
    let onTimeTasks = 0;
    let totalWeight = 0;
    let qualitySum = 0;

    employeeTasks.forEach(t => {
        totalWeight += t.weight;
        qualitySum += (t.qualityIndicator || 100) * t.weight; // weight quality by task weight

        if (t.completedDate && isBefore(parseISO(t.completedDate), parseISO(t.endDate)) || t.completedDate === t.endDate) {
            onTimeTasks++;
        }
    });

    const deadlineAdherence = onTimeTasks / employeeTasks.length;
    log.push(`Deadline Adherence: ${(deadlineAdherence * 100).toFixed(0)}%`);

    const avgQuality = qualitySum / totalWeight;
    log.push(`Weighted Quality Indicator: ${avgQuality.toFixed(0)}%`);

    // Workload Balance Index
    const allTasksCount = tasks.filter(t => t.assigneeId === employee.id).length;
    const balanceIndex = Math.min(allTasksCount / 10, 1); // Mock index
    log.push(`Workload Balance Index: ${balanceIndex.toFixed(2)}`);

    // Final score out of 100
    // 50% adherence + 40% quality + 10% balance
    const finalScore = (deadlineAdherence * 50) + ((avgQuality / 100) * 40) + (balanceIndex * 10);

    return { score: Math.min(Math.round(finalScore), 100), log };
}
