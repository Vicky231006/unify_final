/**
 * Smart client-side CSV parser for UNIFY
 * ──────────────────────────────────────
 * Parses raw CSV text into the NormalizedWorkspaceData shape without
 * needing a Gemini API call. Handles any column name by matching against
 * synonyms. This covers ~80% of real-world CSVs.
 *
 * The parser auto-detects which "type" of CSV it is (employees, projects,
 * tasks, transactions) from the header row, then maps accordingly.
 */

import { NormalizedWorkspaceData } from '@/store';

// ── Column-name synonym maps ──────────────────────────────────────────────────
const SYN = {
    employee: {
        name: ['name', 'full_name', 'fullname', 'employee_name', 'employee', 'worker', 'staff', 'person', 'member'],
        email: ['email', 'email_address', 'mail', 'contact', 'e-mail'],
        role: ['role', 'title', 'job_title', 'position', 'designation', 'function', 'department', 'dept', 'team'],
        capacity: ['capacity', 'hours', 'weekly_hours', 'allocation', 'fte', 'load'],
    },
    project: {
        name: ['project', 'project_name', 'name', 'title', 'initiative', 'program', 'project_title'],
        description: ['description', 'desc', 'summary', 'details', 'notes', 'objective'],
        status: ['status', 'state', 'phase', 'stage', 'progress'],
        startDate: ['start_date', 'start', 'begin_date', 'from', 'commenced', 'kickoff'],
        endDate: ['end_date', 'end', 'due_date', 'deadline', 'target', 'completion', 'finish'],
    },
    task: {
        title: ['task', 'task_name', 'name', 'title', 'activity', 'work_item', 'issue', 'ticket', 'feature', 'story'],
        assignee: ['assignee', 'assigned_to', 'owner', 'responsible', 'member', 'developer', 'user'],
        project: ['project', 'project_name', 'epic', 'sprint', 'milestone'],
        status: ['status', 'state', 'progress', 'stage'],
        weight: ['weight', 'priority', 'points', 'story_points', 'complexity', 'effort', 'estimate'],
        type: ['type', 'category', 'kind', 'issue_type', 'task_type'],
        startDate: ['start_date', 'start', 'begin'],
        endDate: ['end_date', 'due_date', 'deadline', 'due', 'finish'],
    },
    transaction: {
        date: ['date', 'transaction_date', 'created_at', 'period', 'month', 'when'],
        amount: ['amount', 'value', 'total', 'revenue', 'cost', 'price', 'sum', 'money', 'sales'],
        type: ['type', 'transaction_type', 'direction', 'flow', 'classification'],
        category: ['category', 'description', 'item', 'product', 'service', 'label', 'source'],
    },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += ch;
        }
    }
    result.push(current.trim());
    return result;
}

function normalizeHeader(h: string): string {
    return h.toLowerCase().replace(/[\s\-\/\\()'"#]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

function findCol(headers: string[], synonyms: string[]): number {
    for (const syn of synonyms) {
        const idx = headers.findIndex(h => h === syn || h.includes(syn));
        if (idx !== -1) return idx;
    }
    return -1;
}

function safeDate(raw: string | undefined): string {
    if (!raw) return new Date().toISOString();
    // Handle common formats: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, MM-DD-YYYY
    const clean = raw.trim();
    // Already ISO-like
    if (/^\d{4}-\d{2}-\d{2}/.test(clean)) return new Date(clean).toISOString();
    // DD/MM/YYYY
    const dmy = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (dmy) return new Date(`${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`).toISOString();
    // MM/DD/YYYY
    const mdy = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (mdy) return new Date(`${mdy[3]}-${mdy[1].padStart(2, '0')}-${mdy[2].padStart(2, '0')}`).toISOString();
    const parsed = new Date(clean);
    return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function normalizeStatus(raw: string, type: 'project' | 'task'): string {
    const v = raw.toLowerCase().trim();
    if (type === 'project') {
        if (['done', 'complete', 'completed', 'finished', 'closed', 'delivered'].some(s => v.includes(s))) return 'Completed';
        if (['progress', 'active', 'ongoing', 'running', 'started', 'open', 'wip'].some(s => v.includes(s))) return 'In Progress';
        return 'Not Started';
    } else {
        if (['done', 'complete', 'completed', 'finished', 'closed', 'resolved'].some(s => v.includes(s))) return 'Done';
        if (['review', 'pr', 'pull request', 'testing', 'qa', 'pending review'].some(s => v.includes(s))) return 'Review';
        if (['progress', 'active', 'ongoing', 'started', 'in progress', 'wip'].some(s => v.includes(s))) return 'In Progress';
        return 'To Do';
    }
}

function normalizeWeight(raw: string | undefined): number {
    if (!raw) return 5;
    const lower = raw.toLowerCase().trim();
    if (['critical', 'blocker', 'urgent'].some(s => lower.includes(s))) return 9;
    if (['high', 'major', 'important'].some(s => lower.includes(s))) return 7;
    if (['medium', 'normal', 'moderate'].some(s => lower.includes(s))) return 5;
    if (['low', 'minor', 'trivial'].some(s => lower.includes(s))) return 3;
    const num = parseFloat(raw);
    if (!isNaN(num)) return Math.min(10, Math.max(1, Math.round(num)));
    return 5;
}

// ── CSV type detection ─────────────────────────────────────────────────────────
type CSVType = 'employee' | 'project' | 'task' | 'transaction' | 'unknown';

function detectCSVType(headers: string[]): CSVType {
    const h = headers.join(' ');

    const employeeScore = [
        /name/i, /email/i, /role|title|position|designation/i, /salary|pay|wage/i, /department|dept/i
    ].filter(r => r.test(h)).length;

    const projectScore = [
        /project/i, /initiative|program/i, /milestone/i, /phase/i
    ].filter(r => r.test(h)).length;

    const taskScore = [
        /task|ticket|issue|story/i, /assignee|assigned/i, /sprint|epic/i, /story.?point/i
    ].filter(r => r.test(h)).length;

    const transactionScore = [
        /amount|revenue|cost|sales/i, /transaction|payment|invoice/i, /expense/i, /price|value/i
    ].filter(r => r.test(h)).length;

    const scores: [CSVType, number][] = [
        ['employee', employeeScore],
        ['project', projectScore],
        ['task', taskScore],
        ['transaction', transactionScore],
    ];
    scores.sort((a, b) => b[1] - a[1]);

    return scores[0][1] > 0 ? scores[0][0] : 'unknown';
}

// ── Per-type parsers ──────────────────────────────────────────────────────────
function parseEmployeeCSV(headers: string[], rows: string[][]): NormalizedWorkspaceData['employees'] {
    const nameIdx = findCol(headers, SYN.employee.name);
    const emailIdx = findCol(headers, SYN.employee.email);
    const roleIdx = findCol(headers, SYN.employee.role);
    const capIdx = findCol(headers, SYN.employee.capacity);
    const deptIdx = findCol(headers, ['department', 'dept', 'team', 'group', 'division']);

    return rows
        .filter(row => row.length > 0 && row.some(c => c.trim()))
        .map(row => ({
            name: nameIdx !== -1 ? row[nameIdx] || 'Unknown' : row[0] || 'Unknown',
            email: emailIdx !== -1 ? row[emailIdx] || '' : '',
            role: roleIdx !== -1 ? row[roleIdx] || 'Employee' : (deptIdx !== -1 ? row[deptIdx] || 'Employee' : 'Employee'),
            capacity: capIdx !== -1 ? (parseFloat(row[capIdx]) || 100) : 100,
        }))
        .filter(e => e.name && e.name !== 'Unknown' && e.name.length > 1);
}

function extractDepts(employees: NormalizedWorkspaceData['employees'], headers: string[], rows: string[][]): NormalizedWorkspaceData['departments'] {
    const deptIdx = findCol(headers, ['department', 'dept', 'team', 'group', 'division']);
    const deptNames = new Set<string>();
    if (deptIdx !== -1) {
        rows.forEach(row => { if (row[deptIdx]?.trim()) deptNames.add(row[deptIdx].trim()); });
    } else {
        employees.forEach(e => { if (e.role && e.role !== 'Employee') deptNames.add(e.role); });
    }
    return Array.from(deptNames).map(name => ({ name }));
}

function parseProjectCSV(headers: string[], rows: string[][]): NormalizedWorkspaceData['projects'] {
    const nameIdx = findCol(headers, SYN.project.name);
    const descIdx = findCol(headers, SYN.project.description);
    const statIdx = findCol(headers, SYN.project.status);
    const startIdx = findCol(headers, SYN.project.startDate);
    const endIdx = findCol(headers, SYN.project.endDate);
    const now = new Date();

    return rows
        .filter(row => row.length > 0 && row.some(c => c.trim()))
        .map((row, i) => ({
            name: nameIdx !== -1 ? row[nameIdx] || `Project ${i + 1}` : row[0] || `Project ${i + 1}`,
            description: descIdx !== -1 ? row[descIdx] || '' : '',
            status: statIdx !== -1 ? normalizeStatus(row[statIdx] || '', 'project') : 'Not Started',
            startDate: startIdx !== -1 ? safeDate(row[startIdx]) : now.toISOString(),
            endDate: endIdx !== -1 ? safeDate(row[endIdx]) : new Date(now.getTime() + 86400000 * 30).toISOString(),
        }))
        .filter(p => p.name.length > 0);
}

function parseTaskCSV(headers: string[], rows: string[][], projects: NormalizedWorkspaceData['projects']): NormalizedWorkspaceData['tasks'] {
    const titleIdx = findCol(headers, SYN.task.title);
    const assignIdx = findCol(headers, SYN.task.assignee);
    const projIdx = findCol(headers, SYN.task.project);
    const statIdx = findCol(headers, SYN.task.status);
    const weightIdx = findCol(headers, SYN.task.weight);
    const typeIdx = findCol(headers, SYN.task.type);
    const startIdx = findCol(headers, SYN.task.startDate);
    const endIdx = findCol(headers, SYN.task.endDate);
    const now = new Date();
    const defaultProj = projects[0]?.name || 'General';

    return rows
        .filter(row => row.length > 0 && row.some(c => c.trim()))
        .map((row, i) => ({
            title: titleIdx !== -1 ? row[titleIdx] || `Task ${i + 1}` : row[0] || `Task ${i + 1}`,
            assigneeName: assignIdx !== -1 ? row[assignIdx] || '' : '',
            projectName: projIdx !== -1 ? row[projIdx] || defaultProj : defaultProj,
            status: statIdx !== -1 ? normalizeStatus(row[statIdx] || '', 'task') : 'To Do',
            weight: normalizeWeight(weightIdx !== -1 ? row[weightIdx] : undefined),
            type: typeIdx !== -1 ? row[typeIdx] || 'Task' : 'Task',
            startDate: startIdx !== -1 ? safeDate(row[startIdx]) : now.toISOString(),
            endDate: endIdx !== -1 ? safeDate(row[endIdx]) : new Date(now.getTime() + 86400000 * 7).toISOString(),
        }))
        .filter(t => t.title.length > 0);
}

function parseTransactionCSV(headers: string[], rows: string[][]): NormalizedWorkspaceData['transactions'] {
    const dateIdx = findCol(headers, SYN.transaction.date);
    const amtIdx = findCol(headers, SYN.transaction.amount);
    const typeIdx = findCol(headers, SYN.transaction.type);
    const catIdx = findCol(headers, SYN.transaction.category);
    const now = new Date();

    return rows
        .filter(row => row.length > 0 && row.some(c => c.trim()))
        .map(row => {
            const rawType = typeIdx !== -1 ? row[typeIdx].toLowerCase() : '';
            const isExpense = ['expense', 'cost', 'debit', 'spend', 'payment', 'purchase', 'outflow'].some(s => rawType.includes(s));
            const amount = amtIdx !== -1 ? Math.abs(parseFloat(row[amtIdx].replace(/[$,€£]/g, '')) || 0) : 0;
            return {
                Date: dateIdx !== -1 ? safeDate(row[dateIdx]).split('T')[0] : now.toISOString().split('T')[0],
                Amount: amount,
                Type: isExpense ? 'Expense' : 'Revenue',
                Category: catIdx !== -1 ? row[catIdx] || 'General' : 'General',
            };
        })
        .filter(t => t.Amount > 0) as NormalizedWorkspaceData['transactions'];
}

// ── Main export ───────────────────────────────────────────────────────────────
export function parseCSVsClientSide(csvTexts: string[]): NormalizedWorkspaceData {
    const result: NormalizedWorkspaceData = {
        employees: [], departments: [], projects: [], tasks: [], transactions: []
    };

    for (const text of csvTexts) {
        const lines = text.trim().split('\n').filter(l => l.trim());
        if (lines.length < 2) continue;

        const rawHeaders = parseCSVLine(lines[0]);
        const headers = rawHeaders.map(normalizeHeader);
        const rows = lines.slice(1).map(l => parseCSVLine(l));
        const csvType = detectCSVType(headers);

        switch (csvType) {
            case 'employee': {
                const emps = parseEmployeeCSV(headers, rows);
                const depts = extractDepts(emps, headers, rows);
                result.employees.push(...emps);
                result.departments.push(...depts);
                break;
            }
            case 'project': {
                result.projects.push(...parseProjectCSV(headers, rows));
                break;
            }
            case 'task': {
                result.tasks.push(...parseTaskCSV(headers, rows, result.projects));
                break;
            }
            case 'transaction': {
                result.transactions.push(...parseTransactionCSV(headers, rows));
                break;
            }
            case 'unknown': {
                // Try to extract whatever we can
                const emps = parseEmployeeCSV(headers, rows);
                if (emps.length > 0) {
                    result.employees.push(...emps);
                    result.departments.push(...extractDepts(emps, headers, rows));
                }
                break;
            }
        }
    }

    // Deduplicate departments
    result.departments = Array.from(new Map(result.departments.map(d => [d.name, d])).values());

    return result;
}
