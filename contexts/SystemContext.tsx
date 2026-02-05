'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSystemSettings, updateSystemSettings, createAuditLog, getAuditLogs } from '@/lib/db';
import { db } from '@/lib/firebase';

export interface AuditLog {
    id: string;
    action: string;
    user: string;
    details: string;
    timestamp: any;
}

export interface SystemSettings {
    interestRate: number;
    maxTenure: number;
    salaryCapMultiplier: number;
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
        const fetchInitialData = async () => {
            try {
                const [dbSettings, dbLogs] = await Promise.all([
                    getSystemSettings(),
                    getAuditLogs(100)
                ]);

                if (dbSettings) {
                    setSettings({
                        interestRate: dbSettings.interestRate,
                        maxTenure: dbSettings.maxTenure,
                        salaryCapMultiplier: dbSettings.salaryCapMultiplier
                    });
                } else if (db) {
                    // Initialize settings if they don't exist, but only if db is available
                    await updateSystemSettings({
                        interestRate: 0.1,
                        maxTenure: 12,
                        salaryCapMultiplier: 3
                    });
                }

                if (dbLogs) {
                    setAuditLogs(dbLogs.map(log => ({
                        id: log.id!,
                        action: log.action,
                        user: log.user,
                        details: log.details,
                        timestamp: log.timestamp instanceof Date ? log.timestamp.toISOString() : (typeof log.timestamp?.toDate === 'function' ? log.timestamp.toDate().toISOString() : log.timestamp)
                    })));
                }
            } catch (error) {
                console.error('[SystemContext] Failed to fetch initial data:', error);
            }
        };

        fetchInitialData();
    }, []);

    const updateSettings = async (newSettings: SystemSettings) => {
        setSettings(newSettings);
        try {
            await updateSystemSettings(newSettings);
            await addAuditLog('Updated System Settings', 'Manager', `Interest: ${newSettings.interestRate * 100}%, Max Tenure: ${newSettings.maxTenure}mo`);
        } catch (error) {
            console.error('Failed to update settings:', error);
        }
    };

    const addAuditLog = async (action: string, user: string, details: string) => {
        try {
            await createAuditLog({ action, user, details });
            // Re-fetch logs to keep UI updated
            const dbLogs = await getAuditLogs(100);
            setAuditLogs(dbLogs.map(log => ({
                id: log.id!,
                action: log.action,
                user: log.user,
                details: log.details,
                timestamp: log.timestamp instanceof Date ? log.timestamp.toISOString() : (typeof log.timestamp?.toDate === 'function' ? log.timestamp.toDate().toISOString() : log.timestamp)
            })));
        } catch (error) {
            console.error('Failed to add audit log:', error);
        }
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
