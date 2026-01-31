'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AuditLog {
    id: string;
    action: string;
    user: string;
    details: string;
    timestamp: string;
}

export interface SystemSettings {
    interestRate: number; // e.g., 0.1 for 10%
    maxTenure: number;    // e.g., 24
    salaryCapMultiplier: number; // e.g., 3
}

interface SystemContextType {
    settings: SystemSettings;
    updateSettings: (newSettings: SystemSettings) => void;
    auditLogs: AuditLog[];
    addAuditLog: (action: string, user: string, details: string) => void;
}

const SystemContext = createContext<SystemContextType | undefined>(undefined);

export function SystemProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<SystemSettings>({
        interestRate: 0.1,
        maxTenure: 12,
        salaryCapMultiplier: 3
    });

    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

    useEffect(() => {
        const savedSettings = localStorage.getItem('loanSystemSettings');
        if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
        }

        const savedLogs = localStorage.getItem('loanAuditLogs');
        if (savedLogs) {
            setAuditLogs(JSON.parse(savedLogs));
        }
    }, []);

    const updateSettings = (newSettings: SystemSettings) => {
        setSettings(newSettings);
        localStorage.setItem('loanSystemSettings', JSON.stringify(newSettings));
        addAuditLog('Updated System Settings', 'Manager', `Interest: ${newSettings.interestRate * 100}%, Max Tenure: ${newSettings.maxTenure}mo`);
    };

    const addAuditLog = (action: string, user: string, details: string) => {
        const newLog: AuditLog = {
            id: Math.random().toString(36).substr(2, 9),
            action,
            user,
            details,
            timestamp: new Date().toISOString(),
        };
        const updatedLogs = [newLog, ...auditLogs].slice(0, 100); // Keep last 100 logs
        setAuditLogs(updatedLogs);
        localStorage.setItem('loanAuditLogs', JSON.stringify(updatedLogs));
    };

    return (
        <SystemContext.Provider value={{ settings, updateSettings, auditLogs, addAuditLog }}>
            {children}
        </SystemContext.Provider>
    );
}

export function useSystem() {
    const context = useContext(SystemContext);
    if (context === undefined) {
        throw new Error('useSystem must be used within a SystemProvider');
    }
    return context;
}
