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
    transactions: Transaction[];
    setWorkspaceData: (name: string, id: string, txs: Transaction[]) => void;
    clearWorkspace: () => void;
};

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
    const [workspaceName, setWorkspaceName] = useState<string>('');
    const [managerId, setManagerId] = useState<string>('');
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    useEffect(() => {
        // Load from local storage on mount
        const storedName = localStorage.getItem('unify_workspaceName');
        const storedId = localStorage.getItem('unify_managerId');
        const storedTxs = localStorage.getItem('unify_transactions');

        if (storedName) setWorkspaceName(storedName);
        if (storedId) setManagerId(storedId);
        if (storedTxs) {
            try {
                setTransactions(JSON.parse(storedTxs));
            } catch (e) {
                console.error("Failed to parse stored transactions", e);
            }
        }
    }, []);

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
        localStorage.removeItem('unify_workspaceName');
        localStorage.removeItem('unify_managerId');
        localStorage.removeItem('unify_transactions');
    };

    return (
        <WorkspaceContext.Provider value={{ workspaceName, managerId, transactions, setWorkspaceData, clearWorkspace }}>
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
