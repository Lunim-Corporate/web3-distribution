'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

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
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  // Dashboard section links (previously in sidebar)


  const isOnDashboard = pathname.startsWith('/dashboard');

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
                  Moonstone
                </span>
                <span className="text-[9px] uppercase tracking-[0.25em] text-gray-400 dark:text-gray-500 font-semibold mt-0.5">
                  Creative Platform
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
                  <button className="relative p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                    </svg>
                    <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-gray-950" />
                  </button>

                  {/* Divider */}
                  <div className="w-px h-6 bg-gray-200 dark:bg-gray-800 mx-1" />

                  {/* User profile */}
                  <div className="relative" ref={profileRef}>
                    <button
                      onClick={() => setProfileOpen(!profileOpen)}
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
