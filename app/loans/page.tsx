'use client';

import { LoanTransactions } from '@/components/LoanTransactions';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function LoansPage() {
    return (
        <ProtectedRoute>
            <LoanTransactions />
        </ProtectedRoute>
    );
}
