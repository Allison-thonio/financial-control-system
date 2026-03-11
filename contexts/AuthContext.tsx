'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { auth, db } from '@/lib/firebase';
import { User as FirebaseUser, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export type UserRole = 'staff' | 'manager' | 'admin';

export interface User extends FirebaseUser {
  role?: UserRole;
  demoMode?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshAuth: () => void;
  isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkInternalAuth = useCallback(() => {
    if (typeof window === 'undefined') return false;
    const authStr = sessionStorage.getItem('internalAuth');
    if (authStr) {
      try {
        const authData = JSON.parse(authStr);
        setUser({
          uid: `internal-${authData.role}`,
          email: authData.email,
          role: authData.role,
          displayName: authData.name,
          demoMode: true,
        } as any);
        setLoading(false);
        return true;
      } catch (err) {
        console.error('[Auth] Failed to parse internal session:', err);
      }
    }
    return false;
  }, []);

  useEffect(() => {
    console.log('[Auth] Initializing Auth listener');

    // Immediate check for internal session
    if (checkInternalAuth()) {
        console.log('[Auth] Internal session detected');
        return; 
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({ 
              ...firebaseUser, 
              role: userData.role || 'staff',
              displayName: userData.name || firebaseUser.displayName 
            } as User);
          } else {
            setUser({ ...firebaseUser, role: 'staff' } as User);
          }
        } catch (error) {
          console.error('[Auth] Error fetching user role:', error);
          setUser({ ...firebaseUser, role: 'staff' } as User);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [checkInternalAuth]);

  const logout = async () => {
    try {
      sessionStorage.removeItem('internalAuth');
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('[Auth] Error logging out:', error);
      throw error;
    }
  };

  const refreshAuth = () => {
    checkInternalAuth();
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshAuth, isDemoMode: false }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
