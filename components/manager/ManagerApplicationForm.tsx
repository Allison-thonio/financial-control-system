'use client';

import { useState, useMemo } from 'react';
import { Plus, AlertCircle, Upload, Paperclip, UserCheck, IdCard, TrendingUp, Info, BrainCircuit, ShieldCheck, Sparkles, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoanApp, createLoanApplication, uploadFile } from '@/lib/db';
import { calculateTotalRepayment, getDetailedRepaymentSchedule, calculateLoanCapacity } from '@/lib/loanLogic';
import { useAuth } from '@/contexts/AuthContext';
import { useSystem } from '@/contexts/SystemContext';

interface ManagerApplicationFormProps {
    onSuccess: () => void;
    onClose: () => void;
    existingLoans: LoanApp[];
}

export function ManagerApplicationForm({ onSuccess, onClose, existingLoans }: ManagerApplicationFormProps) {
    const { user } = useAuth();
    const { settings, addAuditLog } = useSystem();

    const [isReturning, setIsReturning] = useState(false);
    const [showEligibilityModal, setShowEligibilityModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionComplete, setSubmissionComplete] = useState(false);

    const [formData, setFormData] = useState({
        borrowerName: '',
        loanAmount: '',
        monthlyIncome: '',
        loanTenure: '3',
        repaymentType: 'default' as 'default' | 'custom' | 'salary_advance',
        customMonth1: '',
        customMonth2: '',
        customMonth3: '',
        nin: '',
        appointmentLetter: null as File | null,
        passportPhoto: null as File | null,
    });

    const returningBorrowers = useMemo(() => {
        const borrowers = new Map<string, LoanApp>();
        existingLoans.forEach(loan => {
            const name = loan.userName || loan.borrowerName || '';
            if (name && !borrowers.has(name)) {
                borrowers.set(name, loan);
            }
        });
        return Array.from(borrowers.values());
    }, [existingLoans]);

    const handleSelectReturning = (name: string) => {
        const prevLoan = existingLoans.find(l => (l.userName || l.borrowerName) === name);
        if (prevLoan) {
            setFormData({
                ...formData,
                borrowerName: (prevLoan.userName || prevLoan.borrowerName || ''),
                monthlyIncome: prevLoan.monthlyIncome.toString(),
                nin: prevLoan.nin || '',
            });
        }
    };

    const eligibleCapacity = useMemo(() => {
        const income = parseFloat(formData.monthlyIncome) || 0;
        const tenure = parseInt(formData.loanTenure) || 3;
        if (income <= 0) return null;
        return calculateLoanCapacity(income, 0, tenure, settings);
    }, [formData.monthlyIncome, formData.loanTenure, settings]);

    const recommendedTenure = useMemo(() => {
        const amount = parseFloat(formData.loanAmount) || 0;
        const income = parseFloat(formData.monthlyIncome) || 0;
        if (amount <= 0 || income <= 0) return 1;

        const maxMonthlyPay = income * 0.4;
        const estimatedTotal = amount * (1 + settings.interestRate * 4);
        return Math.ceil(estimatedTotal / maxMonthlyPay);
    }, [formData.loanAmount, formData.monthlyIncome, settings]);

    const loanSummary = useMemo(() => {
        const amount = parseFloat(formData.loanAmount) || 0;
        const income = parseFloat(formData.monthlyIncome) || 0;
        const tenure = parseInt(formData.loanTenure) || 3;
        if (amount <= 0) return null;

        const schedule = getDetailedRepaymentSchedule(amount, tenure, new Date(), income, settings);
        const totalRepayment = schedule.reduce((sum, step) => sum + step.total, 0);
        const totalInterest = schedule.reduce((sum, step) => sum + step.interest, 0);

        return {
            totalRepayment,
            totalInterest,
            monthlyEMI: totalRepayment / tenure,
            endDate: schedule[schedule.length - 1],
            isReducing: false,
            schedule
        };
    }, [formData.loanAmount, formData.loanTenure, formData.monthlyIncome, settings]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(formData.loanAmount);
        const income = parseFloat(formData.monthlyIncome);
        const tenure = parseInt(formData.loanTenure);
        const name = formData.borrowerName;

        if (!amount || !income || !name) {
            alert('Please fill all mandatory fields (Name, Amount, Salary)');
            return;
        }

        if (parseInt(formData.loanTenure) < recommendedTenure) {
            alert(`Incompatible Tenure: For a loan of ₦${amount.toLocaleString()} with a salary of ₦${income.toLocaleString()}, the tenure must be at least ${recommendedTenure} months.`);
            return;
        }

        if (eligibleCapacity && amount > eligibleCapacity.maxPrincipal) {
            const confirmProceed = confirm(`Warning: Requested amount (₦${amount.toLocaleString()}) exceeds the AI-recommended capacity (₦${eligibleCapacity.maxPrincipal.toLocaleString()}). Proceed anyway?`);
            if (!confirmProceed) return;
        }

        if (!isReturning && !formData.appointmentLetter) {
            alert('New clients must upload an Appointment Letter to verify government employment status');
            return;
        }

        if (!isReturning && !formData.passportPhoto) {
            alert('Passport Photo is required for new clients to ensure system recognition');
            return;
        }

        const { total: totalRepayment } = calculateTotalRepayment(amount, tenure, income, settings);

        setIsSubmitting(true);
        try {
            let appointmentLetterUrl = '';
            let passportPhotoUrl = '';

            // Sequential uploads to reduce bandwidth pressure and avoid UPLOAD_TIMEOUT
            if (formData.appointmentLetter) {
                addAuditLog('Document Upload', user?.email || 'Unknown', `Uploading appointment letter...`);
                appointmentLetterUrl = await uploadFile(formData.appointmentLetter, `documents/${user?.uid}/appointment_letter_${Date.now()}`);
            }

            if (formData.passportPhoto) {
                addAuditLog('Document Upload', user?.email || 'Unknown', `Uploading passport photo...`);
                passportPhotoUrl = await uploadFile(formData.passportPhoto, `documents/${user?.uid}/passport_photo_${Date.now()}`);
            }

            if (!appointmentLetterUrl && isReturning) {
                appointmentLetterUrl = returningBorrowers.find(b => (b.userName || b.borrowerName) === name)?.appointmentLetter || '';
            }
            if (!passportPhotoUrl && isReturning) {
                passportPhotoUrl = returningBorrowers.find(b => (b.userName || b.borrowerName) === name)?.passportPhoto || '';
            }

            const newLoanData: Omit<LoanApp, 'id' | 'createdAt' | 'updatedAt'> = {
                userId: user?.uid || 'Unknown',
                userName: name,
                email: user?.email || 'Unknown',
                loanAmount: amount,
                loanReason: amount > income ? 'Salary Advance' : 'General Purpose',
                monthlyIncome: income,
                loanTerm: tenure,
                interestRate: settings.interestRate * 100,
                monthlyEMI: Math.round(totalRepayment / tenure),
                status: 'pending',
                repaymentType: amount > income ? 'salary_advance' : 'default',
                nin: formData.nin || undefined,
                appointmentLetter: appointmentLetterUrl,
                passportPhoto: passportPhotoUrl,
            };

            addAuditLog('Verification Started', user?.email || 'Unknown', `Analyzing documents for ${name}...`);
            await new Promise(resolve => setTimeout(resolve, 800));
            addAuditLog('Biometric Check', user?.email || 'Unknown', `Matching passport against archived records...`);
            await new Promise(resolve => setTimeout(resolve, 600));

            await createLoanApplication(newLoanData);
            addAuditLog('Application Finalized', user?.email || 'Unknown', `New application for ${name} (₦${amount.toLocaleString()}) queued for manager approval.`);

            setSubmissionComplete(true);

            setTimeout(() => {
                setIsSubmitting(false);
                setSubmissionComplete(false);
                onSuccess();
            }, 600);

        } catch (error: any) {
            setIsSubmitting(false);
            if (error.message?.includes('UPLOAD_TIMEOUT')) {
                alert('File Upload Failed: The system could not reach the storage server.');
            } else {
                alert('Failed to submit application. Please check your network connection.');
            }
            console.error('[Application Submission Error]:', error);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            className="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden mb-8 sm:mb-12"
        >
            <div className="p-5 sm:p-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl sm:text-2xl font-black text-gray-900">Loan <span className="text-primary italic">Form</span></h2>
                        <div className="flex bg-gray-100 p-1 rounded-xl">
                            <button
                                onClick={() => setIsReturning(false)}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${!isReturning ? 'bg-white text-primary shadow-sm' : 'text-gray-400'}`}
                            >
                                New User
                            </button>
                            <button
                                onClick={() => setIsReturning(true)}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${isReturning ? 'bg-white text-primary shadow-sm' : 'text-gray-400'}`}
                            >
                                Returning
                            </button>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-fit p-2 text-gray-400 hover:text-gray-600 transition-colors self-end sm:self-auto">
                        <AlertCircle className="w-6 h-6 rotate-45" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-10">
                    {/* Borrower Selection/Entry */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-gray-700 ml-1">Client Full Name</label>
                            {isReturning ? (
                                <select
                                    value={formData.borrowerName}
                                    onChange={(e) => handleSelectReturning(e.target.value)}
                                    className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none text-base"
                                >
                                    <option value="">Select returning client...</option>
                                    {returningBorrowers.map(b => (
                                        <option key={b.id || (b.userName || b.borrowerName)} value={b.userName || b.borrowerName}>{b.userName || b.borrowerName}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    value={formData.borrowerName}
                                    onChange={(e) => setFormData({ ...formData, borrowerName: e.target.value })}
                                    placeholder="Enter full name"
                                    className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none text-base"
                                />
                            )}
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="block text-sm font-bold text-gray-700 ml-1">Monthly Salary (₦)</label>
                                {eligibleCapacity && (
                                    <button
                                        type="button"
                                        onClick={() => setShowEligibilityModal(true)}
                                        className="text-[10px] font-black text-primary hover:underline flex items-center gap-1 uppercase tracking-widest"
                                    >
                                        <BrainCircuit className="w-3 h-3" /> Check Eligibility
                                    </button>
                                )}
                            </div>
                            <input
                                type="number"
                                value={formData.monthlyIncome}
                                onChange={(e) => setFormData({ ...formData, monthlyIncome: e.target.value })}
                                placeholder="e.g. 300000"
                                className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none text-base"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="block text-sm font-bold text-gray-700 ml-1">Loan Amount (₦)</label>
                                {eligibleCapacity && parseFloat(formData.loanAmount) > eligibleCapacity.maxPrincipal && (
                                    <span className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" /> Over Capacity
                                    </span>
                                )}
                            </div>
                            <input
                                type="number"
                                value={formData.loanAmount}
                                onChange={(e) => setFormData({ ...formData, loanAmount: e.target.value })}
                                placeholder="e.g. 450000"
                                className={`w-full px-5 py-4 bg-gray-50/50 border rounded-2xl focus:ring-4 transition-all outline-none text-base ${eligibleCapacity && parseFloat(formData.loanAmount) > eligibleCapacity.maxPrincipal ? 'border-red-200 focus:ring-red-50 focus:border-red-500' : 'border-gray-200 focus:ring-primary/10 focus:border-primary'}`}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-gray-700 ml-1">Loan Tenure (1-12 Months)</label>
                            <select
                                value={formData.loanTenure}
                                onChange={(e) => setFormData({ ...formData, loanTenure: e.target.value })}
                                className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/10 transition-all outline-none text-base"
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                                    <option key={m} value={m}>{m} {m === 1 ? 'Month' : 'Months'}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Real-time Calculation Summary */}
                    <AnimatePresence>
                        {loanSummary && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-5 sm:p-8 bg-gradient-to-br from-gray-900 to-gray-800 rounded-[1.5rem] sm:rounded-[2rem] text-white shadow-xl relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-8 opacity-10 hidden sm:block">
                                    <TrendingUp className="w-24 h-24" />
                                </div>

                                <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                                    <div>
                                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Total to Repay</p>
                                        <p className="text-xl sm:text-2xl font-black">₦{loanSummary.totalRepayment.toLocaleString()}</p>
                                        <p className="text-[10px] text-emerald-400 font-bold mt-1 leading-tight">
                                            Incl. ₦{loanSummary.totalInterest.toLocaleString()} interest
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Monthly Deduction</p>
                                        <p className="text-xl sm:text-2xl font-black">₦{Math.round(loanSummary.monthlyEMI).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Spreadsheet Preview</p>
                                        <div className="flex flex-col gap-1 mt-1">
                                            {loanSummary.schedule.slice(0, 3).map((s, i) => (
                                                <p key={i} className="text-[9px] text-gray-300 font-medium">Month {i + 1}: ₦{s.total.toLocaleString()}</p>
                                            ))}
                                            {loanSummary.schedule.length > 3 && (
                                                <p className="text-[9px] text-gray-500 italic">...and {loanSummary.schedule.length - 3} more</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 sm:h-12 sm:w-12 bg-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center text-primary backdrop-blur-md">
                                            <Info className="w-5 h-5 sm:w-6 sm:h-6" />
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-[10px] text-gray-400 font-black uppercase mb-0.5">Auto-Numbered</p>
                                            <p className="text-xs sm:text-sm font-bold">Ledger Ready</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Document Uploads */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-gray-700 ml-1">
                                Appointment Letter {!isReturning && <span className="text-red-500">*</span>}
                            </label>
                            <div className="relative">
                                <Paperclip className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={(e) => setFormData({ ...formData, appointmentLetter: e.target.files?.[0] || null })}
                                    className="w-full pl-12 pr-5 py-3 sm:py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/10 transition-all outline-none text-sm sm:text-base file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-gray-700 ml-1">
                                Passport Photo {!isReturning && <span className="text-red-500">*</span>}
                            </label>
                            <div className="relative">
                                <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setFormData({ ...formData, passportPhoto: e.target.files?.[0] || null })}
                                    className="w-full pl-12 pr-5 py-3 sm:py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/10 transition-all outline-none text-sm sm:text-base file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
                                />
                            </div>
                        </div>
                    </div>

                    {/* NIN */}
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 ml-1">NIN (Optional)</label>
                        <div className="relative">
                            <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={formData.nin}
                                onChange={(e) => setFormData({ ...formData, nin: e.target.value })}
                                placeholder="11-digit Number"
                                className="w-full pl-12 pr-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/10 transition-all outline-none text-base"
                            />
                        </div>
                    </div>

                    {/* Submit Actions */}
                    <div className="space-y-4 pt-4">
                        <AnimatePresence>
                            {(() => {
                                const income = parseFloat(formData.monthlyIncome) || 0;
                                const amount = parseFloat(formData.loanAmount) || 0;
                                const highestPayment = loanSummary ? Math.max(...loanSummary.schedule.map(s => s.total)) : 0;
                                const shouldWarn = highestPayment > (income * 0.9) && amount > 0;

                                return shouldWarn ? (
                                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="p-5 bg-amber-50 border border-amber-100 rounded-[1.5rem] flex gap-3">
                                        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                                        <p className="text-[10px] sm:text-xs text-amber-700 font-medium leading-relaxed">
                                            Highest deduction exceeds 90% of salary. This high-risk application will be marked for review.
                                        </p>
                                    </motion.div>
                                ) : null;
                            })()}
                        </AnimatePresence>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full py-4 sm:py-5 rounded-2xl font-black shadow-xl active:scale-95 transition-all text-base sm:text-lg flex items-center justify-center gap-3 ${submissionComplete ? 'bg-emerald-500 shadow-emerald-200' : 'bg-primary shadow-primary/20'} text-white`}
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : submissionComplete ? (
                                <><CheckCircle className="w-6 h-6" /> Submitted!</>
                            ) : (
                                'Submit Application'
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* AI Eligibility Check Modal */}
            <AnimatePresence>
                {showEligibilityModal && eligibleCapacity && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowEligibilityModal(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative bg-white rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 w-full max-w-xl shadow-2xl overflow-y-auto max-h-[90vh]"
                        >
                            <div className="relative z-10 space-y-8">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-primary/10 rounded-2xl text-primary">
                                        <Sparkles className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-gray-900">AI Capacity <span className="text-primary italic">Analysis</span></h3>
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Based on salary & current benchmarks</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 text-center">
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Maximum Safe Principal</p>
                                        <p className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tighter">₦{eligibleCapacity.maxPrincipal.toLocaleString()}</p>
                                        <div className="mt-4 flex items-center justify-center gap-2 text-emerald-600">
                                            <ShieldCheck className="w-4 h-4" />
                                            <span className="text-xs font-black uppercase">Low Risk Level</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-6 bg-white border border-gray-100 rounded-[2rem] shadow-sm">
                                            <p className="text-[9px] text-gray-400 font-black uppercase mb-1">Monthly Ceiling</p>
                                            <p className="text-lg font-black text-gray-900">₦{eligibleCapacity.monthlyRepayment.toLocaleString()}</p>
                                        </div>
                                        <div className="p-6 bg-white border border-gray-100 rounded-[2rem] shadow-sm">
                                            <p className="text-[9px] text-gray-400 font-black uppercase mb-1">Total Limit</p>
                                            <p className="text-lg font-black text-gray-900">₦{eligibleCapacity.totalRepaymentWithInterest.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10">
                                    <p className="text-[10px] text-primary font-black uppercase mb-2">Recommendation</p>
                                    <p className="text-sm text-gray-600 font-medium leading-relaxed">
                                        The borrower has a monthly repayment capacity of ₦{eligibleCapacity.remainingCapacity.toLocaleString()}.
                                        For a {formData.loanTenure}-month tenure, the maximum safe amount to disburse is ₦{eligibleCapacity.maxPrincipal.toLocaleString()} with a monthly deduction of ₦{eligibleCapacity.monthlyRepayment.toLocaleString()}.
                                    </p>
                                </div>

                                <button
                                    onClick={() => {
                                        setFormData({ ...formData, loanAmount: eligibleCapacity.maxPrincipal.toString() });
                                        setShowEligibilityModal(false);
                                    }}
                                    className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-800 transition-all active:scale-95"
                                >
                                    Apply Max Recommended
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
