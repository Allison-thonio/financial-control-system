'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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
  isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    // Check if auth is properly initialized (null auth means demo mode)
    console.log('[v0] AuthProvider initializing - auth:', auth, 'db:', db);
    
    if (!auth || typeof auth !== 'object' || !('app' in auth)) {
      console.log('[v0] Demo mode activated - auth not available');
      setIsDemoMode(true);
      setLoading(false);
      return;
    }

    try {
      console.log('[v0] Setting up onAuthStateChanged listener');
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
          setUser(null);
        }
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('[v0] Firebase not properly initialized:', error);
      setIsDemoMode(true);
      setLoading(false);
    }
  }, []);

  const logout = async () => {
    try {
      if (isDemoMode) {
        setUser(null);
        return;
      }
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('[Auth] Error logging out:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, isDemoMode }}>
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
