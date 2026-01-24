'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Spinner } from '@/components/ui/spinner';

export default function Home() {
  const { user, loading, isDemoMode } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // In demo mode, redirect to login which will show demo options
      if (isDemoMode) {
        router.push('/login');
        return;
      }
      
      if (!user) {
        router.push('/login');
      } else if (user.role === 'manager' || user.role === 'admin') {
        router.push('/manager');
      } else {
        router.push('/staff');
      }
    }
  }, [user, loading, isDemoMode, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Spinner />
    </div>
  );
}
