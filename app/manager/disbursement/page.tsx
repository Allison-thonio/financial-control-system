'use client';

import { ManagerDisbursement } from '@/components/manager/ManagerDisbursement';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function DisbursementPage() {
    return (
        <DashboardLayout>
            <ManagerDisbursement />
        </DashboardLayout>
    );
}
