"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

type Transaction = {
    Date: string;
    Amount: number;
    Type: 'Revenue' | 'Expense';
    Category: string;
};

type WorkspaceContextType = {
    workspaceName: string;
    managerId: string;
    userRole: 'CEO' | 'Manager' | 'Employee';
    transactions: Transaction[];
    setWorkspaceData: (name: string, id: string, txs: Transaction[]) => void;
    setUserRole: (role: 'CEO' | 'Manager' | 'Employee') => void;
    clearWorkspace: () => void;
};

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
    const [workspaceName, setWorkspaceName] = useState<string>('');
    const [managerId, setManagerId] = useState<string>('');
    const [userRole, setUserRole] = useState<'CEO' | 'Manager' | 'Employee'>('CEO');
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    useEffect(() => {
        // Load from local storage on mount
        const storedName = localStorage.getItem('unify_workspaceName');
        const storedId = localStorage.getItem('unify_managerId');
        const storedRole = localStorage.getItem('unify_userRole');
        const storedTxs = localStorage.getItem('unify_transactions');

        if (storedName) setWorkspaceName(storedName);
        if (storedId) setManagerId(storedId);
        if (storedRole) setUserRole(storedRole as 'CEO' | 'Manager' | 'Employee');
        if (storedTxs) {
            try {
                setTransactions(JSON.parse(storedTxs));
            } catch (e) {
                console.error("Failed to parse stored transactions", e);
            }
        }
    }, []);

    const handleSetUserRole = (role: 'CEO' | 'Manager' | 'Employee') => {
        setUserRole(role);
        localStorage.setItem('unify_userRole', role);
    };

    const setWorkspaceData = (name: string, id: string, txs: Transaction[]) => {
        setWorkspaceName(name);
        setManagerId(id);
        setTransactions(txs);

        localStorage.setItem('unify_workspaceName', name);
        localStorage.setItem('unify_managerId', id);
        localStorage.setItem('unify_transactions', JSON.stringify(txs));
    };

    const clearWorkspace = () => {
        setWorkspaceName('');
        setManagerId('');
        setTransactions([]);
        setUserRole('CEO');
        localStorage.removeItem('unify_workspaceName');
        localStorage.removeItem('unify_managerId');
        localStorage.removeItem('unify_transactions');
        localStorage.removeItem('unify_userRole');
    };

    return (
        <WorkspaceContext.Provider value={{ workspaceName, managerId, userRole, transactions, setWorkspaceData, setUserRole: handleSetUserRole, clearWorkspace }}>
            {children}
        </WorkspaceContext.Provider>
    );
}

export function useWorkspace() {
    const context = useContext(WorkspaceContext);
    if (context === undefined) {
        throw new Error('useWorkspace must be used within a WorkspaceProvider');
    }
    return context;
}
