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
  Search
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateTotalRepayment, getDetailedRepaymentSchedule } from '@/lib/loanLogic';
import { useSystem } from '@/contexts/SystemContext';

export interface LoanApp {
  id: string;
  staffEmail: string;
  loanAmount: number;
  monthlyIncome: number;
  loanTenure: number;
  monthlyEMI: number;
  status: 'pending' | 'approved' | 'rejected';
  approvalReason?: string;
  createdAt: string;
  repaymentType: 'default' | 'custom';
  customRepayments?: number[];
  appointmentLetter?: string;
  passportPhoto?: string;
  nin?: string;
}

export function ManagerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { settings, addAuditLog } = useSystem();
  const router = useRouter();
  const [loans, setLoans] = useState<LoanApp[]>([
    {
      id: '1',
      staffEmail: 'thinkerricker@gmail.com',
      loanAmount: 50000,
      monthlyIncome: 30000,
      loanTenure: 3,
      monthlyEMI: 21666,
      status: 'pending',
      createdAt: '2024-01-15',
      repaymentType: 'default',
    },
    {
      id: '2',
      staffEmail: 'robert.brown@company.com',
      loanAmount: 200000,
      monthlyIncome: 80000,
      loanTenure: 3,
      monthlyEMI: 86666,
      status: 'approved',
      createdAt: '2024-01-20',
      repaymentType: 'custom',
      customRepayments: [100000, 80000, 80000],
      nin: '12345678901',
      appointmentLetter: 'robert_offer_letter.pdf',
      passportPhoto: 'robert_face.jpg',
    },
    {
      id: '3',
      staffEmail: 'jane.smith@company.com',
      loanAmount: 120000,
      monthlyIncome: 50000,
      loanTenure: 12,
      monthlyEMI: 22000,
      status: 'pending',
      createdAt: '2024-01-22',
      repaymentType: 'default',
      appointmentLetter: 'jane_docs.pdf',
      passportPhoto: 'jane_avatar.png',
    }
  ]);

  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLoan, setSelectedLoan] = useState<LoanApp | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [approvalData, setApprovalData] = useState({ approved: false, reason: '' });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  const filteredLoans = useMemo(() => {
    return loans.filter((loan) => {
      const matchesStatus = filterStatus === 'all' || loan.status === filterStatus;
      const matchesSearch = loan.staffEmail.toLowerCase().includes(searchQuery.toLowerCase()) || loan.id.includes(searchQuery);
      return matchesStatus && matchesSearch;
    });
  }, [loans, filterStatus, searchQuery]);

  const stats = useMemo(() => {
    const approvedLoans = loans.filter((l) => l.status === 'approved');
    return {
      total: loans.length,
      pending: loans.filter((l) => l.status === 'pending').length,
      approved: approvedLoans.length,
      rejected: loans.filter((l) => l.status === 'rejected').length,
      totalDisbursed: approvedLoans.reduce((sum, l) => sum + l.loanAmount, 0),
    };
  }, [loans]);

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

  const submitApproval = () => {
    if (selectedLoan) {
      setLoans(
        loans.map((loan) =>
          loan.id === selectedLoan.id
            ? {
              ...loan,
              status: approvalData.approved ? 'approved' : 'rejected',
              approvalReason: approvalData.reason || undefined,
            }
            : loan
        )
      );

      addAuditLog(
        approvalData.approved ? 'Loan Approved' : 'Loan Rejected',
        user?.email || 'Manager',
        `Loan ID: ${selectedLoan.id}, Staff: ${selectedLoan.staffEmail}${!approvalData.approved ? `, Reason: ${approvalData.reason}` : ''}`
      );

      setShowApprovalModal(false);
      setSelectedLoan(null);
      setApprovalData({ approved: false, reason: '' });
    }
  };

  if (authLoading) return null;

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
            Manager <span className="text-primary">Dashboard</span>
          </h1>
          <p className="text-sm text-gray-500 font-medium">Control center for loan approvals and financial overview</p>
        </div>

        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
          {(['all', 'pending', 'approved'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterStatus === s ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:text-gray-600'
                }`}
            >
              {s}
            </button>
          ))}
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Requests', value: stats.total, icon: FileText, color: 'blue' },
          { label: 'Pending Action', value: stats.pending, icon: Clock, color: 'amber' },
          { label: 'Total Approved', value: stats.approved, icon: CheckCircle, color: 'emerald' },
          { label: 'Disbursed', value: `₦${(stats.totalDisbursed / 1000).toFixed(0)}k`, icon: DollarSign, color: 'primary' },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-[2rem] border border-gray-50 shadow-sm hover:shadow-xl transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl bg-${item.color === 'primary' ? 'primary' : item.color + '-500'}/10 text-${item.color === 'primary' ? 'primary' : item.color + '-600'}`}>
                <item.icon className="w-6 h-6" />
              </div>
              <TrendingUp className="w-5 h-5 text-gray-200 group-hover:text-emerald-500 transition-colors" />
            </div>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{item.label}</p>
            <p className="text-3xl font-black text-gray-900 mt-1">{item.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Search & Actions Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search by staff email or loan ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all text-sm font-medium"
          />
        </div>
        <button className="px-6 py-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
          <Filter className="w-5 h-5 text-gray-400" />
          <span className="text-sm font-bold text-gray-600">Filters</span>
        </button>
      </div>

      {/* Responsive Table / Cards */}
      <div className="bg-white rounded-[2.5rem] border border-gray-50 shadow-sm overflow-hidden">
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Applicant</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Principal</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tenure</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Monthly EMI</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredLoans.map((loan, idx) => (
                <motion.tr
                  key={loan.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="hover:bg-gray-50/50 transition-colors group"
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold">
                        {loan.staffEmail[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{loan.staffEmail}</p>
                        <p className="text-[10px] text-gray-400 font-medium">#{loan.id.slice(-6)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-black text-gray-900">₦{loan.loanAmount.toLocaleString()}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-xs font-bold text-gray-600">{loan.loanTenure} Mo</span>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-bold text-primary">₦{loan.monthlyEMI.toLocaleString()}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${loan.status === 'approved' ? 'bg-emerald-50 text-emerald-600' :
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
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile List View */}
        <div className="lg:hidden divide-y divide-gray-50">
          {filteredLoans.map((loan) => (
            <div key={loan.id} className="p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold">
                    {loan.staffEmail[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{loan.staffEmail.split('@')[0]}</p>
                    <p className="text-[10px] text-gray-400 font-medium">#{loan.id.slice(-6)}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-tighter ${loan.status === 'approved' ? 'bg-emerald-50 text-emerald-600' :
                  loan.status === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                  {loan.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-[8px] text-gray-400 font-black uppercase mb-1">Loan Amount</p>
                  <p className="text-sm font-black">₦{loan.loanAmount.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-[8px] text-gray-400 font-black uppercase mb-1">Monthly EMI</p>
                  <p className="text-sm font-black text-primary">₦{loan.monthlyEMI.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleViewDetails(loan)}
                  className="flex-1 py-3 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-widest"
                >
                  View Details
                </button>
                {loan.status === 'pending' && (
                  <button
                    onClick={() => handleApprove(loan)}
                    className="flex-1 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest"
                  >
                    Approve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredLoans.length === 0 && (
          <div className="p-20 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-gray-200" />
            </div>
            <p className="text-gray-400 font-bold">No matching loan requests found</p>
          </div>
        )}
      </div>

      {/* Details Modal with Prescriptive Calculations */}
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
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Loan <span className="text-primary italic">Spreadsheet</span></h2>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Ref No: {selectedLoan.id}</p>
                  </div>
                  <button onClick={() => setShowDetailsModal(false)} className="p-3 hover:bg-gray-100 rounded-full transition-colors">
                    <XCircle className="w-8 h-8 text-gray-300" />
                  </button>
                </header>

                {/* Main Data Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="space-y-6">
                    <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10">
                      <p className="text-[10px] text-primary font-black uppercase mb-2">Total Repayment</p>
                      <p className="text-3xl font-black text-gray-900">₦{calculateTotalRepayment(selectedLoan.loanAmount, selectedLoan.loanTenure).total.toLocaleString()}</p>
                      <p className="text-xs text-emerald-600 font-bold mt-1 leading-tight">Incl. 10% monthly interest</p>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Applicant Details</h4>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center font-black text-gray-600">
                          {selectedLoan.staffEmail[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{selectedLoan.staffEmail}</p>
                          <p className="text-xs text-gray-500">Verified Employee</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2 space-y-6">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Monthly Repayment Spreadsheet
                    </h4>
                    <div className="bg-gray-50/50 rounded-[2rem] border border-gray-100 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-white/50">
                          <tr>
                            <th className="px-6 py-4 font-black uppercase tracking-tighter">Month</th>
                            <th className="px-6 py-4 font-black uppercase tracking-tighter">Principal</th>
                            <th className="px-6 py-4 font-black uppercase tracking-tighter">Interest</th>
                            <th className="px-6 py-4 font-black uppercase tracking-tighter text-primary">Total</th>
                            <th className="px-6 py-4 font-black uppercase tracking-tighter">Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {getDetailedRepaymentSchedule(selectedLoan.loanAmount, selectedLoan.loanTenure, new Date(selectedLoan.createdAt), settings).map((step, i) => (
                            <tr key={i} className="hover:bg-white transition-colors">
                              <td className="px-6 py-4 font-medium">{new Date(step.year, step.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</td>
                              <td className="px-6 py-4">₦{step.principal.toLocaleString()}</td>
                              <td className="px-6 py-4">₦{step.interest.toLocaleString()}</td>
                              <td className="px-6 py-4 font-black text-primary">₦{step.total.toLocaleString()}</td>
                              <td className="px-6 py-4 text-gray-400">₦{step.remainingBalance.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Verification Documentation */}
                <div className="space-y-6 pt-4">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Employee Verification Records
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-5 border border-gray-100 rounded-3xl bg-gray-50/50 flex items-center justify-between hover:bg-white hover:shadow-md transition-all">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 rounded-2xl text-blue-600"><Briefcase className="w-5 h-5" /></div>
                        <div><p className="text-[10px] font-black">Offer Letter</p><p className="text-[8px] text-gray-400 truncate max-w-[80px]">{selectedLoan.appointmentLetter || 'verified.pdf'}</p></div>
                      </div>
                      <button className="p-2 border border-blue-100 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors"><Download className="w-4 h-4" /></button>
                    </div>

                    <div className="p-5 border border-gray-100 rounded-3xl bg-gray-50/50 flex items-center justify-between hover:bg-white hover:shadow-md transition-all">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-600"><UserCheck className="w-5 h-5" /></div>
                        <div><p className="text-[10px] font-black">Passport Photo</p><p className="text-[8px] text-gray-400">Employee-Identity.jpg</p></div>
                      </div>
                      <button className="p-2 border border-emerald-100 text-emerald-600 rounded-xl hover:bg-emerald-50 transition-colors"><Eye className="w-4 h-4" /></button>
                    </div>

                    <div className="p-5 bg-gray-900 rounded-3xl flex items-center justify-between text-white lg:col-span-1 border border-gray-800 shadow-xl overflow-hidden relative">
                      <div className="absolute right-0 top-0 h-full w-24 bg-white/5 skew-x-[20deg] translate-x-12" />
                      <div className="flex items-center gap-4 relative z-10">
                        <div className="p-3 bg-white/10 rounded-2xl"><IdCard className="w-6 h-6 text-gray-400" /></div>
                        <div>
                          <p className="text-[8px] text-gray-400 font-black uppercase">National ID (NIN)</p>
                          <p className="text-sm font-mono font-black tracking-widest">{selectedLoan.nin || 'UNPROVIDED'}</p>
                        </div>
                      </div>
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

      {/* Basic Approval/Rejection Modal */}
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
                <p className="text-xs text-gray-500 mt-1">For: {selectedLoan.staffEmail}</p>
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
