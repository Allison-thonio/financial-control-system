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
      const { valid, role, name, isUnofficial } = validateDemoCredentials(email.trim(), password.trim());

      if (valid && role) {
        sessionStorage.setItem('internalAuth', JSON.stringify({ 
          email: email.trim(), 
          role, 
          name: name || 'Internal User',
          isUnofficial: !!isUnofficial,
          timestamp: Date.now() 
        }));
        
        refreshAuth();
        return;
      }

      // 2. Fallback to Firebase
      await signInWithEmailAndPassword(auth, email.trim(), password.trim());
    } catch (err: any) {
      console.error('[Auth] Login failed:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password. Please try again.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection.');
      } else {
        setError(err.message || 'An unexpected error occurred.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-green-600 to-emerald-600 mb-4">
            <span className="text-white font-bold text-lg">LM</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
            Loan Manager
          </h1>
          <p className="text-gray-600">Employee Loan Management System</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium text-center">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-2 rounded-lg transition shadow-md"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center mt-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Powered by Financial Control System © 2024
          </p>
        </div>
      </div>
    </div>
  );
}
