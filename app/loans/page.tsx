import { LoanTransactions } from '@/components/LoanTransactions';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function LoansPage() {
    return (
        <DashboardLayout>
            <LoanTransactions />
        </DashboardLayout>
    );
}
