'use client';

import { Sidebar } from '@/components/Sidebar';
import { Notifications } from '@/components/layout/Notifications';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Menu, X, Bell } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const { user } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const role = user?.role || 'staff';

    return (
        <ProtectedRoute>
            <div className="flex min-h-screen bg-[#F8FAFC] overflow-x-hidden">
                {/* Desktop Sidebar (Fixed) */}
                <div className="hidden lg:block h-screen fixed left-0 top-0 z-50">
                    <Sidebar role={role as 'manager' | 'staff'} />
                </div>

                {/* Mobile Header */}
                <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 z-40 px-4 sm:px-6 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
                            <span className="text-white font-black text-xs italic">LS</span>
                        </div>
                        <span className="font-black text-gray-900 tracking-tighter uppercase text-sm">LoanSwift</span>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2.5 bg-gray-50 text-gray-900 rounded-xl transition-all active:scale-95"
                    >
                        {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>

                {/* Mobile Sidebar Overlay */}
                <AnimatePresence>
                    {isSidebarOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsSidebarOpen(false)}
                                className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-md z-[60]"
                            />
                            <motion.div
                                initial={{ x: '-100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '-100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="lg:hidden fixed inset-y-0 left-0 w-72 z-[70]"
                                style={{ width: '280px' }} // Force full width for mobile menu
                            >
                                <Sidebar role={role as 'manager' | 'staff'} forceExpand={true} />
                                {/* Overlay "Close" button for mobile UX */}
                                <button
                                    onClick={() => setIsSidebarOpen(false)}
                                    className="absolute top-6 -right-12 p-2 text-white hover:bg-white/10 rounded-full"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* Main Content Area */}
                <main className={`
                    flex-1 min-h-screen pt-16 lg:pt-0 
                    lg:pl-[88px] transition-all duration-300
                    overflow-x-hidden w-full
                `}>
                    {/* Top Top bar for Desktop */}
                    <div className="hidden lg:flex h-20 px-10 items-center justify-end gap-6 bg-white/50 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-30">
                        <Notifications />
                        <div className="flex items-center gap-3 pl-4 border-l border-gray-100">
                            <div className="text-right">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{role} session</p>
                                <p className="text-xs font-bold text-gray-900">{user?.email || 'Active User'}</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 font-bold border border-gray-200">
                                {user?.email?.[0].toUpperCase() || 'U'}
                            </div>
                        </div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                        className="max-w-[1400px] mx-auto p-4 sm:p-6 md:p-10 lg:p-12 overflow-x-hidden pb-20 sm:pb-12"
                    >
                        {children}
                    </motion.div>
                </main>
            </div>
        </ProtectedRoute>
    );
}
