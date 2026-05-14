'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useWeb3Modal } from '@web3modal/ethers/react';
import { useEnsName } from '@/hooks/useEnsResolver';
import { useWallet } from '@/lib/wallet';

// Hardhat demo accounts for demo mode - USE PLACEHOLDERS FOR SECURITY
const HARDHAT_ACCOUNTS = [
  { address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', name: 'Account 1 (Admin)', privateKey: '0x...REPLACE_WITH_HARDHAT_PK_1' },
  { address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', name: 'Account 2 (Creator)', privateKey: '0x...REPLACE_WITH_HARDHAT_PK_2' },
  { address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', name: 'Account 3 (Contributor)', privateKey: '0x...REPLACE_WITH_HARDHAT_PK_3' },
  { address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906', name: 'Account 4 (Partner)', privateKey: '0x...REPLACE_WITH_HARDHAT_PK_4' },
  { address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', name: 'Account 5 (Investor)', privateKey: '0x...REPLACE_WITH_HARDHAT_PK_5' },
];

// Wallet options for live mode
const LIVE_WALLETS = [
  { id: 'metamask', name: 'MetaMask', icon: 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg' },
  { id: 'coinbase', name: 'Coinbase Wallet', icon: 'https://upload.wikimedia.org/wikipedia/commons/4/46/Coinbase_Wallet.svg' },
  { id: 'rainbow', name: 'Rainbow', icon: 'https://rainbow.me/rainbow.svg' },
  { id: 'trust', name: 'Trust Wallet', icon: 'https://assets.trustwallet.com/trust-logo.svg' },
  { id: 'phantom', name: 'Phantom', icon: 'https://phantom.app/favicon.svg' },
];

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const profileRef = useRef<HTMLDivElement>(null);
  const walletDropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const { open, close } = useWeb3Modal();

  useEffect(() => {
    const mode = isDemoMode ? 'demo' : 'live';
    fetch(`/api/dashboard/data?projectId=all&mode=${mode}`)
      .then(r => r.json())
      .then(d => {
        if (d.payments) {
          const sorted = d.payments.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          setRecentTransactions(sorted.slice(0, 5));
        }
      })
      .catch(e => console.error(e));
  }, [isDemoMode]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);
  useEffect(() => {
    setIsDemoMode(localStorage.getItem('demo_mode') === 'true');
    const onDemoChanged = () => setIsDemoMode(localStorage.getItem('demo_mode') === 'true');
    window.addEventListener('demo-mode-changed', onDemoChanged);
    return () => window.removeEventListener('demo-mode-changed', onDemoChanged);
  }, []);

  // Handle click outside wallet dropdown
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (walletDropdownRef.current && !walletDropdownRef.current.contains(e.target as Node)) {
        setWalletDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Unified wallet state via our bridge
  const { 
    account: walletAddress, 
    isConnected: walletConnected, 
    connectWallet, 
    switchNetwork,
    getNetworkName,
    chainId
  } = useWallet();
  
  const ensName = useEnsName(walletAddress ?? null);

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

  const isOnDashboard = pathname.startsWith('/dashboard');

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
                  <span className="text-white font-black text-sm tracking-tight">L</span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white dark:border-gray-950" title="Online" />
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-[15px] font-extrabold tracking-tight text-gray-900 dark:text-white leading-none">
                  LUNIM
                </span>
                <span className="text-[9px] uppercase tracking-[0.25em] text-gray-400 dark:text-gray-500 font-semibold mt-0.5">
                  Revenue & Rights
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
                  {/* LIVE / DEMO Toggle */}
                  <div className="flex items-center bg-gray-900/50 border border-white/10 rounded-full p-1 shadow-inner mr-2">
                    <button
                      onClick={() => {
                        localStorage.setItem('demo_mode', 'false');
                        window.dispatchEvent(new CustomEvent('demo-mode-changed'));
                      }}
                      className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase transition-all ${!isDemoMode ? 'bg-indigo-500 text-white shadow-lg' : 'bg-transparent text-gray-400 hover:text-white'}`}
                    >
                      Live
                    </button>
                    <button
                      onClick={() => {
                        localStorage.setItem('demo_mode', 'true');
                        window.dispatchEvent(new CustomEvent('demo-mode-changed'));
                      }}
                      className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase transition-all ${isDemoMode ? 'bg-amber-500 text-white shadow-lg' : 'bg-transparent text-gray-400 hover:text-white'}`}
                    >
                      Demo
                    </button>
                  </div>

                  {/* Dashboard / Apps Icon */}
                  <Link
                    href="/dashboard"
                    className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                    title="Dashboard"
                  >
                    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                    </svg>
                  </Link>

                  {/* Notifications */}
                  <div className="relative" ref={notificationRef}>
                    <button 
                      onClick={() => setNotificationsOpen(!notificationsOpen)}
                      className="relative p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all mr-2"
                    >
                      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                      </svg>
                      {recentTransactions.length > 0 && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-gray-950" />
                      )}
                    </button>

                    {notificationsOpen && (
                      <div className="absolute right-0 mt-2 w-80 rounded-2xl shadow-2xl shadow-black/20 border border-gray-700 bg-gray-900 overflow-hidden z-50" style={{ animation: 'dropdownFadeIn 0.2s ease-out' }}>
                        <div className="px-4 py-3 bg-gradient-to-r from-violet-600/20 to-cyan-600/20 border-b border-gray-700 flex justify-between items-center">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Recent Activity</p>
                          <button onClick={() => setRecentTransactions([])} className="text-[10px] text-rose-400 hover:text-rose-300 uppercase font-bold px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 transition-colors">Clear ✕</button>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                          {recentTransactions.length === 0 ? (
                            <div className="p-4 text-center text-sm text-gray-500">No recent transactions</div>
                          ) : (
                            recentTransactions.map((tx, i) => (
                              <div key={i} onClick={() => { setNotificationsOpen(false); window.location.href = '/dashboard?tab=revenue'; }} className="px-4 py-3 border-b border-gray-800 hover:bg-white/5 transition-colors cursor-pointer">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-[10px] font-bold text-emerald-400 uppercase">Payment Distributed</span>
                                  <span className="text-[10px] text-gray-500">{new Date(tx.created_at).toLocaleDateString()}</span>
                                </div>
                                <p className="text-xs text-gray-300">Amount: <span className="font-mono text-white">${(Number(tx.amount || 0) / 100).toFixed(2)}</span></p>
                                <p className="text-[9px] font-mono text-gray-500 truncate mt-1">Tx: {tx.tx_hash}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Wallet Icon Button with Dropdown */}
                  <div className="relative" ref={walletDropdownRef}>
                    <button
                      onClick={() => setWalletDropdownOpen(!walletDropdownOpen)}
                      className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                      title="Wallet"
                    >
                      {/* Wallet Icon SVG */}
                      <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H8.25a2.25 2.25 0 00-2.25 2.25c0 .696.306 1.344.82 1.808l6.408 5.233c.344.28.808.28 1.152 0l6.408-5.233c.514-.464.82-1.112.82-1.808a2.25 2.25 0 00-2.25-2.25H15M9 12h6m-6 3h6M9 6h6" />
                      </svg>
                      {/* Green dot when connected */}
                      {walletConnected && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-400 rounded-full border border-gray-900" />
                      )}
                    </button>

                    {/* Wallet Dropdown */}
                    {walletDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-72 rounded-2xl shadow-2xl shadow-black/20 border border-gray-700 bg-gray-900 overflow-hidden z-50" style={{ animation: 'dropdownFadeIn 0.2s ease-out' }}>
                        {/* Header */}
                        <div className="px-4 py-3 bg-gradient-to-r from-violet-600/20 to-cyan-600/20 border-b border-gray-700">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Select Wallet</p>
                          <p className="text-[10px] text-gray-500 mt-1">{isDemoMode ? 'Demo Mode - Hardhat Accounts' : 'Live Mode - Connect your wallet'}</p>
                        </div>

                        {/* Demo Mode - Hardhat Accounts */}
                        {isDemoMode ? (
                          <div className="p-2">
                            <p className="px-3 py-2 text-[10px] font-bold text-amber-400 uppercase">Hardhat Test Accounts</p>
                            {HARDHAT_ACCOUNTS.map((account) => (
                              <button
                                key={account.address}
                                onClick={() => {
                                  localStorage.setItem('demo_wallet', account.address);
                                  localStorage.setItem('demo_private_key', account.privateKey);
                                  window.dispatchEvent(new CustomEvent('wallet-changed', { detail: account.address }));
                                  setWalletDropdownOpen(false);
                                  if (!isOnDashboard) window.location.href = '/dashboard';
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                                  walletAddress === account.address
                                    ? 'bg-emerald-500/20 border border-emerald-500/30'
                                    : 'hover:bg-gray-800 border border-transparent'
                                }`}
                              >
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                                  {account.name.charAt(8)}
                                </div>
                                <div className="text-left">
                                  <p className="text-sm font-medium text-white">{account.name}</p>
                                  <p className="text-[10px] font-mono text-gray-400">{account.address.substring(0, 10)}...{account.address.substring(38)}</p>
                                </div>
                                {walletAddress === account.address && (
                                  <span className="ml-auto w-2 h-2 bg-emerald-400 rounded-full" />
                                )}
                              </button>
                            ))}
                          </div>
                        ) : (
                          /* Live Mode - Wallet Options */
                          <div className="p-2">
                            <p className="px-3 py-2 text-[10px] font-bold text-indigo-400 uppercase">Connect with</p>
                            {LIVE_WALLETS.map((wallet) => (
                              <button
                                key={wallet.id}
                                onClick={() => {
                                  open();
                                  setWalletDropdownOpen(false);
                                  if (!isOnDashboard) window.location.href = '/dashboard';
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-800 border border-transparent transition-all"
                              >
                                <img
                                  src={wallet.icon}
                                  alt={wallet.name}
                                  className="w-8 h-8 rounded-lg"
                                  onError={(e) => {
                                    // Fallback to first letter if image fails
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    target.nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                                <span className="hidden w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white">
                                  {wallet.name.charAt(0)}
                                </span>
                                <p className="text-sm font-medium text-white">{wallet.name}</p>
                              </button>
                            ))}

                            {/* Connect Wallet Button for Live Mode */}
                            <button
                              onClick={() => {
                                open();
                                setWalletDropdownOpen(false);
                                if (!isOnDashboard) window.location.href = '/dashboard';
                              }}
                              className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold hover:brightness-110 transition-all"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                              </svg>
                              Connect Wallet
                            </button>
                          </div>
                        )}

                        {/* Connected Wallet Info */}
                        {walletConnected && walletAddress && (
                          <div className="p-3 border-t border-gray-700 bg-gray-800/50">
                            <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Connected Wallet</p>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                              <p className="text-xs font-mono text-gray-300">{walletAddress.substring(0, 10)}...{walletAddress.substring(38)}</p>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1">{getNetworkName(chainId)}</p>
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

                        {walletConnected && walletAddress && (
                          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                            <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Connected Wallet</p>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                              <p className="text-xs font-mono text-gray-300 truncate">{walletAddress.substring(0, 10)}...{walletAddress.substring(38)}</p>
                            </div>
                            <button
                              onClick={() => {
                                // First clear local storage
                                localStorage.removeItem('demo_wallet');
                                localStorage.removeItem('demo_private_key');
                                // Call disconnectWallet hook
                                if (disconnectWallet) disconnectWallet();
                                // Close web3modal completely
                                close();
                                // Notify app to refresh wallet state
                                window.dispatchEvent(new CustomEvent('wallet-changed'));
                                setProfileOpen(false);
                              }}
                              className="text-xs text-rose-500 hover:text-rose-400 font-bold transition-colors"
                            >
                              Disconnect Wallet
                            </button>
                          </div>
                        )}
                        <div className="p-2">
                          <Link
                            href="/profile"
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors"
                          >
                            <span className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm">👤</span>
                            Profiles and Settings
                          </Link>
                          <Link
                            href="/dashboard"
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors"
                          >
                            <span className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm">📊</span>
                            Dashboards
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
