'use client';

import React, { useState } from 'react';
import { useSystem } from '@/contexts/SystemContext';
import { Settings, Shield, History, Save, RotateCcw, TrendingUp, Clock, Percent } from 'lucide-react';
import { motion } from 'framer-motion';

export function ManagerSettings() {
    const { settings, updateSettings, auditLogs } = useSystem();
    const [localSettings, setLocalSettings] = useState(settings);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            updateSettings(localSettings);
            setIsSaving(false);
        }, 800);
    };

    return (
        <div className="space-y-10 pb-20">
            <header>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">System <span className="text-primary italic">Configuration</span></h1>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-2">Policy Engine & Audit Trail</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Policy Engine */}
                <div className="lg:col-span-2 space-y-8">
                    <section className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-gray-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Settings className="w-40 h-40" />
                        </div>

                        <div className="flex items-center gap-3 mb-10">
                            <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                                <Shield className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-black text-gray-900">Loan Policy Engine</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-4">
                                <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                                    <Percent className="w-3 h-3 text-primary" />
                                    Monthly Interest Rate
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={localSettings.interestRate * 100}
                                        onChange={(e) => setLocalSettings({ ...localSettings, interestRate: parseFloat(e.target.value) / 100 })}
                                        className="w-full bg-gray-50 border-none rounded-2xl p-5 font-black text-xl focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                    />
                                    <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-gray-300">%</span>
                                </div>
                                <p className="text-[10px] text-gray-400 font-medium italic">Applied monthly on flat or reducing balance.</p>
                            </div>

                            <div className="space-y-4">
                                <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                                    <Clock className="w-3 h-3 text-primary" />
                                    Maximum Loan Tenure
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={localSettings.maxTenure}
                                        onChange={(e) => setLocalSettings({ ...localSettings, maxTenure: parseInt(e.target.value) })}
                                        className="w-full bg-gray-50 border-none rounded-2xl p-5 font-black text-xl focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                    />
                                    <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-gray-300">MO</span>
                                </div>
                                <p className="text-[10px] text-gray-400 font-medium italic">Staff cannot apply for terms longer than this.</p>
                            </div>

                            <div className="space-y-4">
                                <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                                    <TrendingUp className="w-3 h-3 text-primary" />
                                    Salary Cap Multiplier
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={localSettings.salaryCapMultiplier}
                                        onChange={(e) => setLocalSettings({ ...localSettings, salaryCapMultiplier: parseFloat(e.target.value) })}
                                        className="w-full bg-gray-50 border-none rounded-2xl p-5 font-black text-xl focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                    />
                                    <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-gray-300">X</span>
                                </div>
                                <p className="text-[10px] text-gray-400 font-medium italic">Limits total repayment to (X * Monthly Salary).</p>
                            </div>
                        </div>

                        <div className="mt-12 flex gap-4">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex-1 bg-primary text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                            >
                                {isSaving ? <RotateCcw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                {isSaving ? 'Updating...' : 'Save Configuration'}
                            </button>
                        </div>
                    </section>
                </div>

                {/* Audit Logs Sidebar */}
                <div className="space-y-6">
                    <div className="bg-gray-900 rounded-[2.5rem] p-8 shadow-2xl border border-white/5 h-[600px] flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-white font-black uppercase tracking-widest text-xs flex items-center gap-2">
                                <History className="w-4 h-4 text-primary" />
                                System Logs
                            </h3>
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                            {auditLogs.length === 0 ? (
                                <div className="text-center py-20 opacity-20">
                                    <p className="text-white font-black text-xs uppercase tracking-widest">No logs recorded</p>
                                </div>
                            ) : (
                                auditLogs.map((log) => (
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        key={log.id}
                                        className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="text-[10px] font-black text-primary uppercase tracking-tighter truncate max-w-[120px]">{log.action}</p>
                                            <p className="text-[8px] text-gray-500 font-bold">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                        <p className="text-[10px] font-bold text-gray-300 leading-tight mb-2">{log.details}</p>
                                        <p className="text-[8px] text-gray-600 font-black uppercase tracking-widest group-hover:text-gray-400 transition-colors">By: {log.user}</p>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
