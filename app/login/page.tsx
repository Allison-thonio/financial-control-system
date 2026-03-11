'use client';

import React from "react"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading, refreshAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !authLoading) {
      const redirectUrl = user.role === 'manager' ? '/manager' : '/staff';
      router.push(redirectUrl);
    }
  }, [user, authLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Check Internal Corporate Accounts First
      const { validateDemoCredentials, INTERNAL_ACCOUNTS } = await import('@/lib/demoAuth');
      const { valid, role } = validateDemoCredentials(email, password);

      if (valid && role) {
        const account = INTERNAL_ACCOUNTS.find(a => a.email === email && a.password === password);
        sessionStorage.setItem('internalAuth', JSON.stringify({ 
          email, 
          role, 
          name: account?.name || 'Internal User',
          timestamp: Date.now() 
        }));
        
        refreshAuth();
        return; // Redirect handled by useEffect
      }

      // 2. Fallback to Firebase for Real Users
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error('[Auth] Login failed:', err);
      setError('Invalid credentials or connection error.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-600/20 mb-6">
            <span className="font-black text-xl italic">FC</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
            Welcome <span className="text-blue-600 italic">Back.</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Financial Control System</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-10 border border-slate-100">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Corporate Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                disabled={loading}
                className="w-full bg-slate-50 border-none rounded-2xl p-5 font-bold text-slate-900 focus:ring-4 focus:ring-blue-600/10 transition-all outline-none"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Security Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className="w-full bg-slate-50 border-none rounded-2xl p-5 font-bold text-slate-900 focus:ring-4 focus:ring-blue-600/10 transition-all outline-none"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center shadow-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-black text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-900/10 hover:shadow-slate-900/30 transition-all active:scale-[0.98]"
            >
              {loading ? 'Authenticating...' : 'Establish Secure Connection'}
            </button>
          </form>
        </div>

        <p className="text-center mt-10 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
          Powered by Financial Control System © 2024
        </p>
      </div>
    </div>
  );
}
