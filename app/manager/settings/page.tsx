'use client';

import { ManagerSettings } from '@/components/manager/ManagerSettings';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function SettingsPage() {
    return (
        <DashboardLayout>
            <ManagerSettings />
        </DashboardLayout>
    );
}
