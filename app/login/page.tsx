'use client';

import React from "react"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { validateDemoCredentials } from '@/lib/demoAuth';

const DEMO_CREDENTIALS = {
  staff: {
    email: 'thinkerricker@gmail.com',
    password: 'ggsnigga',
  },
  manager: {
    email: 'allisonfezyy@gmail.com',
    password: 'ggs',
  },
};

export default function LoginPage() {
  const [email, setEmail] = useState('thinkerricker@gmail.com');
  const [password, setPassword] = useState('ggsnigga');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Demo authentication logic
      const { valid, role } = validateDemoCredentials(email, password);

      if (valid && role) {
        // Store auth using both keys for maximum compatibility
        const authData = { email, role, timestamp: Date.now() };
        sessionStorage.setItem('loanAppAuth', JSON.stringify(authData));
        sessionStorage.setItem('demoAuth', JSON.stringify(authData));

        // Short delay for better UX
        await new Promise((resolve) => setTimeout(resolve, 500));

        const redirectUrl = role === 'manager' ? '/manager' : '/staff';
        router.push(redirectUrl);
      } else {
        setError('Invalid email or password');
        setLoading(false);
      }
    } catch (err) {
      setError('An unexpected error occurred');
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
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => { setEmail('allisonfezyy@gmail.com'); setPassword('ggs'); }}
                className="flex-1 text-[10px] py-1 bg-blue-50 text-blue-600 rounded border border-blue-100 hover:bg-blue-100 font-bold"
              >
                Manager Auto-fill
              </button>
              <button
                type="button"
                onClick={() => { setEmail('thinkerricker@gmail.com'); setPassword('ggsnigga'); }}
                className="flex-1 text-[10px] py-1 bg-green-50 text-green-600 rounded border border-green-100 hover:bg-green-100 font-bold"
              >
                Staff Auto-fill
              </button>
            </div>
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
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
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

          {/* Info Section */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-gray-600 text-xs text-center">Demo Mode - Use credentials below</p>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-xs text-green-800 font-semibold mb-3">Demo Credentials:</p>
          <div className="text-xs text-green-700 space-y-3">
            <div>
              <p className="font-semibold">Staff Account:</p>
              <p className="font-mono text-green-600">thinkerricker@gmail.com</p>
              <p className="font-mono text-green-600">ggsnigga</p>
            </div>
            <div>
              <p className="font-semibold">Manager Account:</p>
              <p className="font-mono text-green-600">allisonfezyy@gmail.com</p>
              <p className="font-mono text-green-600">ggs</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
