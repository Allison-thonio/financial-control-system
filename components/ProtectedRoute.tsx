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
  const { user, loading, isDemoMode } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [demoUser, setDemoUser] = useState<any>(null);

  useEffect(() => {
    // In demo mode, check for stored auth in session
    if (isDemoMode && loading === false) {
      const storedAuth = getDemoAuth();
      
      if (storedAuth && storedAuth.role) {
        // User is authenticated in demo mode, create mock user object
        setDemoUser({
          uid: `demo-${storedAuth.role}`,
          email: storedAuth.email,
          role: storedAuth.role,
          demoMode: true,
        });
      } else if (!pathname.includes('/login')) {
        // Not authenticated and not on login page, redirect to login
        router.push('/login');
      }
    }
  }, [isDemoMode, loading, pathname, router]);

  useEffect(() => {
    const currentUser = user || demoUser;
    if (!loading && !currentUser && !pathname.includes('/login')) {
      router.push('/login');
    } else if (!loading && currentUser && requiredRole && currentUser.role !== requiredRole && currentUser.role !== 'admin') {
      router.push(currentUser.role === 'manager' ? '/manager' : '/staff');
    }
  }, [user, demoUser, loading, router, requiredRole, pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Spinner />
      </div>
    );
  }

  const currentUser = user || demoUser;
  if (!currentUser) {
    return null;
  }

  return <>{children}</>;
}
