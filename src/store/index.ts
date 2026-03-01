import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export type Workspace = {
    id: string;
    name: string;
    role: string;
    color: string;
    lastActive: string;
};

export type Department = {
    id: string;
    workspaceId: string;
    name: string;
    managerId: string | null;
};

export type Team = {
    id: string;
    workspaceId: string;
    name: string;
    departmentId: string | null;
};

export type Employee = {
    id: string;
    workspaceId: string;
    name: string;
    role: string;
    departmentId: string | null;
    teamId: string | null;
    isActive: boolean;
    capacity: number;
    joinedDate: string;
};

export type Project = {
    id: string;
    workspaceId: string;
    name: string;
    description: string;
    status: 'Not Started' | 'In Progress' | 'Completed';
    startDate: string;
    endDate: string;
};

export type Task = {
    id: string;
    projectId: string;
    title: string;
    type: string;
    assigneeId: string | null;
    status: "To Do" | "In Progress" | "Review" | "Done";
    weight: number;
    startDate: string;
    endDate: string;
    completedDate: string | null;
    qualityIndicator: number;
    dependencies: string[];
};

export type ActivityLog = {
    id: string;
    workspaceId: string;
    action: string;
    timestamp: string;
};

export type Transaction = {
    Date: string;
    Amount: number;
    Type: 'Revenue' | 'Expense';
    Category: string;
};

// Shape returned by the LLM normalization endpoint
export type NormalizedWorkspaceData = {
    employees: Array<{ name: string; role: string; email?: string; capacity?: number }>;
    departments: Array<{ name: string }>;
    projects: Array<{ name: string; description?: string; status?: string; startDate?: string; endDate?: string }>;
    tasks: Array<{ title: string; type?: string; assigneeName?: string; projectName?: string; status?: string; weight?: number; startDate?: string; endDate?: string }>;
    transactions: Array<{ Date: string; Amount: number; Type: string; Category: string }>;
};

export interface AppState {
    activeWorkspaceId: string | null;
    workspaces: Workspace[];
    departments: Department[];
    teams: Team[];
    employees: Employee[];
    projects: Project[];
    tasks: Task[];
    activityLogs: ActivityLog[];

    // Actions
    setActiveWorkspaceId: (id: string | null) => void;
    addWorkspace: (workspace: Omit<Workspace, 'id' | 'lastActive'>) => void;
    updateWorkspace: (id: string, data: Partial<Workspace>) => void;
    deleteWorkspace: (id: string) => void;

    addDepartment: (dept: Omit<Department, 'id'>) => void;
    updateDepartment: (id: string, data: Partial<Department>) => void;
    deleteDepartment: (id: string) => void;

    addTeam: (team: Omit<Team, 'id'>) => void;
    updateTeam: (id: string, data: Partial<Team>) => void;
    deleteTeam: (id: string) => void;

    addEmployee: (emp: Omit<Employee, 'id'>) => void;
    updateEmployee: (id: string, data: Partial<Employee>) => void;
    deleteEmployee: (id: string) => void;

    addProject: (proj: Omit<Project, 'id'>) => void;
    updateProject: (id: string, data: Partial<Project>) => void;
    deleteProject: (id: string) => void;

    addTask: (task: Omit<Task, 'id'>) => void;
    updateTask: (id: string, data: Partial<Task>) => void;
    deleteTask: (id: string) => void;

    logAction: (workspaceId: string, action: string) => void;
    bulkIngestWorkspaceData: (workspaceId: string, data: NormalizedWorkspaceData) => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            activeWorkspaceId: null,
            workspaces: [
                { id: '1', name: 'Acme Corp Global', role: 'Manager', lastActive: new Date().toISOString(), color: 'from-blue-500 to-indigo-500' }
            ],
            departments: [],
            teams: [],
            employees: [],
            projects: [],
            tasks: [],
            activityLogs: [],

            setActiveWorkspaceId: (id) => set({ activeWorkspaceId: id }),

            addWorkspace: (ws) => set((state) => ({
                workspaces: [...state.workspaces, { ...ws, id: uuidv4(), lastActive: new Date().toISOString() }]
            })),
            updateWorkspace: (id, data) => set((state) => ({
                workspaces: state.workspaces.map(w => w.id === id ? { ...w, ...data } : w)
            })),
            deleteWorkspace: (id) => set((state) => ({
                workspaces: state.workspaces.filter(w => w.id !== id),
                activeWorkspaceId: state.activeWorkspaceId === id ? null : state.activeWorkspaceId
            })),

            addDepartment: (dept) => set((state) => {
                const newDept = { ...dept, id: uuidv4() };
                get().logAction(dept.workspaceId, `Created department: ${dept.name}`);
                return { departments: [...state.departments, newDept] };
            }),
            updateDepartment: (id, data) => set((state) => ({
                departments: state.departments.map(d => d.id === id ? { ...d, ...data } : d)
            })),
            deleteDepartment: (id) => set((state) => {
                return {
                    departments: state.departments.filter(d => d.id !== id),
                    // clear references
                    teams: state.teams.map(t => t.departmentId === id ? { ...t, departmentId: null } : t),
                    employees: state.employees.map(e => e.departmentId === id ? { ...e, departmentId: null } : e)
                };
            }),

            addTeam: (team) => set((state) => {
                const newTeam = { ...team, id: uuidv4() };
                get().logAction(team.workspaceId, `Created team: ${team.name}`);
                return { teams: [...state.teams, newTeam] };
            }),
            updateTeam: (id, data) => set((state) => ({
                teams: state.teams.map(t => t.id === id ? { ...t, ...data } : t)
            })),
            deleteTeam: (id) => set((state) => ({
                teams: state.teams.filter(t => t.id !== id),
                employees: state.employees.map(e => e.teamId === id ? { ...e, teamId: null } : e)
            })),

            addEmployee: (emp) => set((state) => {
                get().logAction(emp.workspaceId, `Added employee: ${emp.name}`);
                return { employees: [...state.employees, { ...emp, id: uuidv4() }] };
            }),
            updateEmployee: (id, data) => set((state) => ({
                employees: state.employees.map(e => e.id === id ? { ...e, ...data } : e)
            })),
            deleteEmployee: (id) => set((state) => ({
                employees: state.employees.filter(e => e.id !== id),
                tasks: state.tasks.map(t => t.assigneeId === id ? { ...t, assigneeId: null } : t),
                departments: state.departments.map(d => d.managerId === id ? { ...d, managerId: null } : d)
            })),

            addProject: (proj) => set((state) => {
                get().logAction(proj.workspaceId, `Created project: ${proj.name}`);
                return { projects: [...state.projects, { ...proj, id: uuidv4() }] };
            }),
            updateProject: (id, data) => set((state) => ({
                projects: state.projects.map(p => p.id === id ? { ...p, ...data } : p)
            })),
            deleteProject: (id) => set((state) => {
                const tasksToDelete = state.tasks.filter(t => t.projectId === id).map(t => t.id);
                return {
                    projects: state.projects.filter(p => p.id !== id),
                    tasks: state.tasks.filter(t => t.projectId !== id)
                };
            }),

            addTask: (task) => set((state) => {
                get().logAction(state.projects.find(p => p.id === task.projectId)?.workspaceId || '', `Created task: ${task.title}`);
                return { tasks: [...state.tasks, { ...task, id: uuidv4() }] };
            }),
            updateTask: (id, data) => set((state) => {
                const prevTask = state.tasks.find(t => t.id === id);
                if (prevTask && prevTask.status !== data.status && data.status) {
                    const wsId = state.projects.find(p => p.id === prevTask.projectId)?.workspaceId || '';
                    get().logAction(wsId, `Task ${prevTask.title} moved from ${prevTask.status} to ${data.status}`);
                }
                return {
                    tasks: state.tasks.map(t => t.id === id ? { ...t, ...data } : t)
                };
            }),
            deleteTask: (id) => set((state) => {
                const filteredTasks = state.tasks.filter(t => t.id !== id);
                return {
                    tasks: filteredTasks.map(t => ({
                        ...t,
                        dependencies: t.dependencies.filter(depId => depId !== id)
                    }))
                };
            }),

            logAction: (workspaceId: string, action: string) => set((state) => {
                if (!workspaceId) return state;
                return {
                    activityLogs: [{ id: uuidv4(), workspaceId, action, timestamp: new Date().toISOString() }, ...state.activityLogs].slice(0, 100)
                };
            }),

            bulkIngestWorkspaceData: (workspaceId, data) => set((state) => {
                // Remove existing data for this workspace
                const keepEmployees = state.employees.filter(e => e.workspaceId !== workspaceId);
                const keepDepartments = state.departments.filter(d => d.workspaceId !== workspaceId);
                const keepProjects = state.projects.filter(p => p.workspaceId !== workspaceId);
                const oldProjectIds = state.projects.filter(p => p.workspaceId === workspaceId).map(p => p.id);
                const keepTasks = state.tasks.filter(t => !oldProjectIds.includes(t.projectId));

                // Seed new departments
                const newDepts = data.departments.map(d => ({
                    id: uuidv4(), workspaceId, name: d.name, managerId: null
                }));

                // Seed new employees
                const newEmps = data.employees.map(e => ({
                    id: uuidv4(), workspaceId,
                    name: e.name,
                    role: e.role || 'Employee',
                    departmentId: null, teamId: null,
                    isActive: true,
                    capacity: e.capacity ?? 100,
                    joinedDate: new Date().toISOString(),
                }));

                // Seed new projects
                const now = new Date();
                const newProjects = data.projects.map(p => ({
                    id: uuidv4(), workspaceId,
                    name: p.name,
                    description: p.description || '',
                    status: (p.status as Project['status']) || 'Not Started',
                    startDate: p.startDate || now.toISOString(),
                    endDate: p.endDate || new Date(now.getTime() + 86400000 * 30).toISOString(),
                }));

                // Seed new tasks — resolve project & assignee by name
                const newTasks: Task[] = data.tasks.map(t => {
                    const proj = newProjects.find(p => p.name === t.projectName) || newProjects[0];
                    const emp = newEmps.find(e => e.name === t.assigneeName) || null;
                    return {
                        id: uuidv4(),
                        projectId: proj?.id || '',
                        title: t.title,
                        type: t.type || 'Task',
                        assigneeId: emp?.id || null,
                        status: (t.status as Task['status']) || 'To Do',
                        weight: t.weight ?? 5,
                        startDate: t.startDate || now.toISOString(),
                        endDate: t.endDate || new Date(now.getTime() + 86400000 * 7).toISOString(),
                        completedDate: t.status === 'Done' ? now.toISOString() : null,
                        qualityIndicator: 80,
                        dependencies: [],
                    };
                });

                // Persist transactions to localStorage for useWorkspaceMetrics hook
                if (typeof window !== 'undefined' && data.transactions?.length > 0) {
                    const normalised = data.transactions.map(t => ({
                        Date: t.Date,
                        Amount: Number(t.Amount) || 0,
                        Type: (t.Type === 'Revenue' || t.Type === 'Expense') ? t.Type : 'Revenue',
                        Category: t.Category || 'Other',
                    }));
                    localStorage.setItem('unify_transactions', JSON.stringify(normalised));
                }

                return {
                    departments: [...keepDepartments, ...newDepts],
                    employees: [...keepEmployees, ...newEmps],
                    projects: [...keepProjects, ...newProjects],
                    tasks: [...keepTasks, ...newTasks],
                    activityLogs: [
                        { id: uuidv4(), workspaceId, action: `Ingested CSV data: ${data.employees.length} employees, ${data.projects.length} projects, ${data.tasks.length} tasks`, timestamp: new Date().toISOString() },
                        ...state.activityLogs,
                    ].slice(0, 100),
                };
            }),
        }),
        {
            name: 'unify-app-storage',
        }
    )
);
