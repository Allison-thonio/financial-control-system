'use client';

import { useState } from 'react';
import { LoanApp, updateLoanStatus } from '@/lib/db';

interface LoanApprovalModalProps {
  loan: LoanApp;
  managerName: string;
  onClose: () => void;
  onApproval: () => void;
}

export default function LoanApprovalModal({
  loan,
  managerName,
  onClose,
  onApproval,
}: LoanApprovalModalProps) {
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleApprove = async () => {
    setLoading(true);
    try {
      if (!loan.id) throw new Error('Loan ID not found');
      await updateLoanStatus(loan.id, 'approved', `Approved by ${managerName}`);
      onApproval();
      onClose();
    } catch (err) {
      setError('Failed to approve loan. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }
    setLoading(true);
    try {
      if (!loan.id) throw new Error('Loan ID not found');
      await updateLoanStatus(loan.id, 'rejected', `Rejected by ${managerName}: ${rejectionReason.trim()}`);
      onApproval();
      onClose();
    } catch (err) {
      setError('Failed to reject loan. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-center">
          <h2 className="text-xl font-bold">Loan Application Review</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-800 p-1 rounded"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>}

          {action === null ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Applicant Name</p>
                  <p className="text-lg font-semibold">{loan.userName || loan.borrowerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-lg font-semibold">{loan.email || loan.staffEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Loan Amount</p>
                  <p className="text-lg font-semibold text-blue-600">₹{loan.loanAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Monthly Income</p>
                  <p className="text-lg font-semibold">₹{loan.monthlyIncome.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Monthly EMI</p>
                  <p className="text-lg font-semibold">₹{loan.monthlyEMI.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">EMI to Income Ratio</p>
                  <p className="text-lg font-semibold">
                    {((loan.monthlyEMI / loan.monthlyIncome) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 font-semibold mb-2">Reason for Loan</p>
                <p className="text-gray-800">{loan.loanReason}</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setAction('approve')}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  Approve
                </button>
                <button
                  onClick={() => setAction('reject')}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  Reject
                </button>
              </div>
            </>
          ) : action === 'approve' ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-semibold">Confirm Approval?</p>
                <p className="text-green-700 text-sm mt-2">
                  You are about to approve a loan of ₹{loan.loanAmount.toLocaleString()} for {loan.userName || loan.borrowerName}.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleApprove}
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg"
                >
                  {loading ? 'Processing...' : 'Confirm Approval'}
                </button>
                <button
                  onClick={() => setAction(null)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 font-semibold">Provide Rejection Reason</p>
              </div>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={4}
                placeholder="Explain why this loan application is being rejected..."
              />
              <div className="flex gap-3">
                <button
                  onClick={handleReject}
                  disabled={loading || !rejectionReason.trim()}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg"
                >
                  {loading ? 'Processing...' : 'Confirm Rejection'}
                </button>
                <button
                  onClick={() => setAction(null)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
