'use client';

import React from "react"

import { useState } from 'react';
import { createLoanApplication, uploadFile } from '@/lib/db';
import { Timestamp } from 'firebase/firestore';

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
  const [loanAmount, setLoanAmount] = useState(50000);
  const [loanReason, setLoanReason] = useState('');
  const [loanTerm, setLoanTerm] = useState(12);
  const [interestRate, setInterestRate] = useState(8);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [appointmentLetter, setAppointmentLetter] = useState<File | null>(null);
  const [passportPhoto, setPassportPhoto] = useState<File | null>(null);

  const maxLoan = monthlyIncome * 20;
  const monthlyRate = interestRate / 100 / 12;
  const emi =
    loanAmount === 0
      ? 0
      : (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, loanTerm)) /
      (Math.pow(1 + monthlyRate, loanTerm) - 1);

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
        interestRate,
        monthlyEMI: emi,
        status: 'pending',
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
              <span className="absolute right-3 top-2 text-gray-500 text-sm">₹</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Max: ₹{Math.round(maxLoan).toLocaleString()}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Loan Term (Months)</label>
            <input
              type="number"
              min="6"
              max="60"
              value={loanTerm}
              onChange={(e) => setLoanTerm(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Interest Rate (%)</label>
            <input
              type="number"
              min="0"
              max="25"
              step="0.1"
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Monthly EMI</label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 font-medium">
              ₹{emi.toFixed(2)}
            </div>
          </div>
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
              <span className="font-medium">Total Loan Amount:</span> ₹{loanAmount.toLocaleString()}
            </p>
            <p>
              <span className="font-medium">Monthly EMI:</span> ₹{emi.toFixed(2)}
            </p>
            <p>
              <span className="font-medium">Total Duration:</span> {loanTerm} months
            </p>
            <p>
              <span className="font-medium">Total Amount to Pay:</span> ₹
              {(emi * loanTerm).toFixed(2)}
            </p>
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
