'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const { login, isAuthHydrated, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthHydrated && user) {
      window.location.href = '/dashboard';
    }
  }, [isAuthHydrated, user]);

  const handleLogin = async () => {
    setError('');
    if (!email.trim() || !email.includes('@')) { setError('Please enter a valid email address.'); return; }
    if (!password.trim()) { setError('Please enter your password.'); return; }

    setIsLoading(true);
    try {
      await login(email, password);
      window.location.href = '/dashboard';
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Login failed. Please check your credentials.';
      setError(msg);
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) handleLogin();
  };

  return (
    <div className="min-h-screen bg-[#020617] flex font-sans selection:bg-blue-500/30">
      
      {/* ── LEFT SIDE: Cinematic Branding ── */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between overflow-hidden">
        {/* Animated Gradient Mesh */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[#020617] z-10" />
          <motion.div 
            animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute -top-[30%] -left-[10%] w-[80%] h-[80%] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen"
          />
          <motion.div 
            animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute top-[20%] -right-[20%] w-[90%] h-[90%] bg-cyan-600/10 rounded-full blur-[140px] mix-blend-screen"
          />
          <motion.div 
            animate={{ scale: [1.2, 1, 1.2], y: [0, -50, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-[20%] left-[20%] w-[60%] h-[60%] bg-sky-500/10 rounded-full blur-[100px] mix-blend-screen"
          />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 z-20 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-[#020617] z-30" />
        </div>

        {/* Branding Content */}
        <div className="relative z-40 p-12 mt-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-2xl shadow-blue-500/50 mb-6">
              <span className="text-2xl text-white">💎</span>
            </div>
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-100 to-blue-200 tracking-tight leading-tight">
              Creative Rights <br />
              & Revenue Platform
            </h1>
            <p className="mt-6 text-xl text-slate-300 max-w-md leading-relaxed font-light">
              The industry standard for <strong className="text-white font-medium">HBO</strong> smart-contract royalty distribution. Fully synced, infinitely transparent.
            </p>
          </motion.div>
        </div>

        <div className="relative z-40 p-12">
          <div className="flex border-l-2 border-blue-500/30 pl-4 py-1">
            <div>
              <p className="text-sm font-bold text-white tracking-widest uppercase mb-1">LUNIM Network</p>
              <p className="text-xs text-blue-400 font-mono">v2.4.0 • Live Sync Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT SIDE: Sign In ── */}
      <div className="w-full lg:w-1/2 relative flex items-center justify-center p-6 sm:p-12 z-10 backdrop-blur-3xl bg-[#020617]/80 lg:bg-transparent">
        {/* Mobile Background Elements */}
        <div className="lg:hidden absolute inset-0 overflow-hidden z-0">
          <div className="absolute top-0 right-0 w-full h-full bg-blue-900/10 blur-[100px]" />
        </div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex flex-col items-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-2xl shadow-blue-500/50 mb-4">
              <span className="text-2xl text-white">💎</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">LUNIM</h1>
          </div>

          <div className="bg-slate-900/40 backdrop-blur-2xl border border-slate-700/50 rounded-3xl p-8 sm:p-10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Welcome Back</h2>
            <p className="text-sm text-slate-400 mb-8">Sign in to access your platform dashboard.</p>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                  placeholder="youremail@gmail.com"
                  className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3.5 text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3.5 text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:opacity-50"
                />
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-xl px-4 py-3.5">
                  {error}
                </motion.div>
              )}

              <button
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full relative overflow-hidden group bg-slate-100 hover:bg-white text-slate-900 font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-100/0 via-blue-100/30 to-blue-100/0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                {isLoading ? (
                  <span className="flex items-center justify-center gap-3 relative z-10">
                    <svg className="w-5 h-5 animate-spin text-slate-900" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Authenticating
                  </span>
                ) : (
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Access Dashboard
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                  </span>
                )}
              </button>
            </div>



          </div>

          <p className="text-center text-[10px] text-slate-600 mt-8 font-mono tracking-wide uppercase">
            Unauthorized access prohibited
          </p>
        </motion.div>
      </div>
    </div>
  );
}
