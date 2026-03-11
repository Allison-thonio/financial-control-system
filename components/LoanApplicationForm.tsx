'use client';

import React from "react"
import { useState } from 'react';
import { createLoanApplication, uploadFile } from '@/lib/db';
import { Timestamp } from 'firebase/firestore';
import { useSystem } from '@/contexts/SystemContext';
import { calculateTotalRepayment } from '@/lib/loanLogic';

interface LoanApplicationFormProps {
  userId: string;
  userName: string;
  email: string;
  monthlyIncome: number;
  onSuccess: () => void;
}

export default function LoanApplicationForm({
  userId,
  userName,
  email,
  monthlyIncome,
  onSuccess,
}: LoanApplicationFormProps) {
  const { settings } = useSystem();

  const [loanAmount, setLoanAmount] = useState(50000);
  const [loanReason, setLoanReason] = useState('');
  const [loanTerm, setLoanTerm] = useState(12);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [appointmentLetter, setAppointmentLetter] = useState<File | null>(null);
  const [passportPhoto, setPassportPhoto] = useState<File | null>(null);
  const [isSalaryOffset, setIsSalaryOffset] = useState(false);

  // Interest rate is always locked to the system-configured rate (default 10%)
  const systemRate = settings.interestRate; // e.g. 0.10
  const systemRatePercent = Math.round(systemRate * 100); // e.g. 10

  const maxLoan = monthlyIncome * 20;

  // Use the same calculation engine as loanLogic.ts for consistency
  const repayment = loanAmount > 0
    ? calculateTotalRepayment(loanAmount, loanTerm, monthlyIncome, settings, isSalaryOffset)
    : { total: 0, interest: 0, isReducing: false };

  const totalRepayment = repayment.total;
  const monthlyPayment = loanTerm > 0 ? totalRepayment / loanTerm : 0;
  const totalInterest = repayment.interest;

  // The interest rate we store is the system rate (as a percentage integer)
  const interestRateForStorage = systemRatePercent;
  const monthlyEMIForStorage = monthlyPayment;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!loanReason.trim()) {
        setError('Please provide a reason for the loan');
        setLoading(false);
        return;
      }

      if (loanAmount > maxLoan) {
        setError(`Loan amount cannot exceed ${Math.round(maxLoan).toLocaleString()}`);
        setLoading(false);
        return;
      }

      let appointmentLetterUrl = '';
      let passportPhotoUrl = '';

      if (appointmentLetter) {
        appointmentLetterUrl = await uploadFile(appointmentLetter, `documents/${userId}/appointment_letter_${Date.now()}`);
      }

      if (passportPhoto) {
        passportPhotoUrl = await uploadFile(passportPhoto, `documents/${userId}/passport_photo_${Date.now()}`);
      }

      await createLoanApplication({
        userId,
        userName,
        email,
        loanAmount,
        loanReason: loanReason.trim(),
        loanTerm,
        monthlyIncome,
        interestRate: interestRateForStorage,
        monthlyEMI: monthlyEMIForStorage,
        status: 'pending',
        repaymentType: isSalaryOffset ? 'salary_advance' : 'default',
        appointmentLetter: appointmentLetterUrl,
        passportPhoto: passportPhotoUrl,
      });

      onSuccess();
    } catch (err) {
      setError('Failed to submit application. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Apply for Loan</h2>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Loan Amount</label>
            <div className="relative">
              <input
                type="number"
                min="10000"
                max={maxLoan}
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute right-3 top-2 text-gray-500 text-sm">₦</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Max: ₦{Math.round(maxLoan).toLocaleString()}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Loan Term (Months)</label>
            <input
              type="number"
              min="1"
              max={settings.maxTenure}
              value={loanTerm}
              onChange={(e) => setLoanTerm(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Max tenure: {settings.maxTenure} months</p>
          </div>

          {/* Interest rate is fixed — display only, not editable */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Interest Rate</label>
            <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-600 font-semibold flex items-center justify-between">
              <span>{systemRatePercent}% per month (fixed)</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">System Rate</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Set by management. Not adjustable.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Payment</label>
            <div className={`px-3 py-2 border rounded-lg font-medium ${isSalaryOffset ? 'bg-orange-50 border-orange-200 text-orange-800' : 'bg-gray-50 border-gray-300 text-gray-700'}`}>
              {isSalaryOffset ? 'Variable (Salary Take)' : `₦${monthlyPayment.toFixed(2)}`}
            </div>
          </div>
        </div>

        {/* Repayment Type Toggle */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-gray-900">Repayment Mode</h4>
            <p className="text-xs text-gray-500">
              {isSalaryOffset 
                ? "Takes full salary for initial months, interest deferred to final month." 
                : "Equal monthly installments including principal and interest."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsSalaryOffset(!isSalaryOffset)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ring-2 ring-offset-2 ${isSalaryOffset ? 'bg-orange-500 ring-orange-500' : 'bg-gray-200 ring-transparent'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isSalaryOffset ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Loan</label>
          <textarea
            value={loanReason}
            onChange={(e) => setLoanReason(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Explain why you need this loan..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Appointment Letter (PDF/Image)</label>
            <input
              type="file"
              onChange={(e) => setAppointmentLetter(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              accept=".pdf,image/*"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Passport Photo (Image)</label>
            <input
              type="file"
              onChange={(e) => setPassportPhoto(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              accept="image/*"
            />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-3">Loan Summary</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>
              <span className="font-medium">Principal Amount:</span> ₦{loanAmount.toLocaleString()}
            </p>
            <p>
              <span className="font-medium">Interest Rate:</span> {systemRatePercent}% (flat, system-fixed)
            </p>
            <p>
              <span className="font-medium">Total Interest:</span> ₦{totalInterest.toFixed(2)}
            </p>
            <p>
              <span className="font-medium">Monthly Payment:</span> ₦{monthlyPayment.toFixed(2)}
            </p>
            <p>
              <span className="font-medium">Total Duration:</span> {loanTerm} months
            </p>
            <div className="border-t border-blue-200 pt-2 mt-2">
              <p className="font-bold text-blue-900 text-base">
                Total Amount to Repay: ₦{totalRepayment.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
        >
          {loading ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
    </div>
  );
}
