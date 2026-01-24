'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react';
import { useSimpleAuth } from '@/hooks/useSimpleAuth';

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
}

export function ManagerDashboard() {
  const { user, loading: authLoading } = useSimpleAuth();
  const router = useRouter();
  const [loans, setLoans] = useState<LoanApp[]>([
    {
      id: '1',
      staffEmail: 'thinkerricker@gmail.com',
      loanAmount: 50000,
      monthlyIncome: 30000,
      loanTenure: 12,
      monthlyEMI: 4250,
      status: 'pending',
      createdAt: '2024-01-15',
    },
  ]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedLoan, setSelectedLoan] = useState<LoanApp | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalData, setApprovalData] = useState({ approved: false, reason: '' });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  const filteredLoans =
    filterStatus === 'all' ? loans : loans.filter((loan) => loan.status === filterStatus);

  const stats = {
    total: loans.length,
    pending: loans.filter((l) => l.status === 'pending').length,
    approved: loans.filter((l) => l.status === 'approved').length,
    rejected: loans.filter((l) => l.status === 'rejected').length,
    totalDisbursed: loans
      .filter((l) => l.status === 'approved')
      .reduce((sum, l) => sum + l.loanAmount, 0),
  };

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
      setShowApprovalModal(false);
      setSelectedLoan(null);
      setApprovalData({ approved: false, reason: '' });
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('loanAppAuth');
    router.push('/login');
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Manager <span className="text-primary">Dashboard</span></h1>
        <p className="text-sm text-gray-500 font-medium">Overview of all staff loan applications and disbursements</p>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Applications</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Approved</p>
                <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Disbursed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(stats.totalDisbursed / 100000).toFixed(1)}L
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="mb-6 flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg font-medium transition ${filterStatus === status
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Loans Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Staff Email
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Loan Amount
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Monthly EMI
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Tenure
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLoans.map((loan) => (
                  <tr key={loan.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{loan.staffEmail}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {loan.loanAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {loan.monthlyEMI.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{loan.loanTenure} months</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${loan.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : loan.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                          }`}
                      >
                        {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {loan.status === 'pending' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(loan)}
                            className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition text-xs"
                          >
                            <CheckCircle className="w-3 h-3" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(loan)}
                            className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition text-xs"
                          >
                            <XCircle className="w-3 h-3" />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredLoans.length === 0 && (
          <div className="text-center py-8 text-gray-600">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No loans found with status: {filterStatus}</p>
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {showApprovalModal && selectedLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold mb-4">
              {approvalData.approved ? 'Approve Loan' : 'Reject Loan'}
            </h2>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Staff Email</p>
              <p className="font-semibold">{selectedLoan.staffEmail}</p>
              <p className="text-sm text-gray-600 mt-2">Loan Amount</p>
              <p className="font-semibold">{selectedLoan.loanAmount.toLocaleString()}</p>
            </div>

            {!approvalData.approved && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Rejection
                </label>
                <textarea
                  value={approvalData.reason}
                  onChange={(e) =>
                    setApprovalData({ ...approvalData, reason: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter reason..."
                  rows={3}
                />
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={submitApproval}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition ${approvalData.approved
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
                  }`}
              >
                {approvalData.approved ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
