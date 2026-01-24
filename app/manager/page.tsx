import { ManagerDashboard } from '@/components/manager/ManagerDashboard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function ManagerPage() {
  return (
    <DashboardLayout>
      <ManagerDashboard />
    </DashboardLayout>
  );
}
