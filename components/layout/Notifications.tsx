'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Bell, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllLoans } from '@/lib/db';
import { getDetailedRepaymentSchedule } from '@/lib/loanLogic';
import { useSystem } from '@/contexts/SystemContext';
import { useAuth } from '@/contexts/AuthContext';

export function Notifications() {
    const { user } = useAuth();
    const { settings } = useSystem();
    const [isOpen, setIsOpen] = useState(false);
    const [counts, setCounts] = useState({ pending: 0, collection: 0 });
    const [loading, setLoading] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

    const role = user?.role || 'staff';

    useEffect(() => {
        const fetchMetrics = async () => {
            if (!user) return;

            try {
                const loans = await getAllLoans();
                const currentMonth = new Date().getMonth();
                const currentYear = new Date().getFullYear();

                const pending = loans.filter(l => l.status === 'pending').length;

                const collection = loans.filter(l => l.status === 'approved' || l.status === 'disbursed').filter(loan => {
                    const createdAt = typeof loan.createdAt === 'string' ? new Date(loan.createdAt) :
                        (loan.createdAt && typeof (loan.createdAt as any).toDate === 'function' ? (loan.createdAt as any).toDate() : new Date('2024-01-01'));
                    const schedule = getDetailedRepaymentSchedule(loan.loanAmount, loan.loanTerm, createdAt, loan.monthlyIncome, settings);
                    return schedule.some(s => s.month === currentMonth && s.year === currentYear);
                }).length;

                setCounts({ pending, collection });
            } catch (error) {
                console.error('Failed to fetch notification metrics:', error);
            } finally {
                setLoading(false);
            }
        };

        if (isOpen) {
            fetchMetrics();
        } else {
            // Initial fetch
            fetchMetrics();
        }
    }, [user, settings, isOpen]);

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const hasNotifications = counts.pending > 0 || counts.collection > 0;

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-gray-400 hover:text-primary transition-colors relative focus:outline-none"
            >
                <Bell className="w-5 h-5" />
                {hasNotifications && !loading && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-[100]"
                    >
                        <div className="p-4 border-b border-gray-50 flex justify-between items-center">
                            <h3 className="font-black text-gray-900 text-sm uppercase tracking-wide">Notifications</h3>
                            {loading && <div className="animate-spin w-3 h-3 border-2 border-primary border-t-transparent rounded-full"></div>}
                        </div>

                        <div className="max-h-[300px] overflow-y-auto p-2 space-y-2">
                            {counts.collection > 0 && (
                                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-3">
                                    <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600 shrink-0">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-gray-900 uppercase tracking-wide">Collection Due</p>
                                        <p className="text-xs text-gray-600 font-medium mt-1">
                                            {counts.collection} {counts.collection === 1 ? 'loan is' : 'loans are'} due for collection this month.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {counts.pending > 0 && role === 'manager' && (
                                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600 shrink-0">
                                        <AlertCircle className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-gray-900 uppercase tracking-wide">Pending Approvals</p>
                                        <p className="text-xs text-gray-600 font-medium mt-1">
                                            {counts.pending} new {counts.pending === 1 ? 'application' : 'applications'} awaiting your review.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {!loading && counts.collection === 0 && counts.pending === 0 && (
                                <div className="py-8 text-center text-gray-400">
                                    <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                    <p className="text-xs font-bold">No new notifications</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
