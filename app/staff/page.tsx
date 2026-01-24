import { StaffDashboard } from '@/components/staff/StaffDashboard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function StaffPage() {
  return (
    <DashboardLayout>
      <StaffDashboard />
    </DashboardLayout>
  );
}
