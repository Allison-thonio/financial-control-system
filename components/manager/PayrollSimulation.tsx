'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSystem } from '@/contexts/SystemContext';
import { Wallet, ArrowDownCircle, Banknote, Receipt, User, Search, Calculator } from 'lucide-react';
import { motion } from 'framer-motion';

export function PayrollSimulation() {
    const { user } = useAuth();
    const { settings } = useSystem();
    const [grossSalary, setGrossSalary] = useState(250000);
    const [loanEMI, setLoanEMI] = useState(45000);
    const [taxRate, setTaxRate] = useState(0.05); // 5% flat tax for sim

    const netPay = useMemo(() => {
        const taxAmount = grossSalary * taxRate;
        return grossSalary - taxAmount - loanEMI;
    }, [grossSalary, loanEMI, taxRate]);

    return (
        <div className="space-y-10 pb-20">
            <header>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">Payroll <span className="text-primary italic">Simulation</span></h1>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-2">Deduction Analysis & Disbursement Projection</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Simulation Inputs */}
                <div className="lg:col-span-1 space-y-6">
                    <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-3 bg-gray-900 rounded-2xl text-white">
                                <Calculator className="w-5 h-5" />
                            </div>
                            <h3 className="font-black text-gray-900 uppercase tracking-tighter">Adjust Parameters</h3>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Gross Monthly Salary</label>
                                <input
                                    type="number"
                                    value={grossSalary}
                                    onChange={(e) => setGrossSalary(Number(e.target.value))}
                                    className="w-full bg-gray-50 border-none rounded-2xl p-4 font-black text-lg focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Loan EMI</label>
                                <input
                                    type="number"
                                    value={loanEMI}
                                    onChange={(e) => setLoanEMI(Number(e.target.value))}
                                    className="w-full bg-gray-50 border-none rounded-2xl p-4 font-black text-lg focus:ring-4 focus:ring-primary/10 transition-all outline-none text-red-500"
                                />
                            </div>
                        </div>
                    </section>
                </div>

                {/* The Payslip Preview */}
                <div className="lg:col-span-2">
                    <section className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100">
                        <div className="bg-gray-900 p-10 text-white flex justify-between items-center relative">
                            <div className="absolute right-0 top-0 h-full w-40 bg-white/5 skew-x-[15deg] translate-x-10" />
                            <div>
                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-1">Confidential</p>
                                <h3 className="text-2xl font-black tracking-tighter">Electronic Payslip Simulation</h3>
                            </div>
                            <div className="text-right relative z-10">
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none">Status</p>
                                <p className="text-xs font-black text-emerald-500 uppercase">Projected</p>
                            </div>
                        </div>

                        <div className="p-10 space-y-12">
                            {/* Breakdown */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                {/* Earnings */}
                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <ArrowDownCircle className="w-4 h-4 text-emerald-500" />
                                        Gross Earnings
                                    </h4>
                                    <div className="flex justify-between items-center py-4 border-b border-gray-50">
                                        <p className="text-sm font-bold text-gray-600">Base Salary</p>
                                        <p className="text-sm font-black text-gray-900">₦{grossSalary.toLocaleString()}</p>
                                    </div>
                                    <div className="flex justify-between items-center py-4 border-b border-gray-50 bg-emerald-50/30 px-4 rounded-xl">
                                        <p className="text-sm font-black text-emerald-700">Total Credits</p>
                                        <p className="text-sm font-black text-emerald-700">₦{grossSalary.toLocaleString()}</p>
                                    </div>
                                </div>

                                {/* Deductions */}
                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <ArrowDownCircle className="w-4 h-4 text-red-500 rotate-180" />
                                        Deductions
                                    </h4>
                                    <div className="flex justify-between items-center py-4 border-b border-gray-50">
                                        <p className="text-sm font-bold text-gray-600 italic underline decoration-primary decoration-2">Loan Swift Deduction</p>
                                        <p className="text-sm font-black text-red-500">-₦{loanEMI.toLocaleString()}</p>
                                    </div>
                                    <div className="flex justify-between items-center py-4 border-b border-gray-50">
                                        <p className="text-sm font-bold text-gray-600">Statutory Tax (5%)</p>
                                        <p className="text-sm font-black text-gray-900">-₦{(grossSalary * taxRate).toLocaleString()}</p>
                                    </div>
                                    <div className="flex justify-between items-center py-4 border-b border-gray-50 bg-red-50/30 px-4 rounded-xl">
                                        <p className="text-sm font-black text-red-700">Total Debits</p>
                                        <p className="text-sm font-black text-red-700">-₦{(loanEMI + (grossSalary * taxRate)).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Net Total */}
                            <div className="pt-10 border-t border-gray-100 flex flex-col items-center justify-center text-center">
                                <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mb-4">
                                    <Banknote className="w-10 h-10 text-primary" />
                                </div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Net Disbursement</p>
                                <p className="text-5xl font-black text-gray-900 tracking-tighter">₦{netPay.toLocaleString()}</p>
                                <p className="text-xs text-emerald-600 font-bold mt-2 italic px-6 py-2 bg-emerald-50 rounded-full inline-block">Safe to disburse: Remaining income exceeds 50% threshold</p>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-8 border-t border-gray-100 flex justify-center">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                Simulated by LoanSwift Core v1.0.4
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
