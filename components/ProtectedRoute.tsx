'use client';

import React from "react"

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { getDemoAuth } from '@/lib/demoAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'staff' | 'manager' | 'admin';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user && !pathname.includes('/login')) {
        router.push('/login');
      } else if (user && requiredRole && user.role !== requiredRole && user.role !== 'admin') {
        router.push(user.role === 'manager' ? '/manager' : '/staff');
      }
    }
  }, [user, loading, router, requiredRole, pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Spinner />
      </div>
    );
  }

  if (!user && !pathname.includes('/login')) {
    return null;
  }

  return <>{children}</>;
}
