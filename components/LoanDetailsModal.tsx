'use client';

import { LoanApplication, calculateRepaymentSchedule } from '@/lib/db';
import StatusBadge from './StatusBadge';

interface LoanDetailsModalProps {
  loan: LoanApplication;
  onClose: () => void;
}

export default function LoanDetailsModal({ loan, onClose }: LoanDetailsModalProps) {
  const monthlyRate = loan.interestRate / 100 / 12;
  const schedule = calculateRepaymentSchedule(loan.loanAmount, monthlyRate, loan.loanTerm);

  const totalInterest = schedule.reduce((sum, item) => sum + item.interest, 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-96 overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-center">
          <h2 className="text-xl font-bold">Loan Details</h2>
          <button onClick={onClose} className="text-white hover:bg-blue-800 p-1 rounded">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600">Applicant</p>
                <p className="text-2xl font-bold text-gray-900">{loan.userName}</p>
              </div>
              <StatusBadge status={loan.status} />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Loan Amount</p>
              <p className="text-2xl font-bold text-blue-600">₹{loan.loanAmount.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Monthly Income</p>
              <p className="text-2xl font-bold">₹{loan.monthlyIncome.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Monthly EMI</p>
              <p className="text-2xl font-bold text-green-600">₹{loan.monthlyEMI.toFixed(2)}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Interest Rate</p>
              <p className="text-2xl font-bold">{loan.interestRate}%</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Loan Term</p>
              <p className="text-2xl font-bold">{loan.loanTerm} months</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Interest</p>
              <p className="text-2xl font-bold text-orange-600">₹{totalInterest.toFixed(2)}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600 font-semibold mb-2">Loan Reason</p>
            <p className="text-gray-800">{loan.loanReason}</p>
          </div>

          {loan.status === 'approved' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-semibold">Approved by: {loan.approvedBy}</p>
              <p className="text-green-700 text-sm">
                On: {loan.approvalDate?.toDate().toLocaleDateString()}
              </p>
            </div>
          )}

          {loan.status === 'rejected' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-semibold mb-2">Rejection Reason</p>
              <p className="text-red-700">{loan.rejectionReason}</p>
            </div>
          )}

          {schedule.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 font-semibold mb-4">Repayment Schedule (First 6 months)</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left">Month</th>
                      <th className="px-4 py-2 text-right">EMI</th>
                      <th className="px-4 py-2 text-right">Principal</th>
                      <th className="px-4 py-2 text-right">Interest</th>
                      <th className="px-4 py-2 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.slice(0, 6).map((row) => (
                      <tr key={row.month} className="border-b">
                        <td className="px-4 py-2">{row.month}</td>
                        <td className="px-4 py-2 text-right">₹{row.emi.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right">₹{row.principal.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right">₹{row.interest.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right font-semibold">₹{row.balance.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {schedule.length > 6 && (
                <p className="text-xs text-gray-500 mt-2">Showing first 6 months of {schedule.length} total months</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
