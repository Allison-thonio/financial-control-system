'use client';

import { useEffect, useState } from 'react';

export interface AuthUser {
  email: string;
  role: 'staff' | 'manager';
}

export function useSimpleAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated in session storage
    const authStr = sessionStorage.getItem('loanAppAuth');
    if (authStr) {
      try {
        const auth = JSON.parse(authStr) as AuthUser;
        setUser(auth);
      } catch (err) {
        console.error('[v0] Failed to parse auth:', err);
      }
    }
    setLoading(false);
  }, []);

  return { user, loading };
}
