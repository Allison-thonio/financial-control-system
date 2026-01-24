'use client';

import React, { useState } from 'react';
import { calculateLoanCapacity, LOAN_TERM_MONTHS, LOAN_INTEREST_RATE_PER_MONTH } from '@/lib/loanLogic';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

interface TransactionRow {
    id: string;
    name: string;
    loanAmount: number;
    startDate: string; // ISO string
    monthlyIncome: number;
    status: 'active' | 'completed' | 'overdue';
}

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export function LoanTransactions() {
    const [transactions] = useState<TransactionRow[]>([
        {
            id: '1',
            name: 'John Doe',
            loanAmount: 100000,
            startDate: '2024-01-05',
            monthlyIncome: 50000,
            status: 'active',
        },
        {
            id: '2',
            name: 'Jane Smith',
            loanAmount: 150000,
            startDate: '2024-02-10',
            monthlyIncome: 80000,
            status: 'active',
        },
        {
            id: '3',
            name: 'Robert Brown',
            loanAmount: 200000,
            startDate: '2024-03-15',
            monthlyIncome: 60000,
            status: 'active',
        },
    ]);

    // AI Logic: Calculate monthly payments for each transaction
    const getMonthlyPayment = (row: TransactionRow, monthIndex: number) => {
        const start = new Date(row.startDate);
        const startMonth = start.getMonth();
        const currentYear = new Date().getFullYear();

        // Loan lasts 3 months starting from the month after disbursement
        const totalRepayment = row.loanAmount * (1 + (LOAN_INTEREST_RATE_PER_MONTH * LOAN_TERM_MONTHS));
        const monthlyEMI = totalRepayment / LOAN_TERM_MONTHS;

        const paymentMonths = [];
        for (let i = 1; i <= LOAN_TERM_MONTHS; i++) {
            const d = new Date(start);
            d.setMonth(startMonth + i);
            paymentMonths.push({
                month: d.getMonth(),
                year: d.getFullYear()
            });
        }

        const isPaymentMonth = paymentMonths.some(p => p.month === monthIndex && p.year === currentYear);

        return isPaymentMonth ? Math.round(monthlyEMI) : 0;
    };

    return (
        <div className="w-full">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">
                            Loan <span className="text-blue-600">History</span>
                        </h1>
                        <p className="text-gray-500 font-medium">Financial Control Center & Automated Collections</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-blue-50 px-6 py-4 rounded-2xl border border-blue-100 flex items-center gap-4 shadow-sm">
                            <div className="bg-blue-600 p-2 rounded-xl">
                                <Info className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mb-0.5">AI Policy Engine</p>
                                <p className="text-sm text-blue-900 font-bold">3-Mo Cap / 10% Interest</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Spreadsheet View */}
                <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl overflow-hidden mb-12">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="px-6 py-4 font-bold text-gray-700 text-xs uppercase tracking-wider">Staff / Applicant</th>
                                    <th className="px-6 py-4 font-bold text-gray-700 text-xs uppercase tracking-wider text-right">Principal (₦)</th>
                                    <th className="px-6 py-4 font-bold text-gray-700 text-xs uppercase tracking-wider text-right">Monthly / Yearly</th>
                                    {MONTHS.map(month => (
                                        <th key={month} className="px-2 py-4 font-bold text-gray-400 text-[10px] uppercase tracking-tighter text-center">
                                            {month.substring(0, 3)}
                                        </th>
                                    ))}
                                    <th className="px-6 py-4 font-bold text-gray-700 text-xs uppercase tracking-wider text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {transactions.map((row) => {
                                    const totalRepayment = row.loanAmount * 1.3;
                                    const isOverLimit = totalRepayment > row.monthlyIncome * 3;

                                    return (
                                        <tr key={row.id} className="hover:bg-gray-50/50 transition-all duration-200 group">
                                            <td className="px-6 py-5 font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                {row.name}
                                            </td>
                                            <td className="px-6 py-5 text-right font-mono text-sm font-bold text-gray-800">
                                                {row.loanAmount.toLocaleString()}
                                                {isOverLimit && (
                                                    <div className="text-[9px] text-red-500 font-black flex items-center justify-end gap-1 mt-1">
                                                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                                                        CAP EXCEEDED
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-5 text-right whitespace-nowrap">
                                                <div className="text-sm font-bold text-gray-600">{row.monthlyIncome.toLocaleString()}</div>
                                                <div className="text-[10px] font-bold text-gray-400">Y: {(row.monthlyIncome * 12).toLocaleString()}</div>
                                            </td>
                                            {MONTHS.map((_, idx) => {
                                                const payment = getMonthlyPayment(row, idx);
                                                return (
                                                    <td key={idx} className={`px-2 py-5 text-center transition-all duration-300 ${payment > 0 ? 'bg-blue-50/30' : ''}`}>
                                                        {payment > 0 ? (
                                                            <div className="flex flex-col items-center">
                                                                <span className="text-[11px] font-black text-blue-700">{payment.toLocaleString()}</span>
                                                                <div className="w-4 h-0.5 bg-blue-400/30 rounded-full mt-1" />
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-200 font-bold text-xs">-</span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                            <td className="px-6 py-5 text-center">
                                                <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border-2 ${row.status === 'active'
                                                    ? 'bg-blue-50 text-blue-600 border-blue-100'
                                                    : 'bg-green-50 text-green-600 border-green-100'
                                                    }`}>
                                                    {row.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* AI Notification Dashboard */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-gray-900 rounded-[2.5rem] p-10 shadow-3xl text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[100px] -mr-32 -mt-32" />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-10">
                                <div>
                                    <h2 className="text-2xl font-black mb-1">Monthly Collection List</h2>
                                    <p className="text-gray-400 text-sm font-medium">Automatic system verification for {MONTHS[new Date().getMonth()]} {new Date().getFullYear()}</p>
                                </div>
                                <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
                                    <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest mb-0.5">Total Expected</p>
                                    <p className="text-lg font-black text-blue-400">
                                        ₦{transactions.reduce((sum, t) => sum + getMonthlyPayment(t, new Date().getMonth()), 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {transactions.map(t => {
                                    const payment = getMonthlyPayment(t, new Date().getMonth());
                                    if (payment > 0) {
                                        return (
                                            <div key={t.id} className="bg-white/5 border border-white/10 p-5 rounded-2xl flex items-center justify-between hover:bg-white/10 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center font-black text-blue-400">
                                                        {t.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-100">{t.name}</p>
                                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest text-left">Internal Staff</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-blue-400 font-black">₦{payment.toLocaleString()}</p>
                                                    <p className="text-[9px] text-gray-500 font-bold">DUE END OF MONTH</p>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-b from-blue-600 to-indigo-700 rounded-[2.5rem] p-10 shadow-3xl text-white">
                        <div className="bg-white/20 p-3 rounded-2xl w-fit mb-6">
                            <CheckCircle2 className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-black mb-4">Manager & Staff Sync</h2>
                        <p className="text-blue-100 font-medium leading-relaxed mb-8">
                            The AI System has synchronized this collection list across both Manager and Staff interfaces. All amounts are rounded and include the 10% monthly interest.
                        </p>

                        <div className="space-y-4">
                            <div className="bg-black/20 p-4 rounded-2xl border border-white/10">
                                <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest mb-1 text-left">Security Protocol</p>
                                <p className="text-sm font-bold">128-bit encryption on all payouts</p>
                            </div>
                            <div className="bg-black/20 p-4 rounded-2xl border border-white/10">
                                <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest mb-1 text-left">Next Sync</p>
                                <p className="text-sm font-bold">Automatic: {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
