'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Banknote,
    CheckCircle2,
    Clock,
    Search,
    Filter,
    ExternalLink,
    ArrowRight,
    Wallet,
    AlertCircle,
    UserCheck,
    CreditCard,
    TrendingUp,
    History as HistoryIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoanApp, getAllLoans, updateLoanStatus, MonthlyBudget, setMonthlyBudget, getMonthlyBudget, getAllMonthlyBudgets, calculateMonthlyActualDisbursement } from '@/lib/db';
import { useSystem } from '@/contexts/SystemContext';
import { useAuth } from '@/contexts/AuthContext';

export function ManagerDisbursement() {
    const { user } = useAuth();
    const { addAuditLog } = useSystem();
    const [loans, setLoans] = useState<LoanApp[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [monthlyBudget, setMonthlyBudgetState] = useState<MonthlyBudget | null>(null);
    const [allBudgets, setAllBudgets] = useState<MonthlyBudget[]>([]);
    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const [showPastDisbursements, setShowPastDisbursements] = useState(false);
    const [targetAmountInput, setTargetAmountInput] = useState('');
    const [isSavingBudget, setIsSavingBudget] = useState(false);

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    useEffect(() => {
        fetchLoans();
    }, []);

    const fetchLoans = async () => {
        setIsLoading(true);
        try {
            const [allLoans, budget, pastBudgets] = await Promise.all([
                getAllLoans(),
                getMonthlyBudget(currentMonth, currentYear),
                getAllMonthlyBudgets()
            ]);

            setLoans(allLoans);
            setMonthlyBudgetState(budget);
            setAllBudgets(pastBudgets);

            if (budget) {
                setTargetAmountInput(budget.expectedAmount.toString());
            }

            // Sync actual amount
            await calculateMonthlyActualDisbursement(currentMonth, currentYear);
            const updatedBudget = await getMonthlyBudget(currentMonth, currentYear);
            setMonthlyBudgetState(updatedBudget);

        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveBudget = async () => {
        setIsSavingBudget(true);
        try {
            const amount = parseFloat(targetAmountInput);
            if (isNaN(amount)) throw new Error('Invalid amount');

            await setMonthlyBudget(currentMonth, currentYear, amount);
            await fetchLoans();
            setShowBudgetModal(false);
        } catch (error) {
            alert('Failed to save target. Please enter a valid number.');
        } finally {
            setIsSavingBudget(false);
        }
    };

    const approvedLoans = useMemo(() => {
        return loans.filter(l => l.status === 'approved');
    }, [loans]);

    const filteredLoans = useMemo(() => {
        return approvedLoans.filter(l =>
            l.borrowerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            l.staffEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
            l.id?.includes(searchQuery)
        );
    }, [approvedLoans, searchQuery]);

    const totalToDisburse = useMemo(() => {
        return approvedLoans.reduce((sum, l) => sum + l.loanAmount, 0);
    }, [approvedLoans]);

    const handleDisburse = async (loan: LoanApp) => {
        if (!loan.id) return;

        if (loan.loanAmount >= 1000000) {
            const confirmed = window.confirm(`HIGH-VALUE TRANSACTION ALERT: You are about to authorize a disbursement of ₦${loan.loanAmount.toLocaleString()}. Please confirm you have verified the recipient's bank details.`);
            if (!confirmed) return;
        }

        setProcessingId(loan.id);
        try {
            // Simulate a bank api call delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            await updateLoanStatus(loan.id, 'disbursed');

            addAuditLog(
                'Funds Disbursed',
                user?.email || 'Manager',
                `HIGH-VALUE: Disbursed ₦${loan.loanAmount.toLocaleString()} to ${loan.borrowerName} (Loan ID: ${loan.id})`
            );

            await fetchLoans();
            alert(`Transfer Successful: ₦${loan.loanAmount.toLocaleString()} has been queued for bank settlement.`);
        } catch (error) {
            alert('Failed to process disbursement');
        } finally {
            setProcessingId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="mt-2 text-gray-600 font-bold">Querying Approved Grants...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        Fund <span className="text-primary italic">Disbursement</span>
                        <Banknote className="w-8 h-8 text-primary/20" />
                    </h1>
                    <p className="text-gray-500 font-medium">Final authorization and bank transfer gateway</p>
                </div>

                <div className="flex flex-wrap gap-4">
                    <button
                        onClick={() => setShowBudgetModal(true)}
                        className="bg-white px-6 py-4 rounded-[1.5rem] border border-gray-100 shadow-sm flex items-center gap-3 hover:bg-gray-50 transition-all font-bold text-sm"
                    >
                        <TrendingUp className="w-5 h-5 text-primary" />
                        {monthlyBudget ? 'Update Target' : 'Set Monthly Target'}
                    </button>
                    <button
                        onClick={() => setShowPastDisbursements(true)}
                        className="bg-gray-900 text-white px-6 py-4 rounded-[1.5rem] shadow-xl shadow-gray-900/10 flex items-center gap-3 hover:bg-gray-800 transition-all font-bold text-sm"
                    >
                        <HistoryIcon className="w-5 h-5 text-primary" />
                        Past Disbursements
                    </button>
                </div>

                <div className="bg-gray-900 px-8 py-4 rounded-[2rem] text-white flex items-center gap-6 shadow-xl shadow-gray-900/10">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Expected Transfer</p>
                        <p className="text-2xl font-black">₦{monthlyBudget?.expectedAmount.toLocaleString() || '0'}</p>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Actual Disbursed</p>
                        <p className="text-2xl font-black text-emerald-400">₦{monthlyBudget?.actualAmount.toLocaleString() || '0'}</p>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pending Count</p>
                        <p className="text-2xl font-black">{approvedLoans.length}</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <aside className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight mb-6 flex items-center gap-2">
                            <Filter className="w-4 h-4 text-primary" />
                            Search Filters
                        </h3>
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Ref ID, Name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-primary/5 transition-all text-sm font-bold"
                            />
                        </div>
                    </div>

                    <div className="bg-primary p-8 rounded-[2.5rem] text-white shadow-xl shadow-primary/20">
                        <CreditCard className="w-10 h-10 mb-4 opacity-50" />
                        <h3 className="text-lg font-black leading-tight mb-2">Automated Payouts</h3>
                        <p className="text-xs text-white/70 font-medium">Funds are released directly to the linked employee bank account upon authorization.</p>
                    </div>
                </aside>

                <main className="lg:col-span-3">
                    {filteredLoans.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <AnimatePresence mode="popLayout">
                                {filteredLoans.map((loan) => (
                                    <motion.div
                                        key={loan.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="bg-white border border-gray-100 p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:shadow-gray-900/5 transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="w-14 h-14 bg-gray-50 rounded-[1.2rem] flex items-center justify-center font-black text-gray-900 text-xl group-hover:bg-primary group-hover:text-white transition-colors">
                                                {loan.borrowerName.charAt(0)}
                                            </div>
                                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                                                Ready
                                            </span>
                                        </div>

                                        <div className="mb-8">
                                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-1">Recipient</p>
                                            <h4 className="text-xl font-black text-gray-900">{loan.borrowerName}</h4>
                                            <p className="text-xs text-gray-500 font-medium">{loan.staffEmail}</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-8">
                                            <div className="p-4 bg-gray-50 rounded-2xl">
                                                <p className="text-[9px] text-gray-400 font-black uppercase mb-1">Grant Amount</p>
                                                <p className="text-lg font-black text-gray-900">₦{loan.loanAmount.toLocaleString()}</p>
                                            </div>
                                            <div className="p-4 bg-gray-50 rounded-2xl">
                                                <p className="text-[9px] text-gray-400 font-black uppercase mb-1">Tenure</p>
                                                <p className="text-lg font-black text-gray-900">{loan.loanTenure} MO</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleDisburse(loan)}
                                            disabled={!!processingId}
                                            className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-primary transition-all shadow-lg hover:shadow-primary/30"
                                        >
                                            {processingId === loan.id ? (
                                                <>
                                                    <Clock className="w-4 h-4 animate-spin" />
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    Authorize & Transfer
                                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                </>
                                            )}
                                        </button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="bg-white rounded-[3rem] border border-dashed border-gray-200 p-20 text-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <UserCheck className="w-10 h-10 text-gray-200" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-2">Queue is Clear</h3>
                            <p className="text-gray-400 text-sm font-medium">All approved loans have been processed or no approvals exist yet.</p>
                        </div>
                    )}
                </main>
            </div>

            {/* Monthly Target Modal */}
            <AnimatePresence>
                {showBudgetModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowBudgetModal(false)} className="absolute inset-0 bg-black/40 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-white rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl">
                            <h3 className="text-2xl font-black mb-6 text-gray-900">Set Monthly <span className="text-primary italic">Target</span></h3>
                            <p className="text-sm text-gray-500 font-medium mb-8">Define the total amount expected to be disbursed for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.</p>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Target Amount (₦)</label>
                                    <input
                                        type="number"
                                        value={targetAmountInput}
                                        onChange={(e) => setTargetAmountInput(e.target.value)}
                                        placeholder="e.g. 5000000"
                                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-primary/10 transition-all font-black text-lg"
                                    />
                                </div>
                                <button
                                    onClick={handleSaveBudget}
                                    disabled={isSavingBudget}
                                    className="w-full py-5 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-95 transition-all flex items-center justify-center gap-3"
                                >
                                    {isSavingBudget ? <Clock className="w-5 h-5 animate-spin" /> : 'Confirm Target'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Past Disbursements Modal */}
            <AnimatePresence>
                {showPastDisbursements && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPastDisbursements(false)} className="absolute inset-0 bg-black/40 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-white rounded-[3rem] p-10 w-full max-w-4xl max-h-[80vh] overflow-y-auto shadow-2xl">
                            <div className="flex justify-between items-center mb-10">
                                <h3 className="text-3xl font-black text-gray-900">Past <span className="text-primary italic">Disbursements</span></h3>
                                <button onClick={() => setShowPastDisbursements(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                    <AlertCircle className="w-8 h-8 rotate-45" />
                                </button>
                            </div>

                            {allBudgets.length > 0 ? (
                                <div className="space-y-4">
                                    {allBudgets.map((budget) => (
                                        <div key={budget.id} className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
                                            <div>
                                                <p className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-1">{new Date(budget.year, budget.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                                                <h4 className="text-xl font-black text-gray-900 tracking-tight">Financial Performance</h4>
                                            </div>
                                            <div className="flex gap-8">
                                                <div className="text-center">
                                                    <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Target</p>
                                                    <p className="text-lg font-black text-gray-900">₦{budget.expectedAmount.toLocaleString()}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Actual</p>
                                                    <p className="text-lg font-black text-emerald-600">₦{budget.actualAmount.toLocaleString()}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Fulfillment</p>
                                                    <p className={`text-lg font-black ${budget.actualAmount >= budget.expectedAmount ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                        {budget.expectedAmount > 0 ? ((budget.actualAmount / budget.expectedAmount) * 100).toFixed(0) : 0}%
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-20 text-center bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-200">
                                    <Clock className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                                    <p className="text-gray-400 font-bold">No historical data available yet.</p>
                                </div>
                            )}

                            <button onClick={() => setShowPastDisbursements(false)} className="w-full mt-10 py-5 bg-gray-100 text-gray-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all">Close History</button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
