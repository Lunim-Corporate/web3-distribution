'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useRevenueSplitter } from '@/lib/web3';
import { ADMIN_LIVE_ADDRESS } from '@/lib/web3/config';
import { truncateAddress } from '@/lib/utils';
import { useWallets } from '@privy-io/react-auth';

// Seeded local Hardhat accounts for Demo Mode
export const DEMO_ACCOUNTS = [
  {
    name: 'Demo Admin Account',
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    role: 'Admin',
    balance: '100.00'
  },
  {
    name: 'Demo Creator Account',
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    role: 'Creator',
    balance: '50.00'
  },
  {
    name: 'Demo Contributor Account',
    address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    role: 'Contributor',
    balance: '25.00'
  }
];

// Aesthetic wallet SVG icons
export const MetaMaskIcon = () => (
  <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21.2 10.45L18.4 3.75C18.25 3.35 17.85 3.1 17.4 3.15L12 3.8L6.6 3.15C6.15 3.1 5.75 3.35 5.6 3.75L2.8 10.45C2.65 10.85 2.8 11.3 3.15 11.55L12 17.8L20.85 11.55C21.2 11.3 21.35 10.85 21.2 10.45Z" fill="#E2761B" />
    <path d="M12 17.8L7 11.5L12 13.8L17 11.5L12 17.8Z" fill="#E4761B" />
    <path d="M12 3.8V13.8" stroke="#111" strokeWidth="0.5" opacity="0.3" />
  </svg>
);

export const CoinbaseIcon = () => (
  <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="12" fill="#0052FF"/>
    <rect x="6" y="6" width="12" height="12" rx="2.5" fill="white"/>
  </svg>
);

export const WalletIcon = () => (
  <svg className="w-[18px] h-[18px] text-gray-400 dark:text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 013 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 013 6v3" />
  </svg>
);

export const Navbar: React.FC = () => {
  const { user, logout, linkWallet, connectUserWallet, disconnectUserWallet } = useAuth();
  const { smartAccountAddress } = useRevenueSplitter();
  const { wallets } = useWallets();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [demoAccount, setDemoAccount] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(text);
    setTimeout(() => setCopiedAddress(null), 1500);
  };

  const getWalletDetails = () => {
    if (isDemoMode) {
      if (demoAccount) {
        const matchingDemo = DEMO_ACCOUNTS.find(
          acc => acc.address.toLowerCase() === demoAccount.toLowerCase()
        );
        return {
          address: demoAccount,
          name: matchingDemo ? matchingDemo.name : 'Demo Wallet',
          role: matchingDemo ? matchingDemo.role : 'Guest',
          iconType: 'metamask' as const,
        };
      }
      return null;
    } else {
      // LIVE MODE: Show user's actual connected wallet
      // Admin sees ADMIN_LIVE_ADDRESS, regular users see their own wallet
      const externalWallet = wallets.find(w => w.walletClientType !== 'privy');
      const embeddedWallet = wallets.find(w => w.walletClientType === 'privy');
      const isAdmin = user?.role === 'admin';
      
      if (isAdmin && ADMIN_LIVE_ADDRESS) {
        let iconType: 'metamask' | 'coinbase' | 'generic' = 'generic';
        if (externalWallet?.walletClientType?.toLowerCase().includes('metamask')) {
          iconType = 'metamask';
        } else if (externalWallet?.walletClientType?.toLowerCase().includes('coinbase')) {
          iconType = 'coinbase';
        }
        return {
          address: ADMIN_LIVE_ADDRESS,
          name: 'Live Admin',
          role: 'Admin',
          iconType,
          walletObj: externalWallet || null
        };
      }
      
      // Regular user: show their connected wallet
      if (externalWallet) {
        let iconType: 'metamask' | 'coinbase' | 'generic' = 'generic';
        if (externalWallet.walletClientType?.toLowerCase().includes('metamask')) {
          iconType = 'metamask';
        } else if (externalWallet.walletClientType?.toLowerCase().includes('coinbase')) {
          iconType = 'coinbase';
        }
        return {
          address: externalWallet.address,
          name: externalWallet.walletClientType ? (externalWallet.walletClientType.charAt(0).toUpperCase() + externalWallet.walletClientType.slice(1)) : 'Live Wallet',
          role: user?.role || 'Creator',
          iconType,
          walletObj: externalWallet
        };
      }
      
      if (embeddedWallet) {
        return {
          address: embeddedWallet.address,
          name: 'Privy Wallet',
          role: user?.role || 'Creator',
          iconType: 'generic' as const,
          walletObj: embeddedWallet
        };
      }
      
      return null;
    }
  };

  const renderWalletIcon = (iconType: 'metamask' | 'coinbase' | 'generic') => {
    switch (iconType) {
      case 'metamask':
        return <MetaMaskIcon />;
      case 'coinbase':
        return <CoinbaseIcon />;
      default:
        return <WalletIcon />;
    }
  };

  const connectDemoWallet = async () => {
    if (typeof window === 'undefined') return;
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts && accounts.length > 0) {
          setDemoAccount(accounts[0]);
          localStorage.setItem('active_demo_wallet', accounts[0]);
          window.dispatchEvent(new CustomEvent('demo-wallet-changed', { detail: accounts[0] }));
          await connectUserWallet(accounts[0], 'local');
        }
      } catch (err) {
        console.error('Failed to connect demo wallet', err);
      }
    } else {
      const firstAcc = DEMO_ACCOUNTS[0].address;
      setDemoAccount(firstAcc);
      localStorage.setItem('active_demo_wallet', firstAcc);
      window.dispatchEvent(new CustomEvent('demo-wallet-changed', { detail: firstAcc }));
      await connectUserWallet(firstAcc, 'local');
    }
  };

  const disconnectDemoWallet = async () => {
    setDemoAccount(null);
    localStorage.removeItem('active_demo_wallet');
    window.dispatchEvent(new CustomEvent('demo-wallet-changed', { detail: null }));
    try {
      await disconnectUserWallet();
    } catch (err) {
      console.error('Failed to disconnect demo wallet from DB', err);
    }
  };

  const selectDemoAccount = async (address: string) => {
    setDemoAccount(address);
    localStorage.setItem('active_demo_wallet', address);
    window.dispatchEvent(new CustomEvent('demo-wallet-changed', { detail: address }));
    try {
      await connectUserWallet(address, 'local');
    } catch (err) {
      console.error('Failed to sync selected demo wallet to DB', err);
    }
  };

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const walletRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('dismissed_notifications');
    if (saved) setDismissedIds(JSON.parse(saved));
  }, []);

  // Sync demo mode wallet accounts
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncDemoAccount = () => {
      const activeDemo = localStorage.getItem('active_demo_wallet');
      if (activeDemo) {
        setDemoAccount(activeDemo);
      } else if (window.ethereum) {
        window.ethereum.request({ method: 'eth_accounts' })
          .then((accounts: any) => {
            if (accounts && accounts.length > 0) {
              setDemoAccount(accounts[0]);
              localStorage.setItem('active_demo_wallet', accounts[0]);
            } else {
              setDemoAccount(null);
            }
          })
          .catch(() => setDemoAccount(null));
      } else {
        setDemoAccount(null);
      }
    };

    if (isDemoMode) {
      syncDemoAccount();
      
      const handleAccountsChanged = async (accounts: string[]) => {
        if (accounts.length > 0) {
          setDemoAccount(accounts[0]);
          localStorage.setItem('active_demo_wallet', accounts[0]);
          window.dispatchEvent(new CustomEvent('demo-wallet-changed', { detail: accounts[0] }));
          try { await connectUserWallet(accounts[0], 'local'); } catch (e) { console.error(e); }
        } else {
          setDemoAccount(null);
          localStorage.removeItem('active_demo_wallet');
          window.dispatchEvent(new CustomEvent('demo-wallet-changed', { detail: null }));
          try { await disconnectUserWallet(); } catch (e) { console.error(e); }
        }
      };

      const handleGlobalDemoWalletChanged = (e: any) => {
        setDemoAccount(e.detail);
      };

      window.ethereum?.on?.('accountsChanged', handleAccountsChanged);
      window.addEventListener('demo-wallet-changed', handleGlobalDemoWalletChanged);

      return () => {
        window.ethereum?.removeListener?.('accountsChanged', handleAccountsChanged);
        window.removeEventListener('demo-wallet-changed', handleGlobalDemoWalletChanged);
      };
    } else {
      setDemoAccount(null);
    }
  }, [isDemoMode, connectUserWallet, disconnectUserWallet]);

  useEffect(() => {
    setIsDemoMode(localStorage.getItem('demo_mode') === 'true');
    const onDemoChanged = (e: any) => {
      setIsDemoMode(e.detail);
      if (!e.detail) {
        setDemoAccount(null);
      }
    };
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
                    {(() => {
                      const details = getWalletDetails();
                      if (details) {
                        return (
                          <button
                            onClick={() => { setWalletOpen(!walletOpen); setNotificationsOpen(false); setProfileOpen(false); }}
                            className="relative flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                            title={`${details.name}: ${details.address}`}
                          >
                            <div className="relative flex items-center justify-center">
                              {renderWalletIcon(details.iconType)}
                              <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full border border-white dark:border-gray-950" />
                            </div>
                            <span className="text-xs font-mono font-bold text-gray-700 dark:text-gray-300">
                              {truncateAddress(details.address)}
                            </span>
                          </button>
                        );
                      } else {
                        return (
                          <button
                            onClick={isDemoMode ? connectDemoWallet : () => void linkWallet()}
                            className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                              isDemoMode
                                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20'
                                : 'bg-gradient-to-r from-violet-600 to-cyan-500 hover:brightness-110 text-white shadow-md shadow-blue-600/20'
                            }`}
                          >
                            {renderWalletIcon(isDemoMode ? 'metamask' : 'generic')}
                            <span>{isDemoMode ? 'Connect Demo Wallet' : 'Connect Wallet'}</span>
                          </button>
                        );
                      }
                    })()}

                    {/* Wallet Dropdown */}
                    {walletOpen && (
                      <div
                        className="absolute right-0 mt-2 w-80 rounded-2xl shadow-2xl shadow-black/10 border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden z-50"
                        style={{ animation: 'dropdownFadeIn 0.2s ease-out' }}
                      >
                        {isDemoMode ? (
                          /* DEMO DROPDOWN */
                          <>
                            <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-amber-500/5 dark:bg-amber-500/10">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md shadow-orange-500/20">
                                  <MetaMaskIcon />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-gray-900 dark:text-white">Developer Sandbox Wallet (Localhost)</p>
                                  {demoAccount ? (
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <p className="text-[10px] font-mono text-gray-500 dark:text-gray-400 truncate">
                                        {demoAccount}
                                      </p>
                                      <button
                                        onClick={() => copyToClipboard(demoAccount)}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                        title="Copy Address"
                                      >
                                        {copiedAddress === demoAccount ? (
                                          <span className="text-[9px] text-emerald-500 font-bold">Copied!</span>
                                        ) : (
                                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                          </svg>
                                        )}
                                      </button>
                                    </div>
                                  ) : (
                                    <p className="text-[10px] text-gray-400">Not Connected</p>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Switch Demo Account</span>
                            </div>

                            <div className="p-2 space-y-1 max-h-60 overflow-y-auto">
                              {DEMO_ACCOUNTS.map((acc) => {
                                const isCurrent = demoAccount?.toLowerCase() === acc.address.toLowerCase();
                                return (
                                  <button
                                    key={acc.address}
                                    onClick={() => {
                                      selectDemoAccount(acc.address);
                                      setWalletOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                                      isCurrent
                                        ? 'bg-amber-500/10 border border-amber-500/20'
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/60 border border-transparent'
                                    }`}
                                  >
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{acc.name}</p>
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                          acc.role === 'Admin'
                                            ? 'bg-rose-500/10 text-rose-500'
                                            : acc.role === 'Creator'
                                            ? 'bg-violet-500/10 text-violet-500'
                                            : 'bg-emerald-500/10 text-emerald-500'
                                        }`}>
                                          {acc.role}
                                        </span>
                                      </div>
                                      <p className="text-[10px] font-mono text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                        {acc.address}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                      <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                                        {acc.balance} ETH
                                      </span>
                                      {isCurrent && (
                                        <div className="w-2.5 h-2.5 bg-amber-500 rounded-full flex items-center justify-center shrink-0">
                                          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                          </svg>
                                        </div>
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>

                            {demoAccount && (
                              <div className="p-2 border-t border-gray-100 dark:border-gray-800">
                                <button
                                  onClick={() => {
                                    disconnectDemoWallet();
                                    setWalletOpen(false);
                                  }}
                                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                                >
                                  Disconnect EOA
                                </button>
                              </div>
                            )}
                          </>
                        ) : (
                          /* LIVE DROPDOWN */
                          <>
                            {/* Smart Account Info */}
                            <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 dark:from-indigo-950/20 dark:to-purple-950/20">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
                                  <span className="text-white font-black text-xs">AA</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-gray-900 dark:text-white">Smart Account (ERC-4337)</p>
                                  {smartAccountAddress ? (
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <p className="text-[10px] font-mono text-gray-500 dark:text-gray-400 truncate font-bold">
                                        {smartAccountAddress}
                                      </p>
                                      <button
                                        onClick={() => copyToClipboard(smartAccountAddress)}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                        title="Copy Smart Account"
                                      >
                                        {copiedAddress === smartAccountAddress ? (
                                          <span className="text-[9px] text-emerald-500 font-bold">Copied!</span>
                                        ) : (
                                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                          </svg>
                                        )}
                                      </button>
                                    </div>
                                  ) : (
                                    <p className="text-[10px] text-gray-400">Initializing...</p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {smartAccountAddress && (
                              <div className="p-2.5 bg-emerald-500/5 dark:bg-emerald-500/10 border-b border-gray-100 dark:border-gray-800">
                                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest text-center">Zero-Gas Transactions Active</p>
                              </div>
                            )}

                            {/* External EOA Wallet */}
                            <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                              <div className="flex items-center gap-3">
                                {(() => {
                                  const liveWallet = wallets.find(w => w.walletClientType !== 'privy');
                                  if (liveWallet) {
                                    let iconType: 'metamask' | 'coinbase' | 'generic' = 'generic';
                                    if (liveWallet.walletClientType?.toLowerCase().includes('metamask')) {
                                      iconType = 'metamask';
                                    } else if (liveWallet.walletClientType?.toLowerCase().includes('coinbase')) {
                                      iconType = 'coinbase';
                                    }
                                    return (
                                      <>
                                        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                          {renderWalletIcon(iconType)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-bold text-gray-900 dark:text-white capitalize">
                                            {liveWallet.walletClientType ? liveWallet.walletClientType.replace('_', ' ') : 'Live EOA Wallet'}
                                          </p>
                                          <div className="flex items-center gap-1.5 mt-0.5">
                                            <p className="text-[10px] font-mono text-gray-500 dark:text-gray-400 truncate">
                                              {liveWallet.address}
                                            </p>
                                            <button
                                              onClick={() => copyToClipboard(liveWallet.address)}
                                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                              title="Copy EOA Wallet"
                                            >
                                              {copiedAddress === liveWallet.address ? (
                                                <span className="text-[9px] text-emerald-500 font-bold">Copied!</span>
                                              ) : (
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                                </svg>
                                              )}
                                            </button>
                                          </div>
                                        </div>
                                      </>
                                    );
                                  } else {
                                    return (
                                      <div className="flex-1 text-center py-2">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">No external wallet linked.</p>
                                      </div>
                                    );
                                  }
                                })()}
                              </div>
                            </div>

                            <div className="p-2 space-y-1">
                              <button
                                onClick={() => {
                                  setWalletOpen(false);
                                  void linkWallet();
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                              >
                                <span className="w-6 h-6 rounded bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center">🔗</span>
                                Link / Switch Live Wallet
                              </button>
                              <Link
                                href="/profile"
                                onClick={() => setWalletOpen(false)}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                              >
                                <span className="w-6 h-6 rounded bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center">⚙️</span>
                                Manage Keys & Sponsored Gas
                              </Link>
                            </div>
                          </>
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
            <div className="px-4 py-2 space-y-2.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Wallet Connection</p>
              {(() => {
                const details = getWalletDetails();
                if (details) {
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                        <div className="relative flex items-center justify-center shrink-0">
                          {renderWalletIcon(details.iconType)}
                          <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full border border-white dark:border-gray-950" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{details.name}</p>
                          <p className="text-[10px] font-mono text-gray-500 dark:text-gray-400 truncate">{details.address}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {isDemoMode ? (
                          <button
                            onClick={() => {
                              disconnectDemoWallet();
                              setMobileOpen(false);
                            }}
                            className="flex-1 py-2 rounded-xl text-center text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/30 transition-all"
                          >
                            Disconnect
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setMobileOpen(false);
                              void linkWallet();
                            }}
                            className="flex-1 py-2 rounded-xl text-center text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 hover:bg-indigo-100 dark:hover:bg-indigo-950/30 transition-all"
                          >
                            Link / Switch Wallet
                          </button>
                        )}
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <button
                      onClick={() => {
                        setMobileOpen(false);
                        if (isDemoMode) {
                          void connectDemoWallet();
                        } else {
                          void linkWallet();
                        }
                      }}
                      className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all duration-300 ${
                        isDemoMode
                          ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20'
                          : 'bg-gradient-to-r from-violet-600 to-cyan-500 hover:brightness-110 text-white shadow-md shadow-blue-600/20'
                      }`}
                    >
                      {renderWalletIcon(isDemoMode ? 'metamask' : 'generic')}
                      <span>{isDemoMode ? 'Connect Demo Wallet' : 'Connect Wallet'}</span>
                    </button>
                  );
                }
              })()}
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
