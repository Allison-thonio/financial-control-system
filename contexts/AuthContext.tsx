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
  const [isDemoMode, setIsDemoMode] = useState(false);

  const checkDemoAuth = useCallback(() => {
    if (typeof window === 'undefined') return false;

    const authStr = localStorage.getItem('demoAuth') || localStorage.getItem('loanAppAuth') ||
      sessionStorage.getItem('demoAuth') || sessionStorage.getItem('loanAppAuth');

    console.log('[Auth] Checking for session:', authStr ? 'Found' : 'Not found');

    if (authStr) {
      try {
        const authData = JSON.parse(authStr);
        if (authData && authData.role) {
          const newUser = {
            uid: `demo-${authData.role}`,
            email: authData.email,
            role: authData.role,
            demoMode: true,
          } as any;
          setUser(newUser);
          setLoading(false); // Ensure loading is false when user is set
          return true;
        }
      } catch (err) {
        console.error('[Auth] Failed to parse session:', err);
      }
    }
    return false;
  }, []);

  const refreshAuth = useCallback(() => {
    console.log('[Auth] refreshAuth called');
    if (!checkDemoAuth()) {
      setLoading(false); // If no demo auth found, still stop loading
    }
  }, [checkDemoAuth]);

  useEffect(() => {
    // Check if auth is properly initialized (null auth means demo mode)
    console.log('[v0] AuthProvider initializing - auth:', auth, 'db:', db);

    if (!auth || typeof auth !== 'object' || !('app' in auth)) {
      console.log('[v0] Demo mode activated - auth not available');
      setIsDemoMode(true);
      checkDemoAuth();
      setLoading(false);
      return;
    }

    try {
      console.log('[Auth] Setting up onAuthStateChanged listener');

      // Immediate check for existing demo session to avoid "loading" flash
      if (checkDemoAuth()) {
        console.log('[Auth] Found existing demo session, prioritizing over Firebase listener');
        setLoading(false);
      }

      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        console.log('[v0] onAuthStateChanged triggered:', firebaseUser?.email);
        if (firebaseUser) {
          try {
            if (db && typeof db === 'object' && 'type' in db) {
              const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
              const role = userDoc.exists() ? userDoc.data().role : 'staff';
              setUser({ ...firebaseUser, role } as User);
            } else {
              setUser(firebaseUser as User);
            }
          } catch (error) {
            console.error('[v0] Error fetching user role:', error);
            setUser(firebaseUser as User);
          }
        } else {
          // If no Firebase user, check for demo session as fallback
          checkDemoAuth();
        }
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('[v0] Firebase not properly initialized:', error);
      setIsDemoMode(true);
      checkDemoAuth();
      setLoading(false);
    }
  }, [checkDemoAuth]);

  const logout = async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('demoAuth');
        localStorage.removeItem('loanAppAuth');
        sessionStorage.removeItem('demoAuth');
        sessionStorage.removeItem('loanAppAuth');
      }

      if (isDemoMode) {
        setUser(null);
        return;
      }
      if (auth) {
        await signOut(auth);
      }
      setUser(null);
    } catch (error) {
      console.error('[Auth] Error logging out:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshAuth, isDemoMode }}>
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
