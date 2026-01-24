'use client';

import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { useSimpleAuth } from '@/hooks/useSimpleAuth';
import { ProtectedRoute } from '@/components/ProtectedRoute';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const { user } = useSimpleAuth();

    // Use the role from the user object
    const role = user?.role || 'staff';

    return (
        <ProtectedRoute>
            <div className="flex min-h-screen bg-[#F8FAFC]">
                <Sidebar role={role as 'manager' | 'staff'} />
                <main className="flex-1 ml-64 min-h-screen">
                    <div className="max-w-7xl mx-auto p-4 md:p-8">
                        {children}
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}
