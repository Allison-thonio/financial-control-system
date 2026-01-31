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
    CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoanApp, getAllLoans, updateLoanStatus } from '@/lib/db';
import { useSystem } from '@/contexts/SystemContext';
import { useAuth } from '@/contexts/AuthContext';

export function ManagerDisbursement() {
    const { user } = useAuth();
    const { addAuditLog } = useSystem();
    const [loans, setLoans] = useState<LoanApp[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        fetchLoans();
    }, []);

    const fetchLoans = async () => {
        setIsLoading(true);
        try {
            const allLoans = await getAllLoans();
            setLoans(allLoans);
        } catch (error) {
            console.error('Failed to fetch loans:', error);
        } finally {
            setIsLoading(false);
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

        setProcessingId(loan.id);
        try {
            // Simulate a bank api call delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            await updateLoanStatus(loan.id, 'disbursed');

            addAuditLog(
                'Funds Disbursed',
                user?.email || 'Manager',
                `Disbursed ₦${loan.loanAmount.toLocaleString()} to ${loan.borrowerName} (Loan ID: ${loan.id})`
            );

            await fetchLoans();
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

                <div className="bg-gray-900 px-8 py-4 rounded-[2rem] text-white flex items-center gap-6 shadow-xl shadow-gray-900/10">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Awaiting Transfer</p>
                        <p className="text-2xl font-black">₦{totalToDisburse.toLocaleString()}</p>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Count</p>
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
        </div>
    );
}
