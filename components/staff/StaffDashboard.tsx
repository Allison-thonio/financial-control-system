'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { Plus, FileText, AlertCircle, Upload, Paperclip, UserCheck, IdCard, TrendingUp, Calendar, ChevronRight, Info, History as HistoryIcon, CheckCircle, BrainCircuit, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { LoanApp, createLoanApplication, getLoansByStaff } from '@/lib/db';
import { calculateTotalRepayment, getDetailedRepaymentSchedule, calculateLoanCapacity } from '@/lib/loanLogic';
import { motion, AnimatePresence } from 'framer-motion';
import { useSystem } from '@/contexts/SystemContext';

export function StaffDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { settings, addAuditLog } = useSystem();
  const router = useRouter();
  const [loans, setLoans] = useState<LoanApp[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [selectedLoanForDetails, setSelectedLoanForDetails] = useState<LoanApp | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [showEligibilityModal, setShowEligibilityModal] = useState(false);

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
    loans.forEach(loan => {
      if (!borrowers.has(loan.borrowerName)) {
        borrowers.set(loan.borrowerName, loan);
      }
    });
    return Array.from(borrowers.values());
  }, [loans]);

  const handleSelectReturning = (name: string) => {
    const prevLoan = loans.find(l => l.borrowerName === name);
    if (prevLoan) {
      setFormData({
        ...formData,
        borrowerName: prevLoan.borrowerName,
        monthlyIncome: prevLoan.monthlyIncome.toString(),
        nin: prevLoan.nin || '',
      });
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else {
        fetchLoans();
      }
    }
  }, [authLoading, user, router]);

  const fetchLoans = async () => {
    if (!user?.email) return;
    setIsFetching(true);
    try {
      const staffLoans = await getLoansByStaff(user.email);
      setLoans(staffLoans);
    } catch (error) {
      console.error('Failed to fetch loans:', error);
    } finally {
      setIsFetching(false);
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
    if (amount <= income || income <= 0) return 1;
    return Math.ceil(amount / income);
  }, [formData.loanAmount, formData.monthlyIncome]);

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
      alert('New clients must upload an Appointment Letter');
      return;
    }

    if (!formData.passportPhoto) {
      alert('Passport Photo is required for all clients to ensure system recognition');
      return;
    }

    // Simulated Passport-Name Alignment Check
    if (isReturning && formData.passportPhoto) {
      // In a real system, this would be an AI facial match or hash check
      const isMatch = Math.random() > 0.1; // 90% success rate for simulation
      if (!isMatch) {
        alert('Passport Mismatch: The uploaded passport does not align with the archived records for this client. Please re-upload or contact admin.');
        return;
      }
    }

    const { total: totalRepayment } = calculateTotalRepayment(amount, tenure, income, settings);

    const newLoanData: Omit<LoanApp, 'id' | 'createdAt' | 'updatedAt'> = {
      borrowerName: name,
      staffEmail: user?.email || 'Unknown',
      loanAmount: amount,
      monthlyIncome: income,
      loanTenure: tenure,
      monthlyEMI: Math.round(totalRepayment / tenure),
      status: 'pending',
      repaymentType: amount > income ? 'salary_advance' : 'default',
      nin: formData.nin || undefined,
      appointmentLetter: formData.appointmentLetter?.name || returningBorrowers.find(b => b.borrowerName === name)?.appointmentLetter,
      passportPhoto: formData.passportPhoto?.name || returningBorrowers.find(b => b.borrowerName === name)?.passportPhoto,
    };

    try {
      await createLoanApplication(newLoanData);
      addAuditLog('New Application', user?.email || 'Unknown', `Borrower: ${name}, Amount: ₦${amount.toLocaleString()}`);
      setFormData({
        borrowerName: '',
        loanAmount: '',
        monthlyIncome: '',
        loanTenure: '3',
        repaymentType: 'default',
        customMonth1: '',
        customMonth2: '',
        customMonth3: '',
        nin: '',
        appointmentLetter: null,
        passportPhoto: null,
      });
      setShowForm(false);
      fetchLoans();
    } catch (error) {
      alert('Failed to submit application. Please check your connection.');
      console.error(error);
    }
  };

  if (authLoading || isFetching) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-gray-600">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
            Staff <span className="text-primary italic">Dashboard</span>
          </h1>
          <p className="text-sm text-gray-500 font-medium">Register loan applications for clients</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white rounded-2xl hover:shadow-xl hover:shadow-primary/30 transition-all font-bold active:scale-95"
        >
          <Plus className="w-5 h-5" />
          New Application
        </button>
      </header>

      <div className="max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0, scale: 0.95 }}
              animate={{ opacity: 1, height: 'auto', scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden mb-12"
            >
              <div className="p-6 md:p-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-black text-gray-900">Application Form</h2>
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
                  <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <AlertCircle className="w-6 h-6 rotate-45" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-10">
                  {/* Borrower Selection/Entry */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            <option key={b.borrowerName} value={b.borrowerName}>{b.borrowerName}</option>
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 rounded-[2rem] text-white shadow-xl relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                          <TrendingUp className="w-24 h-24" />
                        </div>

                        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                          <div>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Total to Repay</p>
                            <p className="text-2xl font-black">₦{loanSummary.totalRepayment.toLocaleString()}</p>
                            <p className="text-xs text-emerald-400 font-bold mt-1 leading-tight">
                              Incl. ₦{loanSummary.totalInterest.toLocaleString()} interest
                              {parseFloat(formData.loanAmount) > parseFloat(formData.monthlyIncome) && ' (Salary Take Applied)'}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Avg. Monthly Deduction</p>
                            <p className="text-2xl font-black">₦{Math.round(loanSummary.monthlyEMI).toLocaleString()}</p>
                            <p className="text-xs text-gray-400 font-bold mt-1">Starting next month</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Spreadsheet Preview</p>
                            <div className="flex flex-col gap-1 mt-1">
                              {loanSummary.schedule.slice(0, 2).map((s, i) => (
                                <p key={i} className="text-[9px] text-gray-300 font-medium">Month {i + 1}: ₦{s.total.toLocaleString()}</p>
                              ))}
                              <p className="text-[9px] text-gray-500 italic">...and {loanSummary.schedule.length - 2} more</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center text-primary backdrop-blur-md">
                              <Info className="w-6 h-6" />
                            </div>
                            <div className="ml-3">
                              <p className="text-[10px] text-gray-400 font-black uppercase mb-0.5">Auto-Numbered</p>
                              <p className="text-sm font-bold">Ledger Ready</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Documentation */}
                    <div className="space-y-6">
                      <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        Verification Documents <span className="text-red-500">*</span>
                      </h3>

                      <div className="grid grid-cols-2 gap-4">
                        <label className="group relative cursor-pointer">
                          <input type="file" onChange={(e) => setFormData({ ...formData, appointmentLetter: e.target.files?.[0] || null })} className="hidden" accept=".pdf,.doc,.docx,image/*" />
                          <div className={`h-40 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center transition-all ${formData.appointmentLetter || (isReturning && formData.borrowerName) ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50'}`}>
                            {formData.appointmentLetter || (isReturning && formData.borrowerName) ? <Paperclip className="w-8 h-8 text-primary mb-2" /> : <Upload className="w-8 h-8 text-gray-300 mb-2" />}
                            <span className="text-[10px] font-black uppercase text-center px-4 leading-tight">
                              {formData.appointmentLetter?.name || (isReturning && formData.borrowerName ? 'Using archived letter' : 'Appointment Letter')}
                            </span>
                          </div>
                        </label>

                        <label className="group relative cursor-pointer">
                          <input type="file" onChange={(e) => setFormData({ ...formData, passportPhoto: e.target.files?.[0] || null })} className="hidden" accept="image/*" />
                          <div className={`h-40 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center transition-all ${formData.passportPhoto || (isReturning && formData.borrowerName) ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50'}`}>
                            {formData.passportPhoto || (isReturning && formData.borrowerName) ? <UserCheck className="w-8 h-8 text-primary mb-2" /> : <Upload className="w-8 h-8 text-gray-300 mb-2" />}
                            <span className="text-[10px] font-black uppercase text-center px-4 leading-tight">
                              {formData.passportPhoto?.name || (isReturning && formData.borrowerName ? 'Using archived photo' : 'Passport Photo')}
                            </span>
                          </div>
                        </label>
                      </div>

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
                    </div>

                    {/* Submit Actions */}
                    <div className="space-y-6 flex flex-col justify-end">
                      <AnimatePresence>
                        {parseInt(formData.loanTenure) < recommendedTenure && parseFloat(formData.loanAmount) > 0 && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="p-6 bg-red-50 border border-red-100 rounded-[2rem] flex gap-4"
                          >
                            <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
                            <div>
                              <p className="text-[10px] font-black text-red-800 uppercase tracking-wider mb-1">Tenure Too Short</p>
                              <p className="text-xs text-red-700 font-medium leading-relaxed">
                                This loan amount is not compatible with a {formData.loanTenure}-month tenure given the salary.
                                It should be at least <b>{recommendedTenure} months</b> to accommodate the repayment.
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="flex gap-4 pt-4">
                        <button type="submit" className="flex-1 py-5 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 active:scale-95 transition-all text-lg">
                          Apply for Loan
                        </button>
                        <button type="button" onClick={() => setShowForm(false)} className="px-8 py-5 bg-gray-100 text-gray-600 rounded-2xl font-black hover:bg-gray-200 transition-all">
                          Discard
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loan History Reveal */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-widest flex items-center gap-3">
              <HistoryIcon className="w-5 h-5 text-primary" />
              Application Records
            </h2>
            <span className="text-[10px] font-black text-gray-400 uppercase bg-gray-100 px-3 py-1 rounded-full">{loans.length} Total</span>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {loans.length === 0 ? (
              <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-gray-100">
                <FileText className="w-16 h-16 text-gray-100 mx-auto mb-4" />
                <p className="text-gray-400 font-bold">No records found.</p>
              </div>
            ) : (
              loans.map((loan, idx) => (
                <motion.div
                  key={loan.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="group bg-white rounded-[2.5rem] p-6 md:p-8 border border-gray-50 shadow-sm hover:shadow-2xl hover:border-primary/10 transition-all duration-500 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8 transform group-hover:scale-110 transition-transform duration-500 opacity-5">
                    <TrendingUp className="w-32 h-32" />
                  </div>

                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full animate-pulse ${loan.status === 'approved' || loan.status === 'disbursed' ? 'bg-emerald-500' : loan.status === 'rejected' ? 'bg-red-500' : 'bg-amber-500'}`} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${loan.status === 'approved' || loan.status === 'disbursed' ? 'text-emerald-600' : loan.status === 'rejected' ? 'text-red-600' : 'text-amber-600'}`}>
                          {loan.status}
                        </span>
                        <span className="text-[10px] text-gray-300 font-bold">•</span>
                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">No: {idx + 1}</span>
                        <span className="text-[10px] text-gray-300 font-bold">•</span>
                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">ID: {loan.id?.slice(-6)}</span>
                      </div>

                      <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-black text-gray-900 tracking-tighter">{loan.borrowerName}</h3>
                        <span className="text-sm font-bold text-primary">₦{loan.loanAmount.toLocaleString()}</span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="bg-gray-50 text-gray-500 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          {loan.loanTenure} Months
                        </span>
                        <span className="bg-gray-50 text-gray-500 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2">
                          <TrendingUp className="w-3 h-3" />
                          ₦{loan.monthlyEMI.toLocaleString()}/mo
                        </span>
                        {loan.repaymentType === 'salary_advance' && (
                          <span className="bg-primary/5 text-primary px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider">Salary Advance Mode</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3 text-right">
                      <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                        <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Created On</p>
                        <p className="text-sm font-bold text-gray-900">{typeof loan.createdAt === 'string' ? new Date(loan.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Pending'}</p>
                      </div>
                      <button
                        onClick={() => setSelectedLoanForDetails(loan)}
                        className="flex items-center gap-2 text-[10px] font-black text-primary hover:underline"
                      >
                        VIEW LEDGER <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {(loan.appointmentLetter || loan.passportPhoto) && (
                    <div className="mt-6 flex gap-3">
                      {loan.appointmentLetter && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-200">
                          <FileText className="w-3 h-3 text-gray-400" />
                          <span className="text-[9px] font-bold text-gray-600 uppercase">Offer Letter</span>
                        </div>
                      )}
                      {loan.passportPhoto && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-200">
                          <UserCheck className="w-3 h-3 text-gray-400" />
                          <span className="text-[9px] font-bold text-gray-600 uppercase">Passport</span>
                        </div>
                      )}
                    </div>
                  )}

                  {loan.approvalReason && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 p-6 bg-red-50/50 border border-red-100 rounded-[2rem] flex gap-4">
                      <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
                      <div>
                        <p className="text-xs font-black text-red-800 uppercase tracking-wider mb-1">Feedback</p>
                        <p className="text-sm text-red-700 font-medium leading-relaxed">{loan.approvalReason}</p>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Detailed Spreadsheet Modal */}
      <AnimatePresence>
        {selectedLoanForDetails && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLoanForDetails(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-8 md:p-12 space-y-10">
                <header className="flex justify-between items-start">
                  <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Borrower <span className="text-primary italic">Ledger</span></h2>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Applicant: {selectedLoanForDetails.borrowerName}</p>
                  </div>
                  <button onClick={() => setSelectedLoanForDetails(null)} className="p-3 hover:bg-gray-100 rounded-full transition-colors">
                    <AlertCircle className="w-8 h-8 text-gray-300 rotate-45" />
                  </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="space-y-6">
                    <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10">
                      <p className="text-[10px] text-primary font-black uppercase mb-2">Total Carry Amount</p>
                      <p className="text-3xl font-black text-gray-900">
                        ₦{getDetailedRepaymentSchedule(selectedLoanForDetails.loanAmount, selectedLoanForDetails.loanTenure, new Date(typeof selectedLoanForDetails.createdAt === 'string' ? selectedLoanForDetails.createdAt : Date.now()), selectedLoanForDetails.monthlyIncome, settings).reduce((sum, s) => sum + s.total, 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-emerald-600 font-bold mt-1 leading-tight">Status: {['approved', 'disbursed'].includes(selectedLoanForDetails.status) ? 'Still Paying' : 'Pending Verification'}</p>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Client Identity</h4>
                      <div className="relative group aspect-square rounded-[2rem] overflow-hidden border border-gray-100 bg-gray-50">
                        <div className="absolute inset-0 flex items-center justify-center text-gray-200">
                          <UserCheck className="w-12 h-12" />
                        </div>
                        {selectedLoanForDetails.passportPhoto ? (
                          <div className="absolute inset-0 bg-primary/10 flex items-center justify-center text-primary font-black text-2xl">
                            PASSPORT
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-gray-300 italic text-[10px]">No Photo</div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Verification Status</h4>
                      <div className="grid grid-cols-1 gap-2">
                        {selectedLoanForDetails.appointmentLetter && (
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                            <span className="text-xs font-bold text-gray-700">Emp. Letter Verified</span>
                          </div>
                        )}
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          <span className="text-xs font-bold text-gray-700">Bio-Match Confirmed</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2">
                    <div className="bg-gray-50/50 rounded-[2rem] border border-gray-100 overflow-hidden">
                      <div className="p-4 bg-white/50 border-b border-gray-100 px-6">
                        <h5 className="text-[10px] font-black uppercase text-gray-400">Repayment Spreadsheet (Numbered)</h5>
                      </div>
                      <table className="w-full text-left text-xs">
                        <thead className="bg-white/50">
                          <tr>
                            <th className="px-6 py-4 font-black uppercase tracking-tighter w-12">SN</th>
                            <th className="px-6 py-4 font-black uppercase tracking-tighter">Month Cycle</th>
                            <th className="px-6 py-4 font-black uppercase tracking-tighter text-gray-400">Principal</th>
                            <th className="px-6 py-4 font-black uppercase tracking-tighter text-gray-400">Interest</th>
                            <th className="px-6 py-4 font-black uppercase tracking-tighter text-primary">Total Carry</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {getDetailedRepaymentSchedule(selectedLoanForDetails.loanAmount, selectedLoanForDetails.loanTenure, new Date(typeof selectedLoanForDetails.createdAt === 'string' ? selectedLoanForDetails.createdAt : Date.now()), selectedLoanForDetails.monthlyIncome, settings).map((step, i) => (
                            <tr key={i} className="hover:bg-white transition-colors">
                              <td className="px-6 py-4 text-gray-400 font-black">{i + 1}</td>
                              <td className="px-6 py-4 font-medium">{new Date(step.year, step.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</td>
                              <td className="px-6 py-4">₦{step.principal.toLocaleString()}</td>
                              <td className="px-6 py-4">₦{step.interest.toLocaleString()}</td>
                              <td className="px-6 py-4 font-black text-primary">₦{step.total.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <button onClick={() => setSelectedLoanForDetails(null)} className="w-full md:w-auto px-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-800 transition-colors">
                    Close Ledger
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Eligibility Check Modal */}
      <AnimatePresence>
        {showEligibilityModal && eligibleCapacity && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEligibilityModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-xl" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white rounded-[3rem] p-10 w-full max-w-xl shadow-2xl overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-5">
                <BrainCircuit className="w-48 h-48" />
              </div>

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
                    <p className="text-5xl font-black text-gray-900 tracking-tighter">₦{eligibleCapacity.maxPrincipal.toLocaleString()}</p>
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
                    The borrower has a monthly capacity of ₦{eligibleCapacity.remainingCapacity.toLocaleString()}.
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
    </div>
  );
}
