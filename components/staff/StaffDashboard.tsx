'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { Plus, FileText, AlertCircle, Upload, Paperclip, UserCheck, IdCard, TrendingUp, Calendar, ChevronRight, Info, History as HistoryIcon, CheckCircle, BrainCircuit, ShieldCheck, Sparkles, Eye, Search, Clock, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { LoanApp, createLoanApplication, getLoansByStaff, getAllLoans, uploadFile } from '@/lib/db';
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
  const [filterStatus, setFilterStatus] = useState<'applications' | 'collection'>('applications');
  const [allLoans, setAllLoans] = useState<LoanApp[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
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
    loans.forEach(loan => {
      const name = loan.userName || loan.borrowerName || '';
      if (name && !borrowers.has(name)) {
        borrowers.set(name, loan);
      }
    });
    return Array.from(borrowers.values());
  }, [loans]);

  const handleSelectReturning = (name: string) => {
    const prevLoan = loans.find(l => (l.userName || l.borrowerName) === name);
    if (prevLoan) {
      setFormData({
        ...formData,
        borrowerName: (prevLoan.userName || prevLoan.borrowerName || ''),
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
    if (!user?.email) {
      console.warn('[StaffDashboard] No user email found, skipping fetch');
      setIsFetching(false);
      return;
    }

    setIsFetching(true);
    console.log('[StaffDashboard] Starting fetch for:', user.email);

    try {
      // Timeout helper
      const withTimeout = async <T,>(promise: Promise<T>, ms: number, fallback: T): Promise<T> => {
        const timeout = new Promise<T>((resolve) =>
          setTimeout(() => {
            console.warn(`[StaffDashboard] Fetch timed out after ${ms}ms`);
            resolve(fallback);
          }, ms)
        );
        return Promise.race([promise, timeout]);
      };

      // Individual fetches with 5-second timeout
      const staffLoansPromise = withTimeout(getLoansByStaff(user.email), 5000, []).catch(err => {
        console.error('[StaffDashboard] Staff loans fetch failed:', err);
        return [];
      });

      const allLoansPromise = withTimeout(getAllLoans(), 5000, []).catch(err => {
        console.error('[StaffDashboard] All loans fetch failed:', err);
        return [];
      });

      const [staffLoans, totalLoans] = await Promise.all([
        staffLoansPromise,
        allLoansPromise
      ]);

      console.log('[StaffDashboard] Data received:', staffLoans.length, totalLoans.length);
      setLoans(staffLoans);
      setAllLoans(totalLoans);
      console.log('[StaffDashboard] Fetch complete. Staff loans:', staffLoans.length, 'Total loans available:', totalLoans.length);
    } catch (error) {
      console.error('[StaffDashboard] General fetch error:', error);
    } finally {
      setIsFetching(false);
    }
  };

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Collection Queue logic
  const collectionQueue = useMemo(() => {
    return allLoans.filter(l => l.status === 'approved' || l.status === 'disbursed').filter(loan => {
      const createdAt = typeof loan.createdAt === 'string' ? new Date(loan.createdAt) :
        (loan.createdAt && typeof (loan.createdAt as any).toDate === 'function' ? (loan.createdAt as any).toDate() : new Date('2024-01-01'));
      const schedule = getDetailedRepaymentSchedule(loan.loanAmount, loan.loanTerm, createdAt, loan.monthlyIncome, settings);
      return schedule.some(s => s.month === currentMonth && s.year === currentYear);
    });
  }, [allLoans, settings, currentMonth, currentYear]);

  const filteredCollection = useMemo(() => {
    return collectionQueue.filter((loan) => {
      const matchesSearch = (loan.userName || loan.borrowerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (loan.email || loan.staffEmail || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        loan.id?.includes(searchQuery);
      return matchesSearch;
    });
  }, [collectionQueue, searchQuery]);

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

    // Iteratively find the first tenure that allows affordable monthly payments
    const limitToCheck = settings.maxTenure ? Math.max(settings.maxTenure, 12) : 60;

    for (let t = 1; t <= limitToCheck; t++) {
      const { total } = calculateTotalRepayment(amount, t, income, settings);
      const monthlyPayment = total / t;

      const limitFactor = t <= 3 ? 1.0 : 0.4;

      if (monthlyPayment <= (income * limitFactor)) {
        return t;
      }
    }

    return limitToCheck;
  }, [formData.loanAmount, formData.monthlyIncome, settings]);


  // Metrics calculation (Staff version of Manager metrics)
  const metrics = useMemo(() => {
    const approved = allLoans.filter(l => l.status === 'approved' || l.status === 'disbursed');
    const disbursed = approved.reduce((sum, l) => sum + l.loanAmount, 0);

    let monthlyCollection = 0;
    let monthlyExpectedProfit = 0;

    approved.forEach(loan => {
      const createdAt = typeof loan.createdAt === 'string' ? new Date(loan.createdAt) :
        (loan.createdAt && typeof (loan.createdAt as any).toDate === 'function' ? (loan.createdAt as any).toDate() : new Date('2024-01-01'));
      const schedule = getDetailedRepaymentSchedule(loan.loanAmount, loan.loanTerm, createdAt, loan.monthlyIncome, settings);
      const currentStep = schedule.find(s => s.month === currentMonth && s.year === currentYear);
      if (currentStep) {
        monthlyCollection += currentStep.total;
        monthlyExpectedProfit += currentStep.interest;
      }
    });

    return {
      disbursed,
      monthlyCollection,
      monthlyExpectedProfit,
      totalPending: loans.filter(l => l.status === 'pending').length
    };
  }, [allLoans, loans, settings, currentMonth, currentYear]);

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
      const confirmTenure = confirm(`System Notice: The selected tenure is shorter than the AI-recommended minimum of ${recommendedTenure} months. This requires aggressive repayment. Proceed?`);
      if (!confirmTenure) return;
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

    setIsSubmitting(true);
    try {
      // Parallelize file uploads
      const uploadTasks: Promise<{ type: string, url: string }>[] = [];

      if (formData.appointmentLetter) {
        uploadTasks.push(
          uploadFile(formData.appointmentLetter, `documents/${user?.uid}/appointment_letter_${Date.now()}`)
            .then(url => ({ type: 'appointment', url }))
        );
      }

      if (formData.passportPhoto) {
        uploadTasks.push(
          uploadFile(formData.passportPhoto, `documents/${user?.uid}/passport_photo_${Date.now()}`)
            .then(url => ({ type: 'passport', url }))
        );
      }

      const uploadResults = await Promise.all(uploadTasks);

      let appointmentLetterUrl = '';
      let passportPhotoUrl = '';

      uploadResults.forEach(res => {
        if (res.type === 'appointment') appointmentLetterUrl = res.url;
        if (res.type === 'passport') passportPhotoUrl = res.url;
      });

      // Fallback for returning clients if no new file uploaded
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
        repaymentType: formData.repaymentType,
        nin: formData.nin || undefined,
        appointmentLetter: appointmentLetterUrl,
        passportPhoto: passportPhotoUrl,
      };

      // Enhanced AI Simulation Flow
      addAuditLog('Verification Started', user?.email || 'Unknown', `Analyzing documents for ${name}...`);
      await new Promise(resolve => setTimeout(resolve, 800));
      addAuditLog('Biometric Check', user?.email || 'Unknown', `Matching passport against archived records...`);
      await new Promise(resolve => setTimeout(resolve, 600));

      await createLoanApplication(newLoanData);
      addAuditLog('Application Finalized', user?.email || 'Unknown', `New application for ${name} (₦${amount.toLocaleString()}) queued for manager approval.`);

      setSubmissionComplete(true);

      setFormData({
        borrowerName: '',
        loanAmount: '',
        monthlyIncome: '',
        loanTerm: 3,
        loanTenure: '3',
        repaymentType: 'default',
        customMonth1: '',
        customMonth2: '',
        customMonth3: '',
        nin: '',
        appointmentLetter: null,
        passportPhoto: null,
      } as any);

      // Quick transition for better performance feel
      setTimeout(() => {
        setIsSubmitting(false);
        setSubmissionComplete(false);
        setShowForm(false);
        fetchLoans();
      }, 600);

    } catch (error) {
      setIsSubmitting(false);
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
    <div className="space-y-8 overflow-x-hidden">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
            Staff <span className="text-primary italic">Dashboard</span>
          </h1>
          <p className="text-sm text-gray-500 font-medium">Register loan applications for clients</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
            {(['applications', 'collection'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterStatus === s ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:text-gray-600'
                  }`}
              >
                {s === 'collection' ? 'Collection Queue' : 'My Applications'}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-4 bg-primary text-white rounded-2xl hover:shadow-xl hover:shadow-primary/30 transition-all font-bold active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            New Application
          </button>
        </div>
      </header>

      {/* Stats Grid - Staff View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-gray-50 shadow-sm">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-emerald-100 text-emerald-600">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
          </div>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Expected Collection</p>
          <p className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">₦{(metrics.monthlyCollection / 1000).toFixed(1)}k</p>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-gray-50 shadow-sm group">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-amber-100 text-amber-600">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="text-[8px] font-black bg-emerald-500 text-white px-2 py-0.5 sm:py-1 rounded-full uppercase">Profit Target</div>
          </div>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Expected Interest</p>
          <p className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">₦{(metrics.monthlyExpectedProfit / 1000).toFixed(1)}k</p>
        </div>
      </div>

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
                      <label className="block text-sm font-bold text-gray-700 ml-1">Loan Tenure (Months)</label>
                      <select
                        value={formData.loanTenure}
                        onChange={(e) => setFormData({ ...formData, loanTenure: e.target.value })}
                        className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/10 transition-all outline-none text-base"
                      >
                        {Array.from({ length: settings.maxTenure || 12 }, (_, i) => i + 1).map(m => (
                          <option key={m} value={m}>{m} {m === 1 ? 'Month' : 'Months'}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700 ml-1">Repayment Strategy</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, repaymentType: 'default' })}
                        className={`p-4 rounded-2xl border text-left transition-all ${formData.repaymentType === 'default' ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                      >
                        <p className="text-xs font-black uppercase tracking-widest mb-1">Standard EMI</p>
                        <p className="text-[10px] opacity-80">Fixed monthly deductions</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, repaymentType: 'salary_advance' })}
                        className={`p-4 rounded-2xl border text-left transition-all ${formData.repaymentType === 'salary_advance' ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                      >
                        <p className="text-xs font-black uppercase tracking-widest mb-1">Salary Wipe</p>
                        <p className="text-[10px] opacity-80">100% deduction until cleared</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, repaymentType: 'custom' })}
                        className={`p-4 rounded-2xl border text-left transition-all ${formData.repaymentType === 'custom' ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                      >
                        <p className="text-xs font-black uppercase tracking-widest mb-1">Custom Plan</p>
                        <p className="text-[10px] opacity-80">Flexible / Manual edits</p>
                      </button>
                    </div>
                  </div>

                  {/* Custom Plan Editor (Visible only when Custom is selected) */}
                  <AnimatePresence>
                    {formData.repaymentType === 'custom' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-5 bg-gray-50 rounded-[2rem] border border-gray-200 space-y-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary"><TrendingUp className="w-4 h-4" /></div>
                            <p className="text-xs font-black uppercase text-gray-500">Manual Repayment Schedule (Projected)</p>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {Array.from({ length: Math.min(parseInt(formData.loanTenure) || 3, 12) }).map((_, i) => (
                              <div key={i} className="space-y-1">
                                <label className="text-[9px] font-bold text-gray-400 uppercase">Month {i + 1}</label>
                                <input
                                  type="number"
                                  placeholder="Auto-calc"
                                  className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                                />
                              </div>
                            ))}
                          </div>
                          <p className="text-[10px] text-amber-600 italic mt-2">* Custom amounts must sum to Total Repayment. The system will auto-balance remaining amounts.</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

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
                              {loanSummary.schedule.slice(0, 4).map((s, i) => (
                                <p key={i} className="text-[9px] text-gray-300 font-medium">Month {i + 1}: ₦{s.total.toLocaleString()}</p>
                              ))}
                              {loanSummary.schedule.length > 4 && (
                                <p className="text-[9px] text-gray-500 italic">...and {loanSummary.schedule.length - 4} more</p>
                              )}
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
                          <div className={`h-40 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center transition-all ${formData.appointmentLetter || isReturning ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50'}`}>
                            {formData.appointmentLetter || isReturning ? <ShieldCheck className="w-8 h-8 text-primary mb-2" /> : <Upload className="w-8 h-8 text-gray-300 mb-2" />}
                            <span className="text-[10px] font-black uppercase text-center px-4 leading-tight">
                              {isReturning ? 'Appointment Letter Verified (Archived)' : (formData.appointmentLetter?.name || 'Appointment Letter (ONLY)')}
                            </span>
                          </div>
                        </label>

                        <label className="group relative cursor-pointer">
                          <input type="file" onChange={(e) => setFormData({ ...formData, passportPhoto: e.target.files?.[0] || null })} className="hidden" accept="image/*" />
                          <div className={`h-40 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center transition-all ${formData.passportPhoto ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50'}`}>
                            {formData.passportPhoto ? <UserCheck className="w-8 h-8 text-primary mb-2" /> : <Upload className="w-8 h-8 text-gray-300 mb-2" />}
                            <span className="text-[10px] font-black uppercase text-center px-4 leading-tight">
                              {formData.passportPhoto ? formData.passportPhoto.name : (isReturning ? 'Re-Sync Passport Photo' : 'Passport Photo (ONLY)')}
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
                        {(() => {
                          const income = parseFloat(formData.monthlyIncome) || 0;
                          const amount = parseFloat(formData.loanAmount) || 0;
                          const safeMonthlyLimit = income * 0.90; // 90% for salary advance
                          const highestPayment = loanSummary ? Math.max(...loanSummary.schedule.map(s => s.total)) : 0;
                          // Refining Logic: 
                          // - If Tenure <= 3 months: Allow up to 100% deduction (Salary Advance). Warn only if > 100%.
                          // - If Tenure > 3 months: Warn if > 40% (Standard Safety).

                          const tenure = parseInt(formData.loanTenure) || 3;
                          const isShortTerm = tenure <= 3;

                          // True warning condition
                          const isRisky = isShortTerm
                            ? highestPayment > income // Impossible to pay more than 100%
                            : highestPayment > (income * 0.4); // Standard threshold

                          const shouldWarn = isRisky && amount > 0;

                          return shouldWarn ? (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="p-6 bg-amber-50 border border-amber-100 rounded-[2rem] flex gap-4"
                            >
                              <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
                              <div>
                                <p className="text-[10px] font-black text-amber-800 uppercase tracking-wider mb-1">Financial Caution</p>
                                <p className="text-xs text-amber-700 font-medium leading-relaxed">
                                  {isShortTerm ? (
                                    <>Monthly deduction (₦{Math.round(highestPayment).toLocaleString()}) exceeds total salary. Please reduce amount or extend tenure.</>
                                  ) : (
                                    <>A {formData.loanTenure}-month tenure requires payments up to ₦{Math.round(highestPayment).toLocaleString()} ({Math.round((highestPayment / income) * 100)}% of salary). Consider extending to <b>{recommendedTenure} months</b> for safer repayment.</>
                                  )}
                                </p>
                              </div>
                            </motion.div>
                          ) : null;
                        })()}
                      </AnimatePresence>

                      <div className="flex gap-4 pt-4">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className={`flex-1 py-5 rounded-2xl font-black shadow-xl active:scale-95 transition-all text-lg flex items-center justify-center gap-3 ${submissionComplete ? 'bg-emerald-500 shadow-emerald-200' : 'bg-primary shadow-primary/20'
                            } text-white`}
                        >
                          {isSubmitting ? (
                            <>
                              <Clock className="w-5 h-5 animate-spin" />
                              <span>Processing...</span>
                            </>
                          ) : submissionComplete ? (
                            <>
                              <CheckCircle className="w-5 h-5" />
                              <span>Submitted!</span>
                            </>
                          ) : (
                            'Apply for Loan'
                          )}
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
        {filterStatus === 'applications' ? (
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
                          <h3 className="text-3xl font-black text-gray-900 tracking-tighter">{loan.userName || loan.borrowerName}</h3>
                          <span className="text-sm font-bold text-primary">₦{loan.loanAmount.toLocaleString()}</span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className="bg-gray-50 text-gray-500 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            {loan.loanTerm} Months
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
        ) : (
          <section className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-widest flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary" />
                Collection Queue
              </h2>
              <div className="relative group w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Search collections..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all text-xs font-medium"
                />
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-gray-50 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/50 border-b border-gray-100">
                    <tr>
                      <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest w-12">SN</th>
                      <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Client</th>
                      <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Due (This Month)</th>
                      <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Repayment</th>
                      <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                      <th className="px-8 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredCollection.map((loan, idx) => {
                      const createdAt = typeof loan.createdAt === 'string' ? new Date(loan.createdAt) :
                        (loan.createdAt && typeof (loan.createdAt as any).toDate === 'function' ? (loan.createdAt as any).toDate() : new Date('2024-01-01'));
                      const schedule = getDetailedRepaymentSchedule(loan.loanAmount, loan.loanTerm, createdAt, loan.monthlyIncome, settings);
                      const thisMonthDue = schedule.find(s => s.month === currentMonth && s.year === currentYear)?.total || 0;
                      const totalWithInterest = schedule.reduce((sum, s) => sum + s.total, 0);

                      return (
                        <motion.tr
                          key={loan.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          className="hover:bg-gray-50/50 transition-colors group"
                        >
                          <td className="px-8 py-6 text-[10px] font-black text-gray-300">{idx + 1}</td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold">
                                {(loan.userName || loan.borrowerName || 'U')[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-900">{loan.userName || loan.borrowerName}</p>
                                <p className="text-[10px] text-gray-400 font-medium">By {(loan.email || loan.staffEmail || 'staff').split('@')[0]}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <p className="text-sm font-black text-primary">₦{thisMonthDue.toLocaleString()}</p>
                          </td>
                          <td className="px-8 py-6">
                            <p className="text-sm font-bold text-gray-600">₦{totalWithInterest.toLocaleString()}</p>
                          </td>
                          <td className="px-8 py-6">
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${loan.status === 'approved' || loan.status === 'disbursed' ? 'bg-emerald-50 text-emerald-600' :
                              loan.status === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                              }`}>
                              {loan.status}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => setSelectedLoanForDetails(loan)} className="p-2 hover:bg-white rounded-lg transition-all border border-transparent hover:border-gray-100 hover:shadow-sm">
                                <Eye className="w-4 h-4 text-gray-400" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filteredCollection.length === 0 && (
                <div className="p-20 text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-10 h-10 text-gray-200" />
                  </div>
                  <p className="text-gray-400 font-bold">No collections due this month</p>
                </div>
              )}
            </div>
          </section>
        )}
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
                        ₦{getDetailedRepaymentSchedule(selectedLoanForDetails.loanAmount, selectedLoanForDetails.loanTerm, typeof selectedLoanForDetails.createdAt === 'string' ? new Date(selectedLoanForDetails.createdAt) : (selectedLoanForDetails.createdAt && typeof (selectedLoanForDetails.createdAt as any).toDate === 'function' ? (selectedLoanForDetails.createdAt as any).toDate() : new Date('2024-01-01')), selectedLoanForDetails.monthlyIncome, settings).reduce((sum, s) => sum + s.total, 0).toLocaleString()}
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
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col gap-3">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                            <span className="text-xs font-bold text-gray-700">Appointment Letter</span>
                          </div>
                          {selectedLoanForDetails.appointmentLetter ? (
                            <div className="aspect-[4/3] w-full bg-white rounded-xl border border-gray-200 overflow-hidden relative group">
                              <img
                                src="https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=2070&auto=format&fit=crop"
                                alt="Appointment Letter"
                                className="w-full h-full object-cover opacity-50 grayscale hover:grayscale-0 transition-all cursor-zoom-in"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/5 group-hover:bg-transparent transition-colors">
                                <span className="text-[8px] font-black uppercase text-gray-500 bg-white/80 px-2 py-1 rounded">Document ID: verified</span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-[10px] text-gray-400 italic">No document archived</div>
                          )}
                        </div>

                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col gap-3">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                            <span className="text-xs font-bold text-gray-700">Passport Identity</span>
                          </div>
                          {selectedLoanForDetails.passportPhoto ? (
                            <div className="aspect-square w-full bg-white rounded-xl border border-gray-200 overflow-hidden relative group">
                              <img
                                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1976&auto=format&fit=crop"
                                alt="Passport Photo"
                                className="w-full h-full object-cover hover:scale-110 transition-transform duration-500 cursor-zoom-in"
                              />
                              <div className="absolute top-2 right-2 flex gap-1">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                <div className="text-[7px] font-black text-emerald-600 bg-white/90 px-1 rounded uppercase">Bio Match</div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-[10px] text-gray-400 italic">No identity photo</div>
                          )}
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
                          {getDetailedRepaymentSchedule(selectedLoanForDetails.loanAmount, selectedLoanForDetails.loanTerm, typeof selectedLoanForDetails.createdAt === 'string' ? new Date(selectedLoanForDetails.createdAt) : (selectedLoanForDetails.createdAt && typeof (selectedLoanForDetails.createdAt as any).toDate === 'function' ? (selectedLoanForDetails.createdAt as any).toDate() : new Date('2024-01-01')), selectedLoanForDetails.monthlyIncome, settings).map((step, i) => (
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
    </div>
  );
}
