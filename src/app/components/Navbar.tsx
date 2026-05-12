'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useRevenueSplitter } from '@/lib/web3';
import { truncateAddress } from '@/lib/utils';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { smartAccountAddress, isInitializing } = useRevenueSplitter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const walletRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('dismissed_notifications');
    if (saved) setDismissedIds(JSON.parse(saved));
  }, []);

  useEffect(() => {
    setIsDemoMode(localStorage.getItem('demo_mode') === 'true');
    const onDemoChanged = (e: any) => setIsDemoMode(e.detail);
    window.addEventListener('demo-mode-changed', onDemoChanged);
    return () => window.removeEventListener('demo-mode-changed', onDemoChanged);
  }, []);

  const toggleDemoMode = (e: React.MouseEvent) => {
    e.preventDefault();
    const nextState = !isDemoMode;
    localStorage.setItem('demo_mode', String(nextState));
    window.dispatchEvent(new CustomEvent('demo-mode-changed', { detail: nextState }));
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
      if (walletRef.current && !walletRef.current.contains(e.target as Node)) {
        setWalletOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchNotifications = React.useCallback(async () => {
    if (!user) return;
    try {
      const isDemoModeStr = localStorage.getItem('demo_mode') === 'true';
      const res = await fetch(`/api/revenue?demo=${isDemoModeStr}&ts=${Date.now()}`);
      let data = [];
      if (res.ok) {
        data = await res.json();
      }

      // Filter out dismissed
      const savedDismissed = JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
      let filtered = data.filter((n: any) => !savedDismissed.includes(n.id));

      // Pad with mock if < 5
      if (filtered.length < 5) {
        const mocks = [
          { id: 'mock-1', project_name: 'Neon Requiem', amount: '0.1', date: new Date().toISOString() },
          { id: 'mock-2', project_name: 'The Salt Coast', amount: '2.0', date: new Date(Date.now() - 3600000).toISOString() },
          { id: 'mock-3', project_name: 'Glass Republic', amount: '1.0', date: new Date(Date.now() - 7200000).toISOString() },
          { id: 'mock-4', project_name: 'Dust & Dynasty', amount: '1.5', date: new Date(Date.now() - 10800000).toISOString() },
          { id: 'mock-5', project_name: 'Binary Fault', amount: '0.5', date: new Date(Date.now() - 14400000).toISOString() },
        ];
        for (const m of mocks) {
          if (filtered.length >= 5) break;
          if (!savedDismissed.includes(m.id) && !filtered.find((fn: any) => fn.id === m.id)) {
            filtered.push(m);
          }
        }
      }

      setNotifications(filtered.slice(0, 10));
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  const dismissNotification = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    localStorage.setItem('dismissed_notifications', JSON.stringify(updated));
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  useEffect(() => {
    fetchNotifications();
    window.addEventListener('payment-recorded', fetchNotifications);
    return () => window.removeEventListener('payment-recorded', fetchNotifications);
  }, [fetchNotifications, isDemoMode]);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
    setNotificationsOpen(false);
    setWalletOpen(false);
  }, [pathname]);

  // Dashboard section links (previously in sidebar)


  const isOnDashboard = pathname.startsWith('/dashboard');

  const WALLETS = []; // Deprecated manual list

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  if (pathname === '/' || pathname === '/login' || pathname === '/signup') return null;

  return (
    <>
      {/* Primary Top Bar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-white/70 dark:bg-gray-950/70 backdrop-blur-2xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_20px_60px_-15px_rgba(0,0,0,0.1)] border-b border-white/20 dark:border-gray-800/50'
            : 'bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[60px]">

            {/* Logo */}
            <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-3 group shrink-0">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-600/25 group-hover:shadow-blue-600/40 transition-all duration-300 group-hover:scale-105">
                  <span className="text-white font-black text-sm tracking-tight">M</span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white dark:border-gray-950" title="Online" />
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-[15px] font-extrabold tracking-tight text-gray-900 dark:text-white leading-none">
                  LUNIM
                </span>
                <span className="text-[9px] uppercase tracking-[0.25em] text-gray-400 dark:text-gray-500 font-semibold mt-0.5">
                  Revenue and Rights Dashboard
                </span>
              </div>
            </Link>

            {/* If NOT on dashboard, show a simple label */}
            {!isOnDashboard && (
              <div className="hidden lg:flex items-center gap-6">
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Dashboard
                </Link>
              </div>
            )}

            {/* Right side */}
            <div className="hidden md:flex items-center gap-2">
              {user ? (
                <>
                  {/* Live / Demo Toggle */}
                  <div className="flex items-center gap-2 px-1.5 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <button
                      onClick={!isDemoMode ? undefined : toggleDemoMode}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all duration-300 ${
                        !isDemoMode
                          ? 'bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 text-white shadow-md shadow-blue-600/25'
                          : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                      }`}
                    >
                      Live
                    </button>
                    <button
                      onClick={isDemoMode ? undefined : toggleDemoMode}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all duration-300 ${
                        isDemoMode
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/25'
                          : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                      }`}
                    >
                      Demo
                    </button>
                  </div>


                  {/* Quick action */}
                  <Link
                    href="/dashboard"
                    className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                    title="Dashboard"
                  >
                    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                    </svg>
                  </Link>

                  {/* Notifications */}
                  <div className="relative" ref={notifRef}>
                    <button 
                      onClick={() => { setNotificationsOpen(!notificationsOpen); setProfileOpen(false); }}
                      className="relative p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                    >
                      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                      </svg>
                      {notifications.length > 0 && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-gray-950" />
                      )}
                    </button>

                    {/* Notifications Dropdown */}
                    {notificationsOpen && (
                      <div
                        className="absolute right-0 mt-2 w-80 rounded-2xl shadow-2xl shadow-black/10 border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden z-50"
                        style={{ animation: 'dropdownFadeIn 0.2s ease-out' }}
                      >
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Recent Transactions</h3>
                          {notifications.length > 0 && (
                            <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-full">{notifications.length} New</span>
                          )}
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {notifications.length > 0 ? (
                            notifications.map((notif, idx) => (
                              <div key={notif.id || idx} className="p-4 border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group relative">
                                <button 
                                  onClick={(e) => dismissNotification(e, notif.id)}
                                  className="absolute top-4 right-4 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all z-10"
                                  title="Dismiss"
                                >
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                                <div className="flex items-start gap-3">
                                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
                                    <span className="text-emerald-600 dark:text-emerald-400 text-sm">💰</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                      {notif.projectName || notif.project_name}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate mt-0.5">
                                      Distributed: {notif.amount} ETH
                                    </p>
                                    <p className="text-[10px] text-gray-400 mt-1">
                                      {new Date(notif.date).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-6 text-center text-gray-500">
                              <p className="text-sm">No recent transactions</p>
                            </div>
                          )}
                        </div>
                        <div className="p-2 border-t border-gray-100 dark:border-gray-800 text-center">
                          <Link href="/dashboard?tab=revenue&project=all" className="text-xs font-bold text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" onClick={() => setNotificationsOpen(false)}>
                            View All Activity
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Connect Wallet Dropdown */}
                  <div className="relative" ref={walletRef}>
                    <button
                      onClick={() => { setWalletOpen(!walletOpen); setNotificationsOpen(false); setProfileOpen(false); }}
                      className="relative flex items-center gap-2 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                      title={smartAccountAddress ? `Smart Account: ${smartAccountAddress}` : 'Smart Account'}
                    >
                      {smartAccountAddress ? (
                        <>
                          <div className="relative w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-sm">
                            <span className="text-white text-[10px] font-bold">AA</span>
                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white dark:border-gray-950" />
                          </div>
                          <span className="hidden xl:block text-xs font-mono text-gray-600 dark:text-gray-300">
                            {truncateAddress(smartAccountAddress)}
                          </span>
                        </>
                      ) : (
                        <div className="relative">
                          <svg className="w-[18px] h-[18px] text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 013 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 013 6v3" />
                          </svg>
                          {isInitializing && <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />}
                        </div>
                      )}
                    </button>

                    {/* Wallet Dropdown */}
                    {walletOpen && (
                      <div
                        className="absolute right-0 mt-2 w-80 rounded-2xl shadow-2xl shadow-black/10 border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden z-50"
                        style={{ animation: 'dropdownFadeIn 0.2s ease-out' }}
                      >
                        {smartAccountAddress ? (
                          <>
                            {/* Smart Account Info */}
                            <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
                                  <span className="text-white font-black text-xs">AA</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-gray-900 dark:text-white">Smart Account (ERC-4337)</p>
                                  <p className="text-[10px] font-mono text-gray-500 dark:text-gray-400 truncate">
                                    {smartAccountAddress}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="p-3 bg-emerald-500/5 dark:bg-emerald-500/10 border-b border-gray-100 dark:border-gray-800">
                              <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest text-center">Zero-Gas Transactions Active</p>
                            </div>
                            <div className="p-2">
                              <Link
                                href="/profile"
                                onClick={() => setWalletOpen(false)}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors w-full"
                              >
                                <span className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center">⛓️</span>
                                Wallet Details
                              </Link>
                            </div>
                          </>
                        ) : (
                          <div className="p-8 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4 animate-pulse">
                              <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </div>
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Smart Account Initializing</h3>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 max-w-[200px] mx-auto">
                              We're setting up your zero-gas infrastructure. Please wait a moment.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="w-px h-6 bg-gray-200 dark:bg-gray-800 mx-1" />

                  {/* User profile */}
                  <div className="relative" ref={profileRef}>
                    <button
                      onClick={() => { setProfileOpen(!profileOpen); setNotificationsOpen(false); }}
                      className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-900 transition-all duration-200 group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 via-blue-500 to-cyan-400 flex items-center justify-center text-white text-xs font-bold shadow-sm group-hover:shadow-md transition-shadow">
                        {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="text-left hidden xl:block">
                        <p className="text-[13px] font-semibold text-gray-800 dark:text-gray-100 leading-none">
                          {user.name || 'User'}
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-none mt-0.5 capitalize">
                          {user.role}
                        </p>
                      </div>
                      <svg
                        className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-300 ${profileOpen ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Profile Dropdown */}
                    {profileOpen && (
                      <div
                        className="absolute right-0 mt-2 w-64 rounded-2xl shadow-2xl shadow-black/10 border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden"
                        style={{ animation: 'dropdownFadeIn 0.2s ease-out' }}
                      >
                        <div className="p-4 bg-gradient-to-br from-violet-50 via-blue-50 to-cyan-50 dark:from-violet-950/30 dark:via-blue-950/30 dark:to-cyan-950/30">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 via-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold shadow-md">
                              {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900 dark:text-white">{user.name || 'User'}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[160px]">{user.email}</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-2">
                          <Link
                            href="/profile"
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors"
                          >
                            <span className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm">👤</span>
                            Profile & Settings
                          </Link>
                          <Link
                            href="/dashboard"
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors"
                          >
                            <span className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm">📊</span>
                            Dashboard
                          </Link>
                          {user.role === 'admin' && (
                            <Link
                              href="/admin"
                              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors"
                            >
                              <span className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm">⚙️</span>
                              Admin Panel
                            </Link>
                          )}
                        </div>
                        <div className="p-2 border-t border-gray-100 dark:border-gray-800">
                          <button
                            onClick={() => void logout()}
                            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                          >
                            <span className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-sm">🚪</span>
                            Sign Out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/signup"
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 rounded-xl shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 hover:brightness-110 transition-all duration-300"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden ${
            mobileOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-4 pb-5 pt-2 space-y-1 border-t border-gray-100 dark:border-gray-800">
            {/* Always show Dashboard link on mobile */}
            <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
              <span>📊</span> Dashboard
            </Link>
            {/* Mobile wallet providers */}
            <div className="space-y-0.5">
              <p className="px-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Connect Wallet</p>
              {WALLETS.map((w) => (
                <button key={w.name} onClick={() => { setMobileOpen(false); void connectInjectedWallet(w.name, w.domain); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                  <div className="w-6 h-6 rounded bg-white flex items-center justify-center p-0.5">
                    <img src={`https://www.google.com/s2/favicons?domain=${w.domain}&sz=64`} alt={w.name} className="w-full h-full object-contain" /> 
                  </div>
                  {w.name}
                  <svg className="w-3.5 h-3.5 ml-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                </button>
              ))}
            </div>

            {/* User section */}
            <div className="border-t border-gray-100 dark:border-gray-800 mt-3 pt-3">
              {user ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-3 px-4 py-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 via-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold shadow-sm">
                      {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{user.name || 'User'}</p>
                      <p className="text-[11px] text-gray-400 capitalize">{user.role}</p>
                    </div>
                  </div>
                  <Link href="/profile" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <span>👤</span> Profile
                  </Link>
                  {user.role === 'admin' && (
                    <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <span>⚙️</span> Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={() => void logout()}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                  >
                    <span>🚪</span> Sign Out
                  </button>
                </div>
              ) : (
                <div className="space-y-2 px-1">
                  <Link href="/login" className="block px-4 py-3 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    Log In
                  </Link>
                  <Link href="/signup" className="block px-4 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 text-center shadow-lg transition-all">
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* CSS for dropdown animation */}
      <style jsx global>{`
        @keyframes dropdownFadeIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
};

export default Navbar;
