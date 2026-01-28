'use client';

import { PayrollSimulation } from '@/components/manager/PayrollSimulation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function PayrollPage() {
    return (
        <DashboardLayout>
            <PayrollSimulation />
        </DashboardLayout>
    );
}
