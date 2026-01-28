'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    History,
    FileText,
    LogOut,
    ChevronRight,
    Search,
    User,
    Command
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface SidebarProps {
    role: 'manager' | 'staff';
    forceExpand?: boolean;
}

export function Sidebar({ role, forceExpand = false }: SidebarProps) {
    const pathname = usePathname();
    const { logout, user } = useAuth();
    const router = useRouter();
    const [isHovered, setIsHovered] = useState(false);

    const navItems = [
        {
            label: 'Dashboard',
            href: `/${role}`,
            icon: LayoutDashboard,
        },
        {
            label: 'Applications',
            href: role === 'manager' ? '/manager' : '/staff',
            icon: FileText,
        },
        {
            label: 'Loan History',
            href: '/loans',
            icon: History,
        },
    ];

    const handleLogout = async () => {
        try {
            await logout();
            router.push('/login');
        } catch (error) {
            console.error('Logout failed:', error);
            sessionStorage.removeItem('loanAppAuth');
            window.location.href = '/login';
        }
    };

    const sidebarWidth = forceExpand || isHovered ? 280 : 88;
    const isShowingLabels = forceExpand || isHovered;

    return (
        <motion.div
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            initial={{ width: 88 }}
            animate={{ width: sidebarWidth }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="h-full bg-gray-950 text-white flex flex-col relative z-50 border-r border-white/5 shadow-2xl overflow-hidden group/sidebar"
        >
            {/* Logo Section */}
            <div className="p-6 h-20 flex items-center overflow-hidden">
                <div className="flex items-center gap-4 min-w-[200px]">
                    <div className="w-10 h-10 bg-primary/20 backdrop-blur-md border border-primary/30 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                        <Command className="text-primary w-6 h-6" />
                    </div>
                    <motion.div
                        animate={{ opacity: isShowingLabels ? 1 : 0, x: isShowingLabels ? 0 : -10 }}
                        className="whitespace-nowrap"
                    >
                        <h2 className="text-lg font-black tracking-tight leading-tight">Loan<span className="text-primary">Swift</span></h2>
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">v1.0.4</p>
                    </motion.div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-8 space-y-2 overflow-hidden">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.label} href={item.href}>
                            <div className={`
                                relative flex items-center group px-3 py-3 rounded-2xl transition-all duration-300
                                ${isActive
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }
                            `}>
                                <div className="shrink-0 w-6 h-6 flex items-center justify-center">
                                    <Icon className="w-5 h-5 flex-shrink-0" />
                                </div>

                                <motion.span
                                    animate={{
                                        opacity: isShowingLabels ? 1 : 0,
                                        x: isShowingLabels ? 0 : -10,
                                        display: isShowingLabels ? 'block' : 'none'
                                    }}
                                    className="ml-4 font-bold text-sm whitespace-nowrap"
                                >
                                    {item.label}
                                </motion.span>

                                {isActive && isShowingLabels && (
                                    <motion.div
                                        layoutId="activeIndicator"
                                        className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full"
                                    />
                                )}
                            </div>
                        </Link>
                    );
                })}
            </nav>

            {/* User & Footer Section */}
            <div className="p-4 border-t border-white/5">
                <motion.div
                    animate={{ width: isShowingLabels ? '100%' : '56px' }}
                    className="bg-white/5 rounded-2xl p-2 flex items-center gap-3 overflow-hidden"
                >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-gray-400" />
                    </div>
                    <motion.div
                        animate={{ opacity: isShowingLabels ? 1 : 0 }}
                        className="whitespace-nowrap"
                    >
                        <p className="text-xs font-black text-gray-100 uppercase tracking-tighter truncate max-w-[120px]">
                            {user?.email?.split('@')[0] || 'User'}
                        </p>
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-none">
                            {role}
                        </p>
                    </motion.div>
                </motion.div>

                <button
                    onClick={handleLogout}
                    className="mt-4 flex items-center gap-4 px-4 py-3 w-full rounded-2xl text-gray-500 hover:bg-red-500/10 hover:text-red-500 transition-all duration-300 group overflow-hidden"
                >
                    <LogOut className="w-5 h-5 shrink-0" />
                    <motion.span
                        animate={{ opacity: isShowingLabels ? 1 : 0 }}
                        className="font-bold text-xs uppercase tracking-widest whitespace-nowrap"
                    >
                        Sign Out
                    </motion.span>
                </button>
            </div>
        </motion.div>
    );
}
