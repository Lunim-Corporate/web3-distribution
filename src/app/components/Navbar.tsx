'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useWeb3Modal } from '@web3modal/ethers/react';
import { useWallet } from '@/lib/wallet';
import { toast } from 'react-hot-toast';


type WalletProviderLike = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  providers?: WalletProviderLike[];
  providerMap?: Map<unknown, WalletProviderLike>;
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
  isRainbow?: boolean;
  isTrust?: boolean;
  isPhantom?: boolean;
};

type DashboardPayment = {
  id?: string;
  tx_hash?: string;
  created_at: string;
  amount?: number;
  project_id?: string;
  projectName?: string;
  total_batch_amount?: number;
  count?: number;
};

function getBrowserEthereum(): WalletProviderLike | null {
  if (typeof window === 'undefined') return null;
  return ((window as Window & { ethereum?: WalletProviderLike }).ethereum ?? null);
}

function getErrorCode(error: unknown): number | undefined {
  return typeof error === 'object' && error !== null && 'code' in error
    ? Number((error as { code?: unknown }).code)
    : undefined;
}

function getStoredLiveWalletId(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('selected_live_wallet');
}

// Hardhat demo accounts for demo mode - USE PLACEHOLDERS FOR SECURITY
const HARDHAT_ACCOUNTS = [
  { address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', name: 'Account 1 (Admin)', privateKey: '0x...REPLACE_WITH_HARDHAT_PK_1' },
  { address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', name: 'Account 2 (Creator)', privateKey: '0x...REPLACE_WITH_HARDHAT_PK_2' },
  { address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', name: 'Account 3 (Contributor)', privateKey: '0x...REPLACE_WITH_HARDHAT_PK_3' },
  { address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906', name: 'Account 4 (Partner)', privateKey: '0x...REPLACE_WITH_HARDHAT_PK_4' },
  { address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', name: 'Account 5 (Investor)', privateKey: '0x...REPLACE_WITH_HARDHAT_PK_5' },
];

// Wallet options for live mode with dynamic icons and official links
const LIVE_WALLETS = [
  { id: 'metamask', name: 'MetaMask', icon: '/wallet-icons/metamask.svg', fallback: 'M', url: 'https://metamask.io/download/' },
  { id: 'coinbase', name: 'Coinbase Wallet', icon: '/wallet-icons/coinbase.svg', fallback: 'C', url: 'https://www.coinbase.com/wallet' },
  { id: 'rainbow', name: 'Rainbow', icon: '/wallet-icons/rainbow.svg', fallback: 'R', url: 'https://rainbow.me/' },
  { id: 'trust', name: 'Trust Wallet', icon: '/wallet-icons/trust.svg', fallback: 'T', url: 'https://trustwallet.com/' },
  { id: 'phantom', name: 'Phantom', icon: '/wallet-icons/phantom.svg', fallback: 'P', url: 'https://phantom.app/' },
];

// Detect wallet provider from ethereum
function detectWalletProvider(): { id: string; name: string; icon: string; fallback: string; url: string } | null {
  const eth = getBrowserEthereum();
  if (!eth) return null;
  
  // Handle EIP-6963 or multi-provider arrays
  const providers = eth.providers || (eth.providerMap ? Array.from(eth.providerMap.values()) : null);
  const preferredWalletId = getStoredLiveWalletId();

  if (preferredWalletId) {
    const preferredWallet = LIVE_WALLETS.find((wallet) => wallet.id === preferredWalletId);
    const preferredProvider = preferredWallet ? getSpecificWalletProvider(preferredWallet.id) : null;
    if (preferredWallet && preferredProvider) {
      return preferredWallet;
    }
  }
  
  const isMetaMask = eth.isMetaMask || (providers?.some((p) => p.isMetaMask));
  const isCoinbase = eth.isCoinbaseWallet || (providers?.some((p) => p.isCoinbaseWallet));
  const isRainbow = eth.isRainbow || (providers?.some((p) => p.isRainbow));
  const isTrust = eth.isTrust || (providers?.some((p) => p.isTrust));
  const isPhantom = eth.isPhantom || (providers?.some((p) => p.isPhantom));

  if (isMetaMask) return LIVE_WALLETS.find(w => w.id === 'metamask') || null;
  if (isCoinbase) return LIVE_WALLETS.find(w => w.id === 'coinbase') || null;
  if (isRainbow) return LIVE_WALLETS.find(w => w.id === 'rainbow') || null;
  if (isTrust) return LIVE_WALLETS.find(w => w.id === 'trust') || null;
  if (isPhantom) return LIVE_WALLETS.find(w => w.id === 'phantom') || null;
  
  return null;
}

function getSpecificWalletProvider(walletId: string) {
  const eth = getBrowserEthereum();
  if (!eth) return null;
  const providers = eth.providers || (eth.providerMap ? Array.from(eth.providerMap.values()) : []);
  const providerList = providers.length > 0 ? providers : [eth];

  return providerList.find((provider) =>
    (walletId === 'metamask' && provider.isMetaMask) ||
    (walletId === 'coinbase' && provider.isCoinbaseWallet) ||
    (walletId === 'rainbow' && provider.isRainbow) ||
    (walletId === 'trust' && provider.isTrust) ||
    (walletId === 'phantom' && provider.isPhantom)
  ) || null;
}

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<DashboardPayment[]>([]);
  const profileRef = useRef<HTMLDivElement>(null);
  const walletDropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  useWeb3Modal();
  const [detectedWallet, setDetectedWallet] = useState<{ id: string; name: string; icon: string; fallback: string } | null>(null);

  const {
    account: walletAddress,
    isConnected: walletConnected,
    disconnectWallet,
  } = useWallet();

  const selectedDemoAccount = isDemoMode
    ? HARDHAT_ACCOUNTS.find((account) => account.address === walletAddress) ?? null
    : null;

  useEffect(() => {
    if (isDemoMode) {
      setDetectedWallet(null);
      return;
    }

    const wallet = detectWalletProvider();
    setDetectedWallet(wallet);
  }, [isDemoMode, walletAddress, walletConnected]);

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

  // Handle click outside dropdowns
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (walletDropdownRef.current && !walletDropdownRef.current.contains(e.target as Node)) {
        setWalletDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Listen for payment events to update notifications
  const refreshNotifications = React.useCallback(() => {
    const mode = isDemoMode ? 'demo' : 'live';
    fetch(`/api/dashboard/data?projectId=all&mode=${mode}`)
      .then(r => r.json())
      .then(d => {
          // Group by tx_hash for notification bell to avoid project duplicates
          const groupedMap = new Map<string, DashboardPayment>();
          ((d.payments || []) as DashboardPayment[]).forEach((p) => {
            const hash = p.tx_hash || `no-hash-${p.id}`;
            if (!groupedMap.has(hash)) {
              groupedMap.set(hash, { ...p, total_batch_amount: 0, count: 0 });
            }
            const item = groupedMap.get(hash);
            if (!item) return;
            item.total_batch_amount = (Number(item.total_batch_amount) || 0) + (Number(p.amount) || 0) / 100;
            item.count = (Number(item.count) || 0) + 1;
          });
          const groupedList = Array.from(groupedMap.values())
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          
          setRecentTransactions(groupedList.slice(0, 5));
      })
      .catch(e => console.error(e));
  }, [isDemoMode]);

  useEffect(() => {
    refreshNotifications();
    
    const onPaymentRecorded = () => refreshNotifications();
    const onPaymentPending = (e: Event) => {
      // Optionally show a "Processing..." notification
      console.log("Payment pending:", (e as CustomEvent).detail);
    };

    window.addEventListener('payment-recorded', onPaymentRecorded);
    window.addEventListener('payment-pending', onPaymentPending);
    
    return () => {
      window.removeEventListener('payment-recorded', onPaymentRecorded);
      window.removeEventListener('payment-pending', onPaymentPending);
    };
  }, [refreshNotifications]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
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

            {/* Main Navigation Links */}
            {user && (
              <div className="hidden lg:flex items-center gap-1 ml-8">
                <Link
                  href="/dashboard"
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    isOnDashboard 
                      ? 'bg-indigo-500/10 text-indigo-500 shadow-sm shadow-indigo-500/10' 
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-900'
                  }`}
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
                              <div key={tx.id || i} className="px-4 py-4 border-b border-gray-800/50 hover:bg-white/[0.03] transition-all cursor-pointer relative group">
                                <button 
                                  onClick={(e) => { 
                                    e.stopPropagation();
                                    setRecentTransactions(prev => prev.filter(t => t.id !== tx.id));
                                  }} 
                                  className="absolute top-1/2 -translate-y-1/2 right-3 text-gray-500 hover:text-rose-400 bg-white/5 hover:bg-rose-500/10 rounded-full w-7 h-7 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-all z-10 border border-white/5"
                                  title="Dismiss notification"
                                >
                                  ✕
                                </button>
                                <div onClick={() => { setNotificationsOpen(false); window.location.href = `/dashboard?tab=reports&project=${tx.project_id}`; }}>
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 text-xs font-bold border border-indigo-500/20">
                                      {tx.projectName?.charAt(0) || 'P'}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-sm font-black text-gray-100 truncate pr-6">{tx.projectName || 'Unknown Project'}</span>
                                      <span className="text-[10px] text-gray-500 font-mono">
                                        {new Date(tx.created_at).toLocaleDateString()} · ${Number(tx.total_batch_amount || 0).toLocaleString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
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
                      onClick={() => setWalletDropdownOpen((open) => !open)}
                      className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-all relative ${
                        walletConnected ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-white/5 border-white/10 hover:bg-white/10'
                      } border`}
                      title="Wallet"
                    >
                      {/* Dynamic wallet icon based on detected provider or default */}
                      <div className="flex items-center gap-2">
                        {isDemoMode && walletConnected ? (
                          <div className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-br from-amber-500 to-orange-500">
                            {selectedDemoAccount ? selectedDemoAccount.name.charAt(8) : 'D'}
                          </div>
                        ) : walletConnected && detectedWallet ? (
                          <div className="w-5 h-5 flex items-center justify-center">
                            <img 
                              src={detectedWallet.icon} 
                              alt={detectedWallet.name} 
                              className="w-5 h-5 rounded-sm object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                            <div className="hidden w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-br from-indigo-500 to-purple-500">
                              {detectedWallet.fallback}
                            </div>
                          </div>
                        ) : walletConnected ? (
                          <div className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-br from-indigo-500 to-purple-500">
                            {walletAddress?.charAt(2).toUpperCase() || 'W'}
                          </div>
                        ) : (
                          <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H8.25a2.25 2.25 0 00-2.25 2.25c0 .696.306 1.344.82 1.808l6.408 5.233c.344.28.808.28 1.152 0l6.408-5.233c.514-.464.82-1.112.82-1.808a2.25 2.25 0 00-2.25-2.25H15M9 12h6m-6 3h6M9 6h6" />
                          </svg>
                        )}
                        
                        {walletConnected && walletAddress && (
                          <span className="text-[11px] font-mono font-bold text-gray-200 hidden sm:inline-block">
                            {walletAddress.substring(0, 6)}...{walletAddress.substring(38)}
                          </span>
                        )}
                      </div>

                      {/* Green dot when connected */}
                      {walletConnected && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-gray-900 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
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
                            <div className="space-y-1">
                              {HARDHAT_ACCOUNTS.map((account) => (
                                <button
                                  key={account.address}
                                  onClick={() => {
                                    localStorage.setItem('demo_wallet', account.address);
                                    localStorage.setItem('demo_private_key', account.privateKey);
                                    window.dispatchEvent(new CustomEvent('wallet-changed', { detail: account.address }));
                                    setWalletDropdownOpen(false);
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
                          </div>
                        ) : (
                          /* Live Mode - Wallet Options */
                          <div className="p-2">
                            <p className="px-3 py-2 text-[10px] font-bold text-indigo-400 uppercase">Connect with</p>
                            {LIVE_WALLETS.map((wallet) => (
                              <button
                                key={wallet.id}
                                onClick={async () => {
                                  setWalletDropdownOpen(false);

                                  const loadingToast = toast.loading(`Connecting to ${wallet.name}...`);

                                  try {
                                    const provider = getSpecificWalletProvider(wallet.id);
                                    if (!provider) {
                                      toast.dismiss(loadingToast);
                                      toast.error(`${wallet.name} is not installed on this browser`);
                                      window.open(wallet.url, '_blank', 'noopener,noreferrer');
                                      return;
                                    }

                                    localStorage.removeItem('demo_wallet');
                                    localStorage.removeItem('demo_private_key');
                                    localStorage.setItem('selected_live_wallet', wallet.id);

                                    try {
                                      await provider.request({
                                        method: 'wallet_requestPermissions',
                                        params: [{ eth_accounts: {} }]
                                      });
                                    } catch (permissionErr) {
                                      const permissionCode = getErrorCode(permissionErr);
                                      if (permissionCode === 4001 || permissionCode === -32002) {
                                        throw permissionErr;
                                      }
                                    }

                                    const accounts = await provider.request({
                                      method: 'eth_requestAccounts',
                                      params: []
                                    }) as string[];

                                    if (accounts && accounts.length > 0) {
                                      setDetectedWallet(wallet);
                                      window.dispatchEvent(new CustomEvent('wallet-changed', { detail: accounts[0] }));
                                      toast.success(`${wallet.name} connected`, { id: loadingToast });
                                      return;
                                    }

                                    localStorage.removeItem('selected_live_wallet');
                                    toast.error(`No ${wallet.name} account was selected`, { id: loadingToast });
                                  } catch (err: unknown) {
                                    if (getErrorCode(err) === 4001) {
                                      toast.error('Connection rejected', { id: loadingToast });
                                    } else if (getErrorCode(err) === -32002) {
                                      toast.error('Connection request already pending. Check your wallet extension.', { id: loadingToast });
                                    } else {
                                      console.error('Connection failed:', err);
                                      localStorage.removeItem('selected_live_wallet');
                                      toast.error(`Unable to connect ${wallet.name}`, { id: loadingToast });
                                    }
                                  }
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-800 border border-transparent transition-all group"
                              >
                                <div className="relative">
                                  <img
                                    src={wallet.icon}
                                    alt={wallet.name}
                                    className="w-8 h-8 rounded-lg group-hover:scale-110 transition-transform"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      target.nextElementSibling?.classList.remove('hidden');
                                    }}
                                  />
                                  <span className="hidden w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white">
                                    {wallet.name.charAt(0)}
                                  </span>
                                </div>
                                <div className="flex-1 text-left">
                                  <p className="text-sm font-medium text-white group-hover:text-indigo-300 transition-colors">{wallet.name}</p>
                                  <p className="text-[10px] text-gray-500">
                                    {walletConnected && detectedWallet?.id === wallet.id ? 'Connected' : 'Open connector'}
                                  </p>
                                </div>
                                {walletConnected && detectedWallet?.id === wallet.id && (
                                  <span className="ml-auto w-2 h-2 bg-emerald-400 rounded-full" />
                                )}
                              </button>
                            ))}
                          </div>
                        )}

                        {!walletConnected && (
                          <div className="px-4 py-3 border-t border-gray-700 bg-gray-800/40">
                            <p className="text-[10px] text-gray-500">
                              {isDemoMode
                                ? 'Choose a local Hardhat wallet for demo transactions.'
                                : 'Choose a wallet first. The selected address will appear here and on the dashboard after connection.'}
                            </p>
                          </div>
                        )}

                        {/* Connected Wallet Info */}
                        {walletConnected && walletAddress && (
                          <div className="p-3 border-t border-gray-700 bg-gray-800/50">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 px-1">Active Connection</p>
                            <div className="flex items-center gap-3 px-3 py-2 bg-gray-900 rounded-xl border border-gray-700 shadow-sm">
                              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_5px_rgba(52,211,153,0.5)]" />
                              <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-mono text-gray-300 truncate">{walletAddress}</p>
                                <p className="text-[10px] text-gray-500">{isDemoMode ? 'Demo wallet' : detectedWallet?.name || 'Live wallet'}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                localStorage.removeItem('demo_wallet');
                                localStorage.removeItem('demo_private_key');
                                localStorage.removeItem('selected_live_wallet');
                                setWalletDropdownOpen(false);
                                void disconnectWallet();
                              }}
                              className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-400 border border-rose-500/20 hover:bg-rose-500/10 transition-all"
                            >
                              Disconnect
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>


                  {/* Divider */}
                  <div className="w-px h-6 bg-gray-200 dark:bg-gray-800 mx-1" />

                  {/* User profile dropdown */}
                  <div className="relative" ref={profileRef}>
                    <button
                      onClick={() => setProfileOpen(!profileOpen)}
                      className={`flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-2xl transition-all duration-200 group ${
                        profileOpen ? 'bg-gray-100 dark:bg-gray-900' : 'hover:bg-gray-50 dark:hover:bg-gray-900'
                      }`}
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

                    {/* Profile Dropdown Menu */}
                    {profileOpen && (
                      <div 
                        className="absolute right-0 mt-2 w-64 rounded-2xl shadow-2xl shadow-black/20 border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-hidden z-50"
                        style={{ animation: 'dropdownFadeIn 0.2s ease-out' }}
                      >
                        {/* Dropdown Header */}
                        <div className="px-5 py-4 bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
                          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.name || 'Creative User'}</p>
                          <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                        </div>

                        {/* Menu Links */}
                        <div className="p-2">
                          {user.role === 'admin' && (
                            <Link
                              href="/admin"
                              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all group"
                            >
                              <span className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">🛠️</span>
                              Admin Panel
                            </Link>
                          )}
                          
                          <Link
                            href="/profile"
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 hover:text-blue-600 dark:hover:text-blue-400 transition-all group"
                          >
                            <span className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">👤</span>
                            Profile & Settings
                          </Link>

                        </div>

                        {/* Sign Out Section */}
                        <div className="p-2 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800">
                          <button
                            onClick={() => void logout()}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-all group"
                          >
                            <span className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">🚪</span>
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
                  <Link
                    href="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <span>👤</span> Profile
                  </Link>
                  <Link
                    href="/profile?tab=settings"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <span>⚙️</span> Settings
                  </Link>
                  {user.role === 'admin' && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <span>🛠️</span> Admin Panel
                    </Link>
                  )}
                  {walletConnected && (
                    <div className="mx-4 my-2 px-3 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                        <span className="text-[10px] font-mono text-emerald-400">{walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}</span>
                      </div>
                      <button 
                        onClick={() => void disconnectWallet()}
                        className="text-[10px] font-bold text-rose-500 uppercase tracking-widest"
                      >
                        Disconnect
                      </button>
                    </div>
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
