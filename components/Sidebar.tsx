'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    History,
    FileText,
    LogOut,
    Settings,
    ChevronRight
} from 'lucide-react';

interface SidebarProps {
    role: 'manager' | 'staff';
}

export function Sidebar({ role }: SidebarProps) {
    const pathname = usePathname();

    const navItems = [
        {
            label: 'Dashboard',
            href: `/${role}`,
            icon: LayoutDashboard,
        },
        {
            label: 'Loan Applications',
            href: role === 'manager' ? '/manager' : '/staff',
            icon: FileText,
        },
        {
            label: 'Loan History',
            href: '/loans',
            icon: History,
        },
    ];

    const handleLogout = () => {
        sessionStorage.removeItem('loanAppAuth');
        window.location.href = '/login';
    };

    return (
        <div className="w-64 bg-sidebar border-r border-sidebar-border h-screen flex flex-col fixed left-0 top-0 z-50">
            <div className="p-6">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                        <FileText className="text-primary-foreground w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-sidebar-primary leading-tight">LoanSwift</h2>
                        <p className="text-[10px] text-sidebar-accent-foreground font-bold uppercase tracking-widest">{role} Portal</p>
                    </div>
                </div>

                <nav className="space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link key={item.label} href={item.href}>
                                <div className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                                    }`}>
                                    <div className="flex items-center gap-3">
                                        <Icon className={`w-5 h-5 ${isActive ? 'text-primary-foreground' : 'text-sidebar-accent-foreground group-hover:text-sidebar-primary'}`} />
                                        <span className="font-semibold text-sm">{item.label}</span>
                                    </div>
                                    {isActive && <ChevronRight className="w-4 h-4 opacity-50" />}
                                </div>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="mt-auto p-6 border-t border-sidebar-border">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sidebar-foreground hover:bg-red-50 hover:text-red-600 transition-all duration-200 group"
                >
                    <LogOut className="w-5 h-5 text-sidebar-accent-foreground group-hover:text-red-600" />
                    <span className="font-semibold text-sm">Logout</span>
                </button>
            </div>
        </div>
    );
}
