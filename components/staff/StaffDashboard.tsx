'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { Plus, FileText, AlertCircle, Upload, Paperclip, UserCheck, IdCard, TrendingUp, Calendar, ChevronRight, Info, History as HistoryIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { calculateTotalRepayment, getDetailedRepaymentSchedule, calculateLoanCapacity } from '@/lib/loanLogic';
import { motion, AnimatePresence } from 'framer-motion';
import { useSystem } from '@/contexts/SystemContext';

export interface LoanApp {
  id: string;
  loanAmount: number;
  monthlyIncome: number;
  loanTenure: number;
  monthlyEMI: number;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  createdAt: string;
  repaymentType: 'default' | 'custom';
  customRepayments?: number[];
  appointmentLetter?: string;
  passportPhoto?: string;
  nin?: string;
}

export function StaffDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { settings, addAuditLog } = useSystem();
  const router = useRouter();
  const [loans, setLoans] = useState<LoanApp[]>([
    {
      id: '1',
      loanAmount: 50000,
      monthlyIncome: 30000,
      loanTenure: 3,
      monthlyEMI: 21666,
      status: 'approved',
      createdAt: '2024-01-15',
      repaymentType: 'default',
    },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    loanAmount: '',
    monthlyIncome: '',
    loanTenure: '3',
    repaymentType: 'default' as 'default' | 'custom',
    customMonth1: '',
    customMonth2: '',
    customMonth3: '',
    nin: '',
    appointmentLetter: null as File | null,
    passportPhoto: null as File | null,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  // Prescriptive Calculations
  const loanSummary = useMemo(() => {
    const amount = parseFloat(formData.loanAmount) || 0;
    const tenure = parseInt(formData.loanTenure) || 3;
    if (amount <= 0) return null;

    const calculation = calculateTotalRepayment(amount, tenure, settings);
    const schedule = getDetailedRepaymentSchedule(amount, tenure, new Date(), settings);
    const monthlyEMI = calculation.total / tenure;

    return {
      totalRepayment: calculation.total,
      totalInterest: calculation.interest,
      monthlyEMI,
      endDate: schedule[schedule.length - 1],
      isReducing: calculation.isReducing
    };
  }, [formData.loanAmount, formData.loanTenure, settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formData.loanAmount);
    const income = parseFloat(formData.monthlyIncome);
    const tenure = parseInt(formData.loanTenure);

    if (!amount || !income) {
      alert('Please fill all fields');
      return;
    }

    const { total: totalRepayment } = calculateTotalRepayment(amount, tenure, settings);

    if (!formData.appointmentLetter || !formData.passportPhoto) {
      alert('Please upload required documentation (Appointment Letter and Passport Photo)');
      return;
    }

    let customRepayments: number[] | undefined = undefined;
    if (formData.repaymentType === 'custom' && tenure <= 3) {
      const m1 = parseFloat(formData.customMonth1) || 0;
      const m2 = parseFloat(formData.customMonth2) || 0;
      const m3 = parseFloat(formData.customMonth3) || 0;

      if (Math.abs((m1 + m2 + m3) - totalRepayment) > 5) {
        alert(`Total custom repayments (₦${(m1 + m2 + m3).toLocaleString()}) must equal total repayment with interest (₦${totalRepayment.toLocaleString()})`);
        return;
      }
      customRepayments = [m1, m2, m3];
    } else if (formData.repaymentType === 'custom' && tenure > 3) {
      alert('Custom patterns are only available for loans up to 3 months.');
      return;
    }

    // AI Check: total capacity check
    const maxCapacity = income * settings.salaryCapMultiplier;
    const currentOutstanding = loans
      .filter(l => l.status === 'approved' || l.status === 'pending')
      .reduce((sum, l) => sum + calculateTotalRepayment(l.loanAmount, l.loanTenure, settings).total, 0);

    if (totalRepayment + currentOutstanding > maxCapacity) {
      alert(`Loan Denied by AI: Your total loan obligation (₦${(totalRepayment + currentOutstanding).toLocaleString()}) would exceed your ${settings.salaryCapMultiplier}-month salary capacity (₦${maxCapacity.toLocaleString()}).`);
      return;
    }

    const newLoan: LoanApp = {
      id: Date.now().toString(),
      loanAmount: amount,
      monthlyIncome: income,
      loanTenure: tenure,
      monthlyEMI: Math.round(totalRepayment / tenure),
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0],
      repaymentType: formData.repaymentType,
      customRepayments,
      nin: formData.nin || undefined,
      appointmentLetter: formData.appointmentLetter?.name,
      passportPhoto: formData.passportPhoto?.name,
    };

    setLoans([newLoan, ...loans]);
    addAuditLog('New Application', user?.email || 'Unknown', `Amount: ₦${amount.toLocaleString()}, Tenure: ${tenure}mo`);
    setFormData({
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
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-gray-600">Loading your profile...</p>
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
          <p className="text-sm text-gray-500 font-medium">Manage your financial freedom with smart loans</p>
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
                  <h2 className="text-2xl font-black text-gray-900">Application Form</h2>
                  <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <AlertCircle className="w-6 h-6 rotate-45" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-10">
                  {/* Basic Info Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700 ml-1">Loan Amount (₦)</label>
                      <input
                        type="number"
                        value={formData.loanAmount}
                        onChange={(e) => setFormData({ ...formData, loanAmount: e.target.value })}
                        placeholder="e.g. 100000"
                        className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700 ml-1">Monthly Salary (₦)</label>
                      <input
                        type="number"
                        value={formData.monthlyIncome}
                        onChange={(e) => setFormData({ ...formData, monthlyIncome: e.target.value })}
                        placeholder="e.g. 50000"
                        className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700 ml-1">Loan Tenure (Months)</label>
                      <select
                        value={formData.loanTenure}
                        onChange={(e) => setFormData({ ...formData, loanTenure: e.target.value })}
                        className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/10 transition-all outline-none text-base"
                      >
                        <option value="1">1 Month</option>
                        <option value="3">3 Months</option>
                        <option value="6">6 Months</option>
                        <option value="12">12 Months (1 Year)</option>
                        <option value="24">24 Months (2 Years)</option>
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
                              {loanSummary.isReducing && ' (Reducing Balance)'}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Monthly Deduction</p>
                            <p className="text-2xl font-black">₦{Math.round(loanSummary.monthlyEMI).toLocaleString()}</p>
                            <p className="text-xs text-gray-400 font-bold mt-1">Starting next month</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Completion Date</p>
                            <p className="text-2xl font-black flex items-center gap-2">
                              {new Date(loanSummary.endDate.month + 1 + '/01/' + loanSummary.endDate.year).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </p>
                            <p className="text-xs text-gray-400 font-bold mt-1">Full tenure: {formData.loanTenure} months</p>
                          </div>
                          <div className="flex items-center">
                            <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center text-primary backdrop-blur-md">
                              <Info className="w-6 h-6" />
                            </div>
                            <div className="ml-3">
                              <p className="text-[10px] text-gray-400 font-black uppercase mb-0.5">Eligibility</p>
                              <p className="text-sm font-bold">Auto-calculated</p>
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
                        Verification Documents
                      </h3>

                      <div className="grid grid-cols-2 gap-4">
                        <label className="group relative cursor-pointer">
                          <input type="file" onChange={(e) => setFormData({ ...formData, appointmentLetter: e.target.files?.[0] || null })} className="hidden" accept=".pdf,.doc,.docx,image/*" />
                          <div className={`h-40 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center transition-all ${formData.appointmentLetter ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50'}`}>
                            {formData.appointmentLetter ? <Paperclip className="w-8 h-8 text-primary mb-2" /> : <Upload className="w-8 h-8 text-gray-300 mb-2" />}
                            <span className="text-[10px] font-black uppercase text-center px-4 leading-tight">{formData.appointmentLetter?.name || 'Appointment Letter'}</span>
                          </div>
                        </label>

                        <label className="group relative cursor-pointer">
                          <input type="file" onChange={(e) => setFormData({ ...formData, passportPhoto: e.target.files?.[0] || null })} className="hidden" accept="image/*" />
                          <div className={`h-40 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center transition-all ${formData.passportPhoto ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50'}`}>
                            {formData.passportPhoto ? <UserCheck className="w-8 h-8 text-primary mb-2" /> : <Upload className="w-8 h-8 text-gray-300 mb-2" />}
                            <span className="text-[10px] font-black uppercase text-center px-4 leading-tight">{formData.passportPhoto?.name || 'Passport Photo'}</span>
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

                    {/* Repayment Pattern */}
                    <div className="space-y-6">
                      <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        Repayment Strategy
                      </h3>

                      <div className="space-y-4">
                        <select
                          value={formData.repaymentType}
                          onChange={(e) => setFormData({ ...formData, repaymentType: e.target.value as any })}
                          className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/10 transition-all outline-none text-base font-bold"
                        >
                          <option value="default">Equal Monthly Installments</option>
                          {parseInt(formData.loanTenure) <= 3 && <option value="custom">Custom Values (Max 3 Months)</option>}
                        </select>

                        {formData.repaymentType === 'custom' && (
                          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-6 bg-primary/5 border border-primary/10 rounded-[2rem] space-y-4">
                            <p className="text-xs font-black text-primary uppercase">Manual Monthly Deduction</p>
                            <div className="grid grid-cols-3 gap-3">
                              {[1, 2, 3].map(i => (
                                <input
                                  key={i}
                                  type="number"
                                  placeholder={`M${i}`}
                                  value={(formData as any)[`customMonth${i}`]}
                                  onChange={(e) => setFormData({ ...formData, [`customMonth${i}`]: e.target.value })}
                                  className="w-full p-3 bg-white border border-primary/20 rounded-xl focus:border-primary outline-none transition-all text-sm font-bold"
                                />
                              ))}
                            </div>
                          </motion.div>
                        )}

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
              Application History
            </h2>
            <span className="text-[10px] font-black text-gray-400 uppercase bg-gray-100 px-3 py-1 rounded-full">{loans.length} Total</span>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {loans.length === 0 ? (
              <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-gray-100">
                <FileText className="w-16 h-16 text-gray-100 mx-auto mb-4" />
                <p className="text-gray-400 font-bold">No loans yet. Start by clicking 'New Application'</p>
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
                        <div className={`w-3 h-3 rounded-full animate-pulse ${loan.status === 'approved' ? 'bg-emerald-500' : loan.status === 'rejected' ? 'bg-red-500' : 'bg-amber-500'}`} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${loan.status === 'approved' ? 'text-emerald-600' : loan.status === 'rejected' ? 'text-red-600' : 'text-amber-600'}`}>
                          {loan.status}
                        </span>
                        <span className="text-[10px] text-gray-300 font-bold">•</span>
                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">ID: {loan.id.slice(-6)}</span>
                      </div>

                      <div className="flex items-baseline gap-2">
                        <h3 className="text-4xl font-black text-gray-900 tracking-tighter">₦{loan.loanAmount.toLocaleString()}</h3>
                        <span className="text-sm font-bold text-gray-400">Total Borrowed</span>
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
                        {loan.repaymentType === 'custom' && (
                          <span className="bg-primary/5 text-primary px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider">Custom Pattern</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3 text-right">
                      <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                        <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Created On</p>
                        <p className="text-sm font-bold text-gray-900">{new Date(loan.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>
                      <ChevronRight className="w-6 h-6 text-gray-200 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>

                  {loan.reason && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 p-6 bg-red-50/50 border border-red-100 rounded-[2rem] flex gap-4">
                      <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
                      <div>
                        <p className="text-xs font-black text-red-800 uppercase tracking-wider mb-1">Feedback from Manager</p>
                        <p className="text-sm text-red-700 font-medium leading-relaxed">{loan.reason}</p>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
