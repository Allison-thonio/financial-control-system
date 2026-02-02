'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Eye,
  Calendar,
  TrendingUp,
  Download,
  Briefcase,
  FileText,
  UserCheck,
  IdCard,
  Filter,
  DollarSign,
  ChevronRight,
  Search,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { getDetailedRepaymentSchedule } from '@/lib/loanLogic';
import { useSystem } from '@/contexts/SystemContext';
import { LoanApp, getAllLoans, updateLoanStatus } from '@/lib/db';

export function ManagerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { settings, addAuditLog } = useSystem();
  const router = useRouter();
  const [loans, setLoans] = useState<LoanApp[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'collection'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLoan, setSelectedLoan] = useState<LoanApp | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [approvalData, setApprovalData] = useState({ approved: false, reason: '' });

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

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
    setIsFetching(true);
    try {
      const allLoans = await getAllLoans();
      setLoans(allLoans);
    } catch (error) {
      console.error('Failed to fetch loans:', error);
    } finally {
      setIsFetching(false);
    }
  };

  // Metrics calculation
  const metrics = useMemo(() => {
    const approved = loans.filter(l => l.status === 'approved' || l.status === 'disbursed');
    const disbursed = approved.reduce((sum, l) => sum + l.loanAmount, 0);

    let monthlyCollection = 0;
    let monthlyExpectedProfit = 0;

    approved.forEach(loan => {
      const createdAt = typeof loan.createdAt === 'string' ? new Date(loan.createdAt) : new Date();
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
  }, [loans, settings, currentMonth, currentYear]);

  // Collection Queue
  const collectionQueue = useMemo(() => {
    return loans.filter(l => l.status === 'approved' || l.status === 'disbursed').filter(loan => {
      const createdAt = typeof loan.createdAt === 'string' ? new Date(loan.createdAt) : new Date();
      const schedule = getDetailedRepaymentSchedule(loan.loanAmount, loan.loanTerm, createdAt, loan.monthlyIncome, settings);
      return schedule.some(s => s.month === currentMonth && s.year === currentYear);
    });
  }, [loans, settings, currentMonth, currentYear]);

  const filteredLoans = useMemo(() => {
    if (filterStatus === 'collection') return collectionQueue;
    return loans.filter((loan) => {
      const matchesStatus = filterStatus === 'all' || loan.status === filterStatus;
      const matchesSearch = (loan.userName || loan.borrowerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (loan.email || loan.staffEmail || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        loan.id?.includes(searchQuery);
      return matchesStatus && matchesSearch;
    });
  }, [loans, filterStatus, searchQuery, collectionQueue]);

  const handleApprove = (loan: LoanApp) => {
    setSelectedLoan(loan);
    setApprovalData({ approved: true, reason: '' });
    setShowApprovalModal(true);
  };

  const handleReject = (loan: LoanApp) => {
    setSelectedLoan(loan);
    setApprovalData({ approved: false, reason: '' });
    setShowApprovalModal(true);
  };

  const handleViewDetails = (loan: LoanApp) => {
    setSelectedLoan(loan);
    setShowDetailsModal(true);
  };

  const submitApproval = async () => {
    if (selectedLoan?.id) {
      try {
        const newStatus = approvalData.approved ? 'approved' : 'rejected';
        await updateLoanStatus(selectedLoan.id, newStatus, approvalData.reason || undefined);

        addAuditLog(
          approvalData.approved ? 'Loan Approved' : 'Loan Rejected',
          user?.email || 'Manager',
          `Loan ID: ${selectedLoan.id}, Client: ${selectedLoan.userName || selectedLoan.borrowerName}${!approvalData.approved ? `, Reason: ${approvalData.reason}` : ''}`
        );

        setShowApprovalModal(false);
        setSelectedLoan(null);
        setApprovalData({ approved: false, reason: '' });
        fetchLoans();
      } catch (error) {
        alert('Failed to update status');
      }
    }
  };

  if (authLoading || isFetching) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-gray-600">Loading Manager Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
            Manager <span className="text-primary">Dashboard</span>
          </h1>
          <p className="text-sm text-gray-500 font-medium">Control center for loan approvals and profit tracking</p>
        </div>

        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
          {(['all', 'pending', 'collection'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterStatus === s ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:text-gray-600'
                }`}
            >
              {s === 'collection' ? 'Collection Queue' : s}
            </button>
          ))}
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-gray-50 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
              <DollarSign className="w-6 h-6" />
            </div>
            <ArrowDownRight className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Disbursed (All Time)</p>
          <p className="text-3xl font-black text-gray-900 mt-1">₦{(metrics.disbursed / 1000).toFixed(1)}k</p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-gray-50 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Expected Collection (This Month)</p>
          <p className="text-3xl font-black text-gray-900 mt-1">₦{(metrics.monthlyCollection / 1000).toFixed(1)}k</p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-gray-50 shadow-sm group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-2xl bg-amber-100 text-amber-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="text-[8px] font-black bg-emerald-500 text-white px-2 py-1 rounded-full uppercase">Profit Target</div>
          </div>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Expected Interest (This Month)</p>
          <p className="text-3xl font-black text-gray-900 mt-1">₦{(metrics.monthlyExpectedProfit / 1000).toFixed(1)}k</p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-gray-50 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-2xl bg-blue-100 text-blue-600">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Pending Approvals</p>
          <p className="text-3xl font-black text-gray-900 mt-1">{metrics.totalPending}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search by client name, staff email or loan ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all text-sm font-medium"
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
              {filteredLoans.map((loan, idx) => {
                const createdAt = typeof loan.createdAt === 'string' ? new Date(loan.createdAt) : new Date();
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
                        <button onClick={() => handleViewDetails(loan)} className="p-2 hover:bg-white rounded-lg transition-all border border-transparent hover:border-gray-100 hover:shadow-sm">
                          <Eye className="w-4 h-4 text-gray-400" />
                        </button>
                        {loan.status === 'pending' && (
                          <div className="flex gap-1">
                            <button onClick={() => handleApprove(loan)} className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-all border border-transparent hover:border-emerald-100">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleReject(loan)} className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-all border border-transparent hover:border-red-100">
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredLoans.length === 0 && (
          <div className="p-20 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-gray-200" />
            </div>
            <p className="text-gray-400 font-bold">No records found for this view</p>
          </div>
        )}
      </div>

      {/* Details Spreadsheet Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedLoan && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetailsModal(false)}
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
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Client <span className="text-primary italic">Spreadsheet</span></h2>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Client: {selectedLoan.borrowerName}</p>
                  </div>
                  <button onClick={() => setShowDetailsModal(false)} className="p-3 hover:bg-gray-100 rounded-full transition-colors">
                    <XCircle className="w-8 h-8 text-gray-300" />
                  </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="space-y-6">
                    <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10">
                      <p className="text-[10px] text-primary font-black uppercase mb-2">Total Expected Carry</p>
                      <p className="text-3xl font-black text-gray-900">
                        ₦{getDetailedRepaymentSchedule(selectedLoan.loanAmount, selectedLoan.loanTerm, typeof selectedLoan.createdAt === 'string' ? new Date(selectedLoan.createdAt) : new Date(), selectedLoan.monthlyIncome, settings).reduce((sum, s) => sum + s.total, 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-emerald-600 font-bold mt-1 leading-tight">Status: {['approved', 'disbursed'].includes(selectedLoan.status) ? 'Still Paying' : 'Awaiting Approval'}</p>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Client Identity</h4>
                      <div className="relative aspect-square rounded-[2rem] overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center">
                        {selectedLoan.passportPhoto ? (
                          <div className="text-primary font-black text-xl">PASSPORT PHOTO</div>
                        ) : (
                          <div className="text-gray-300 italic text-xs">No Photo</div>
                        )}
                        <UserCheck className="absolute bottom-4 right-4 w-8 h-8 text-primary/20" />
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
                          {selectedLoan.appointmentLetter ? (
                            <div className="aspect-[4/3] w-full bg-white rounded-xl border border-gray-200 overflow-hidden relative group">
                              {selectedLoan.appointmentLetter.toLowerCase().endsWith('.pdf') ? (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 group-hover:bg-primary/5 transition-colors">
                                  <FileText className="w-12 h-12 text-primary" />
                                  <span className="text-[10px] font-black text-primary mt-2 uppercase tracking-widest">PDF Document</span>
                                </div>
                              ) : (
                                <img
                                  src={selectedLoan.appointmentLetter}
                                  alt="Appointment Letter"
                                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all cursor-zoom-in"
                                />
                              )}
                              <a
                                href={selectedLoan.appointmentLetter}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <span className="text-[10px] font-black uppercase text-white bg-primary px-3 py-1.5 rounded-full shadow-lg">View Full Doc</span>
                              </a>
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
                          {selectedLoan.passportPhoto ? (
                            <div className="aspect-square w-full bg-white rounded-xl border border-gray-200 overflow-hidden relative group">
                              <img
                                src={selectedLoan.passportPhoto}
                                alt="Passport Photo"
                                className="w-full h-full object-cover hover:scale-110 transition-transform duration-500 cursor-zoom-in"
                              />
                              <a
                                href={selectedLoan.passportPhoto}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <span className="text-[10px] font-black uppercase text-white bg-primary px-3 py-1.5 rounded-full shadow-lg">View Photo</span>
                              </a>
                            </div>
                          ) : (
                            <div className="text-[10px] text-gray-400 italic">No identity photo</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2 space-y-6">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Numbered Ledger Projection
                    </h4>
                    <div className="bg-gray-50/50 rounded-[2rem] border border-gray-100 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-white/50">
                          <tr>
                            <th className="px-6 py-4 font-black uppercase tracking-tighter w-12 text-gray-400">SN</th>
                            <th className="px-6 py-4 font-black uppercase tracking-tighter">Month Cycle</th>
                            <th className="px-6 py-4 font-black uppercase tracking-tighter">Principal</th>
                            <th className="px-6 py-4 font-black uppercase tracking-tighter">Interest</th>
                            <th className="px-6 py-4 font-black uppercase tracking-tighter text-primary">Total Carry</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {getDetailedRepaymentSchedule(selectedLoan.loanAmount, selectedLoan.loanTerm, typeof selectedLoan.createdAt === 'string' ? new Date(selectedLoan.createdAt) : new Date(), selectedLoan.monthlyIncome, settings).map((step, i) => (
                            <tr key={i} className="hover:bg-white transition-colors">
                              <td className="px-6 py-4 text-gray-300 font-black">{i + 1}</td>
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

                <div className="flex gap-4 pt-4">
                  <button onClick={() => setShowDetailsModal(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-200 transition-colors">
                    Close Sheet
                  </button>
                  {selectedLoan.status === 'pending' && (
                    <button
                      onClick={() => { setShowDetailsModal(false); handleApprove(selectedLoan); }}
                      className="flex-1 py-4 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-[0.98]"
                    >
                      Authorize Disbursement
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Approval Modal */}
      <AnimatePresence>
        {showApprovalModal && selectedLoan && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowApprovalModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-white rounded-[2rem] p-8 md:p-10 w-full max-w-md shadow-2xl">
              <h3 className="text-2xl font-black mb-6 text-gray-900">
                Final <span className={approvalData.approved ? 'text-emerald-500' : 'text-red-500'}>{approvalData.approved ? 'Approval' : 'Rejection'}</span>
              </h3>

              <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 mb-6">
                <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Authorizing amount</p>
                <p className="text-2xl font-black text-gray-900">₦{selectedLoan.loanAmount.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">For: {selectedLoan.userName || selectedLoan.borrowerName}</p>
              </div>

              {!approvalData.approved && (
                <textarea
                  placeholder="Enter reason for rejection..."
                  value={approvalData.reason}
                  onChange={(e) => setApprovalData({ ...approvalData, reason: e.target.value })}
                  className="w-full p-4 border border-gray-100 bg-gray-50 rounded-2xl mb-6 outline-none focus:ring-4 focus:ring-red-100 transition-all text-sm font-medium h-32"
                />
              )}

              <div className="flex gap-4">
                <button
                  onClick={submitApproval}
                  className={`flex-1 py-4 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${approvalData.approved ? 'bg-primary shadow-xl shadow-primary/20' : 'bg-red-500 shadow-xl shadow-red-200'
                    }`}
                >
                  Confirm {approvalData.approved ? 'Approve' : 'Reject'}
                </button>
                <button onClick={() => setShowApprovalModal(false)} className="px-6 py-4 bg-gray-100 text-gray-400 rounded-2xl font-black transition-colors">
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
