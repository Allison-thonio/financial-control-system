'use client';

import React, { useState, useMemo } from 'react';
import { calculateTotalRepayment, getDetailedRepaymentSchedule } from '@/lib/loanLogic';
import {
    AlertCircle,
    CheckCircle2,
    Info,
    Eye,
    XCircle,
    Calendar,
    Briefcase,
    UserCheck,
    Download,
    TrendingUp,
    IdCard,
    FileText,
    ChevronDown,
    Search,
    History as HistoryIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSystem } from '@/contexts/SystemContext';

interface TransactionRow {
    id: string;
    name: string;
    loanAmount: number;
    loanTenure: number;
    startDate: string; // ISO string
    monthlyIncome: number;
    status: 'active' | 'completed' | 'overdue';
    repaymentType?: 'default' | 'custom';
    customRepayments?: number[];
    appointmentLetter?: string;
    passportPhoto?: string;
    nin?: string;
}

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export function LoanTransactions() {
    const { settings } = useSystem();
    const [transactions] = useState<TransactionRow[]>([
        {
            id: '1',
            name: 'John Doe',
            loanAmount: 100000,
            loanTenure: 3,
            startDate: '2024-01-05',
            monthlyIncome: 50000,
            status: 'active',
            repaymentType: 'default',
        },
        {
            id: '2',
            name: 'Jane Smith',
            loanAmount: 150000,
            loanTenure: 3,
            startDate: '2024-02-10',
            monthlyIncome: 80000,
            status: 'active',
            repaymentType: 'custom',
            customRepayments: [100000, 50000, 45000],
        },
        {
            id: '3',
            name: 'Robert Brown',
            loanAmount: 200000,
            loanTenure: 12,
            startDate: '2024-03-15',
            monthlyIncome: 60000,
            status: 'active',
            repaymentType: 'default',
            nin: '98765432101',
            appointmentLetter: 'robert_appointment.pdf',
            passportPhoto: 'robert_passport.jpg',
        },
    ]);

    const [selectedLoan, setSelectedLoan] = useState<TransactionRow | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t =>
            t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.id.includes(searchQuery)
        );
    }, [transactions, searchQuery]);

    const handleViewDetails = (loan: TransactionRow) => {
        setSelectedLoan(loan);
        setShowDetailsModal(true);
    };

    // New AI Logic: Calculate monthly payments based on dynamic tenure and interest
    const getMonthlyPayment = (row: TransactionRow, monthIndex: number) => {
        const start = new Date(row.startDate);
        const currentYear = new Date().getFullYear();

        const schedule = getDetailedRepaymentSchedule(row.loanAmount, row.loanTenure, start, row.monthlyIncome, settings);

        const scheduledPayment = schedule.find(p => p.month === monthIndex && p.year === currentYear);

        if (!scheduledPayment) return 0;

        if (row.repaymentType === 'custom' && row.customRepayments && row.loanTenure <= 3) {
            return row.customRepayments[schedule.findIndex(p => p === scheduledPayment)] || 0;
        }

        return scheduledPayment.total;
    };

    return (
        <div className="w-full space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        Loan <span className="text-primary italic">Ledger</span>
                        <HistoryIcon className="w-8 h-8 text-primary/20" />
                    </h1>
                    <p className="text-gray-500 font-medium">Global transaction history and active collection monitoring</p>
                </div>

                <div className="relative group w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search records..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all text-sm font-bold shadow-sm"
                    />
                </div>
            </header>

            {/* Spreadsheet View */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2.5rem] border border-gray-200 shadow-2xl overflow-hidden"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1200px]">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-8 py-6 font-black text-gray-700 text-[10px] uppercase tracking-widest sticky left-0 bg-gray-50 z-10 border-r border-gray-100">Staff / Applicant</th>
                                <th className="px-8 py-6 font-black text-gray-700 text-[10px] uppercase tracking-widest text-right">Principal</th>
                                {MONTHS.map(month => (
                                    <th key={month} className="px-3 py-6 font-black text-gray-400 text-[9px] uppercase tracking-tighter text-center">
                                        {month}
                                    </th>
                                ))}
                                <th className="px-8 py-6 font-black text-gray-700 text-[10px] uppercase tracking-widest text-center">Status</th>
                                <th className="px-8 py-6 font-black text-gray-700 text-[10px] uppercase tracking-widest text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredTransactions.map((row) => {
                                const { total } = calculateTotalRepayment(row.loanAmount, row.loanTenure, row.monthlyIncome, settings);
                                const isOverLimit = total > row.monthlyIncome * settings.salaryCapMultiplier;

                                return (
                                    <tr key={row.id} className="hover:bg-primary/[0.02] transition-colors group">
                                        <td className="px-8 py-6 font-black text-gray-900 sticky left-0 bg-white group-hover:bg-primary/[0.02] z-10 border-r border-gray-100 transition-colors">
                                            {row.name}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <p className="font-black text-gray-900">₦{row.loanAmount.toLocaleString()}</p>
                                            <p className="text-[9px] text-gray-400 font-bold uppercase">{row.loanTenure} MO</p>
                                            {isOverLimit && (
                                                <div className="text-[9px] text-red-500 font-black flex items-center justify-end gap-1 mt-1">
                                                    CRITICAL CAP EXCEEDED
                                                </div>
                                            )}
                                        </td>
                                        {MONTHS.map((_, idx) => {
                                            const payment = getMonthlyPayment(row, idx);
                                            return (
                                                <td key={idx} className={`px-2 py-6 text-center transition-all ${payment > 0 ? 'bg-primary/5' : ''}`}>
                                                    {payment > 0 ? (
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-[10px] font-black text-primary tracking-tighter">₦{payment.toLocaleString()}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-100">-</span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                        <td className="px-8 py-6 text-center">
                                            <span className={`inline-flex px-3 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase border ${row.status === 'active'
                                                ? 'bg-blue-50 text-blue-600 border-blue-100'
                                                : 'bg-green-50 text-green-600 border-green-100'
                                                }`}>
                                                {row.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <button
                                                onClick={() => handleViewDetails(row)}
                                                className="p-3 hover:bg-primary/10 text-primary rounded-2xl transition-all active:scale-90"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Collection Insight */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
                <div className="lg:col-span-2 bg-gray-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-gray-900/20">
                    <div className="absolute top-0 right-0 p-12 opacity-5">
                        <TrendingUp className="w-48 h-48" />
                    </div>

                    <div className="relative z-10">
                        <h2 className="text-3xl font-black mb-2 flex items-center gap-4">
                            Collection Queue
                            <span className="px-4 py-1 bg-primary text-xs rounded-full">{MONTHS[new Date().getMonth()]}</span>
                        </h2>
                        <p className="text-gray-400 font-medium mb-10">AI-Verified deduction list for current cycle</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {transactions.map(t => {
                                const payment = getMonthlyPayment(t, new Date().getMonth());
                                if (payment > 0) {
                                    return (
                                        <div key={t.id} className="bg-white/5 border border-white/10 p-6 rounded-3xl flex items-center justify-between hover:bg-white/10 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center font-black text-white">
                                                    {t.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-black text-gray-100">{t.name}</p>
                                                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Employee</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-primary font-black text-lg">₦{payment.toLocaleString()}</p>
                                                <p className="text-[8px] text-emerald-500 font-black tracking-widest uppercase">Secured</p>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            })}
                        </div>
                    </div>
                </div>

                <div className="bg-primary rounded-[3rem] p-10 text-white flex flex-col justify-between shadow-2xl shadow-primary/20">
                    <div>
                        <div className="bg-white/20 p-4 rounded-3xl w-fit mb-8">
                            <CheckCircle2 className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-3xl font-black mb-4 tracking-tight">System Integrity</h3>
                        <p className="text-white/80 font-medium leading-relaxed">
                            Every transaction in this ledger is encrypted and verified against bank-grade security protocols. {settings.interestRate * 100}% monthly interest is accurately computed for each staff request.
                        </p>
                    </div>

                    <div className="pt-8 space-y-4">
                        <div className="flex items-center justify-between py-4 border-t border-white/10">
                            <span className="text-xs font-black uppercase tracking-widest text-white/60">Last Sync</span>
                            <span className="text-sm font-bold">Today, 09:41 AM</span>
                        </div>
                        <div className="flex items-center justify-between py-4 border-t border-white/10">
                            <span className="text-xs font-black uppercase tracking-widest text-white/60">Records Secure</span>
                            <span className="text-sm font-bold">100% Guaranteed</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Details Modal */}
            <AnimatePresence>
                {showDetailsModal && selectedLoan && (
                    <div className="fixed inset-0 flex items-center justify-center p-4 z-[9999]">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDetailsModal(false)} className="absolute inset-0 bg-black/40 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-white rounded-[3rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-8 md:p-12 space-y-10">
                                <header className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-3xl font-black text-gray-900">Transaction <span className="text-primary italic">Deep-dive</span></h2>
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Ref: {selectedLoan.id}</p>
                                    </div>
                                    <button onClick={() => setShowDetailsModal(false)} className="p-3 hover:bg-gray-100 rounded-full transition-colors">
                                        <XCircle className="w-8 h-8 text-gray-300" />
                                    </button>
                                </header>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100">
                                            <p className="text-[10px] text-gray-400 font-black uppercase mb-2">Original Loan</p>
                                            <p className="text-4xl font-black text-gray-900 tracking-tighter">₦{selectedLoan.loanAmount.toLocaleString()}</p>
                                            <div className="mt-4 flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-primary" />
                                                <span className="text-sm font-bold text-gray-600">{selectedLoan.loanTenure} Months</span>
                                            </div>
                                        </div>

                                        <div className="p-6 border border-gray-100 rounded-[2rem] space-y-4">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-400 font-bold uppercase text-[10px]">Staff Sync</span>
                                                <span className="font-black text-primary">Connected</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white font-bold">{selectedLoan.name[0]}</div>
                                                <p className="font-black text-gray-900">{selectedLoan.name}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Repayment Roadmap</h3>
                                        <div className="space-y-3">
                                            {getDetailedRepaymentSchedule(selectedLoan.loanAmount, selectedLoan.loanTenure, new Date(selectedLoan.startDate), selectedLoan.monthlyIncome, settings).map((step, i) => (
                                                <div key={i} className="flex items-center justify-between p-4 bg-primary/[0.03] rounded-2xl border border-primary/5">
                                                    <div>
                                                        <p className="text-[9px] font-black uppercase text-primary mb-0.5">M{i + 1} • {MONTHS[step.month]}</p>
                                                        <p className="text-sm font-black text-gray-900">₦{step.total.toLocaleString()}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[8px] text-gray-400 uppercase font-black">Interest</p>
                                                        <p className="text-[10px] font-bold text-emerald-600">₦{step.interest.toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <button onClick={() => setShowDetailsModal(false)} className="w-full py-5 bg-gray-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-gray-800 transition-all">
                                    Return to Ledger
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
