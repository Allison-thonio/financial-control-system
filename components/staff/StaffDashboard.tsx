'use client';

import React from "react"

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Plus, FileText, AlertCircle } from 'lucide-react';
import { useSimpleAuth } from '@/hooks/useSimpleAuth';

export interface LoanApp {
  id: string;
  loanAmount: number;
  monthlyIncome: number;
  loanTenure: number;
  monthlyEMI: number;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  createdAt: string;
}

export function StaffDashboard() {
  const { user, loading: authLoading } = useSimpleAuth();
  const router = useRouter();
  const [loans, setLoans] = useState<LoanApp[]>([
    {
      id: '1',
      loanAmount: 50000,
      monthlyIncome: 30000,
      loanTenure: 12,
      monthlyEMI: 4250,
      status: 'approved',
      createdAt: '2024-01-15',
    },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    loanAmount: '',
    monthlyIncome: '',
    loanTenure: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  const calculateEMI = (principal: number, rate: number, tenure: number) => {
    const monthlyRate = rate / 100 / 12;
    const emi =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) /
      (Math.pow(1 + monthlyRate, tenure) - 1);
    return Math.round(emi);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formData.loanAmount);
    const income = parseFloat(formData.monthlyIncome);
    const months = 3; // Enforced 3-month cap
    const interestPerMonth = 0.1; // 10% per month

    if (!amount || !income) {
      alert('Please fill all fields');
      return;
    }

    // AI Check: total repayment (Principal + 30% interest) <= 3 months salary
    const totalRepayment = amount * 1.3;
    const maxCapacity = income * 3;

    // Check existing loans for overlapping capacity
    const currentOutstanding = loans
      .filter(l => l.status === 'approved' || l.status === 'pending')
      .reduce((sum, l) => sum + (l.loanAmount * 1.3), 0);

    if (totalRepayment + currentOutstanding > maxCapacity) {
      alert(`Loan Denied by AI: Your total loan obligation (₦${(totalRepayment + currentOutstanding).toLocaleString()}) would exceed your 3-month salary cap (₦${maxCapacity.toLocaleString()}).`);
      return;
    }

    const emi = Math.round(totalRepayment / months);
    const newLoan: LoanApp = {
      id: Date.now().toString(),
      loanAmount: amount,
      monthlyIncome: income,
      loanTenure: months,
      monthlyEMI: emi,
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setLoans([newLoan, ...loans]);
    setFormData({ loanAmount: '', monthlyIncome: '', loanTenure: '3' });
    setShowForm(false);
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
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Staff <span className="text-primary">Dashboard</span></h1>
        <p className="text-sm text-gray-500 font-medium">Manage your loan applications and view approval status</p>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        {/* Action Button */}
        <div className="mb-8 flex gap-4">
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition font-bold shadow-lg"
          >
            <Plus className="w-4 h-4" />
            New Loan Application
          </button>
        </div>

        {/* Application Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Apply for a Loan</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loan Amount
                  </label>
                  <input
                    type="number"
                    value={formData.loanAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, loanAmount: e.target.value })
                    }
                    placeholder="50000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Income
                  </label>
                  <input
                    type="number"
                    value={formData.monthlyIncome}
                    onChange={(e) =>
                      setFormData({ ...formData, monthlyIncome: e.target.value })
                    }
                    placeholder="30000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tenure (Months)
                  </label>
                  <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-500 font-bold">
                    3 Months (Fixed Cap)
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Submit Application
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Loans List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Your Loan Applications</h2>
          {loans.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-600">No loan applications yet</p>
            </div>
          ) : (
            loans.map((loan) => (
              <div key={loan.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">
                      Loan: {loan.loanAmount.toLocaleString()}
                    </h3>
                    <p className="text-sm text-gray-600">{loan.createdAt}</p>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-medium ${loan.status === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : loan.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                      }`}
                  >
                    {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Loan Amount</p>
                    <p className="font-semibold">
                      {loan.loanAmount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Monthly EMI</p>
                    <p className="font-semibold">{loan.monthlyEMI.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tenure</p>
                    <p className="font-semibold">{loan.loanTenure} months</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Monthly Income</p>
                    <p className="font-semibold">
                      {loan.monthlyIncome.toLocaleString()}
                    </p>
                  </div>
                </div>

                {loan.reason && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{loan.reason}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
