'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function SignupPage() {
  const { login, isAuthHydrated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthHydrated && user) {
      router.push('/dashboard');
    }
  }, [isAuthHydrated, user, router]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#020617] py-16 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white dark:bg-slate-900/40 backdrop-blur-2xl border border-gray-200 dark:border-slate-700/50 rounded-3xl p-8 sm:p-10 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-2xl shadow-blue-500/50 mb-6">
              <span className="text-2xl text-white">💎</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Create Account</h1>
            <p className="text-gray-600 dark:text-slate-400 text-sm">Join the LUNIM Creative Rights Tracker</p>
          </div>
          
          <div className="space-y-6">
            <button
              onClick={() => login()}
              className="w-full relative overflow-hidden group bg-slate-100 hover:bg-white text-slate-900 font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-100/0 via-blue-100/30 to-blue-100/0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              <span className="relative z-10 flex items-center justify-center gap-2">
                Continue with Email or Google
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </span>
            </button>
            
            <div className="text-center pt-4 border-t border-gray-200 dark:border-slate-700/50">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Already have an account?
              </p>
              <button
                onClick={() => router.push('/login')}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                Sign in here
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


