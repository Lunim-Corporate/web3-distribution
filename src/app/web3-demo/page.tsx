'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { ETH_PRICE_USD } from '@/app/lib/constants';
import { DEMO_ACCOUNTS } from '@/app/components/Navbar';

/* ─────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────── */
interface Project { id: string; name: string; genre?: string; status: string; total_distributed: number; }
interface RightsHolder {
  id: string; full_name: string; role: string; wallet_address: string;
  percentage: number; avatar_initials?: string; total_received: number;
}

const ETH_TO_USD = ETH_PRICE_USD;
const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
const fmtEth = (n: number) => `${n.toFixed(4)} ETH`;
const trunc = (addr: string) => addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '';

// Hardhat local network — Chain ID 31337. FREE. No real ETH ever used.
const HARDHAT_CHAIN_ID = 31337;
const HARDHAT_CHAIN_ID_HEX = '0x7a69';

/* ─────────────────────────────────────────────────────────────
   Page
───────────────────────────────────────────────────────────── */
export default function Web3DemoPage() {
  // Demo Mode state
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoAccount, setDemoAccount] = useState<string | null>(null);

  // Wallet state
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletError, setWalletError] = useState('');

  // Project state
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [holders, setHolders] = useState<RightsHolder[]>([]);

  // TX state
  const [amount, setAmount] = useState('0.01');
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'confirmed' | 'error'>('idle');
  const [txHash, setTxHash] = useState('');
  const [txError, setTxError] = useState('');
  const [splitPreview, setSplitPreview] = useState<{ name: string; eth: number; usd: number; pct: number }[]>([]);

  /* ── Fetch projects & holders from API ───────────────────── */
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch('/api/dashboard?pid=all&demo=true', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.projectsList?.length) {
            setProjects(data.projectsList);
            setSelectedProject(data.projectsList[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load projects from API:', err);
      }
    };
    loadData();
  }, []);

  /* ── Fetch holders when project changes ─────────────────── */
  useEffect(() => {
    if (!selectedProject) return;
    const loadProjectHolders = async () => {
      try {
        const res = await fetch(`/api/dashboard?pid=${selectedProject}&demo=true`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setHolders(data.holders || []);
        }
      } catch (err) {
        console.error('Failed to load project holders:', err);
      }
    };
    loadProjectHolders();
  }, [selectedProject]);

  /* ── Recalculate split preview ──────────────────────────── */
  useEffect(() => {
    const eth = parseFloat(amount) || 0;
    setSplitPreview(
      holders.map(h => ({
        name: h.full_name,
        pct: h.percentage,
        eth: (h.percentage / 100) * eth,
        usd: (h.percentage / 100) * eth * ETH_TO_USD,
      }))
    );
  }, [amount, holders]);

  /* ── MetaMask helpers ───────────────────────────────────── */
  const getBalance = useCallback(async (addr: string) => {
    if (!window.ethereum) return;
    const raw = await window.ethereum.request({ method: 'eth_getBalance', params: [addr, 'latest'] }) as string;
    setBalance((parseInt(raw, 16) / 1e18).toFixed(4));
  }, []);

  const switchToHardhat = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: HARDHAT_CHAIN_ID_HEX }] });
    } catch (err: any) {
      if (err?.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{ chainId: HARDHAT_CHAIN_ID_HEX, chainName: 'Hardhat Localhost (FREE)', rpcUrls: ['http://127.0.0.1:8545'], nativeCurrency: { name: 'Test ETH', symbol: 'ETH', decimals: 18 } }],
        });
      } else { throw err; }
    }
    const c = await window.ethereum.request({ method: 'eth_chainId' }) as string;
    setChainId(parseInt(c, 16));
  };

  const connectWallet = async () => {
    setWalletError('');
    if (typeof window === 'undefined' || !window.ethereum) {
      setWalletError('MetaMask not installed. Please install it from metamask.io');
      return;
    }
    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }) as string[];
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        const chainRaw = await window.ethereum.request({ method: 'eth_chainId' }) as string;
        setChainId(parseInt(chainRaw, 16));
        await getBalance(accounts[0]);
        // Always auto-switch to Hardhat — FREE local network
        try { await switchToHardhat(); } catch { /* user can switch manually */ }
      }
    } catch (e: any) {
      setWalletError(e.code === 4001 ? 'Connection rejected by user' : `Connection failed: ${e.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Read initial mode
    setIsDemoMode(localStorage.getItem('demo_mode') === 'true');

    const onDemoChanged = (e: any) => {
      setIsDemoMode(e.detail);
    };
    window.addEventListener('demo-mode-changed', onDemoChanged);
    return () => window.removeEventListener('demo-mode-changed', onDemoChanged);
  }, []);

  // Sync wallet based on mode
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isDemoMode) {
      // Sync with active demo wallet
      const syncDemoWallet = () => {
        const activeDemo = localStorage.getItem('active_demo_wallet');
        if (activeDemo) {
          setAccount(activeDemo);
          setChainId(HARDHAT_CHAIN_ID);
          const matchingDemo = DEMO_ACCOUNTS.find(acc => acc.address.toLowerCase() === activeDemo.toLowerCase());
          setBalance(matchingDemo ? matchingDemo.balance : '100.00');
        } else {
          setAccount(null);
          setChainId(null);
          setBalance(null);
        }
      };

      syncDemoWallet();

      const handleDemoWalletChanged = (e: any) => {
        const addr = e.detail;
        if (addr) {
          setAccount(addr);
          setChainId(HARDHAT_CHAIN_ID);
          const matchingDemo = DEMO_ACCOUNTS.find(acc => acc.address.toLowerCase() === addr.toLowerCase());
          setBalance(matchingDemo ? matchingDemo.balance : '100.00');
        } else {
          setAccount(null);
          setChainId(null);
          setBalance(null);
        }
      };

      window.addEventListener('demo-wallet-changed', handleDemoWalletChanged);
      return () => window.removeEventListener('demo-wallet-changed', handleDemoWalletChanged);
    } else {
      // Live / Non-demo mode: we use window.ethereum listeners and initial detection
      if (!window.ethereum) {
        setAccount(null);
        setChainId(null);
        setBalance(null);
        return;
      }

      const onAccChange = (accs: string[]) => {
        if (!accs.length) { setAccount(null); setBalance(null); }
        else { setAccount(accs[0]); void getBalance(accs[0]); }
      };
      
      const onChainChange = (cid: string) => { 
        setChainId(parseInt(cid, 16)); 
      };

      window.ethereum.on?.('accountsChanged', onAccChange as any);
      window.ethereum.on?.('chainChanged', onChainChange as any);

      // Auto-detect if already connected
      (window.ethereum.request({ method: 'eth_accounts' }) as Promise<string[]>)
        .then(async (accs) => { 
          if (accs && accs.length) { 
            setAccount(accs[0]); 
            const c = await window.ethereum!.request({ method: 'eth_chainId' }) as string; 
            setChainId(parseInt(c, 16)); 
            await getBalance(accs[0]); 
          } else {
            setAccount(null);
            setChainId(null);
            setBalance(null);
          }
        })
        .catch(() => {
          setAccount(null);
          setChainId(null);
          setBalance(null);
        });

      return () => {
        window.ethereum?.removeListener?.('accountsChanged', onAccChange as any);
        window.ethereum?.removeListener?.('chainChanged', onChainChange as any);
      };
    }
  }, [isDemoMode, getBalance]);

  /* ── Send MetaMask transaction or Simulate Demo transaction ── */
  const distributeRevenue = async () => {
    if (!account || !selectedProject) return;

    const ethAmt = parseFloat(amount);
    const weiHex = `0x${Math.floor(ethAmt * 1e18).toString(16)}`;

    // If we are in Demo Mode, verify if we can use the injected wallet, otherwise gracefully run a sandbox simulation.
    if (isDemoMode) {
      const hasMetaMask = typeof window !== 'undefined' && !!window.ethereum;
      let activeMetaMaskAcc = '';
      let activeChainIdHex = '';

      if (hasMetaMask) {
        try {
          const accounts = await window.ethereum!.request({ method: 'eth_accounts' }) as string[];
          activeMetaMaskAcc = accounts[0] || '';
          activeChainIdHex = await window.ethereum!.request({ method: 'eth_chainId' }) as string;
        } catch (e) {
          console.warn('MetaMask status check failed, falling back to simulated transaction', e);
        }
      }

      const isMetaMaskMatching = activeMetaMaskAcc && activeMetaMaskAcc.toLowerCase() === account.toLowerCase();
      const isChainHardhat = parseInt(activeChainIdHex, 16) === HARDHAT_CHAIN_ID;

      if (!hasMetaMask || !isMetaMaskMatching || !isChainHardhat) {
        // Run simulated Sandbox transaction
        setTxStatus('pending');
        setTxError('');
        setTxHash('');

        // 1.5s premium micro-animation delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        const mockHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
        setTxHash(mockHash);

        try {
          const res = await fetch('/api/web3/record-transaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              project_id: selectedProject,
              tx_hash: mockHash,
              sender_address: account,
              total_amount_eth: ethAmt,
              is_demo: true,
              holders: holders.map(h => ({
                rights_holder_id: h.id,
                wallet_address: h.wallet_address,
                full_name: h.full_name,
                role: h.role,
                percentage: h.percentage,
                amount_eth: (h.percentage / 100) * ethAmt,
              })),
            }),
          });

          if (!res.ok) {
            const err = await res.json();
            console.warn('DB record warning:', err.error);
          }
        } catch (dbErr) {
          console.warn('Simulated tx database sync skipped:', dbErr);
        }

        // Trigger cross-tab update
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('payment-recorded'));
          try {
            const bc = new BroadcastChannel('lunim-realtime');
            bc.postMessage({ type: 'payment-recorded' });
            bc.close();
          } catch (bcErr) {
            console.warn('BroadcastChannel sync skipped');
          }
        }

        setTxStatus('confirmed');
        // Deduct from local sandbox balance
        const matchingDemo = DEMO_ACCOUNTS.find(acc => acc.address.toLowerCase() === account.toLowerCase());
        if (matchingDemo) {
          const newBal = (parseFloat(balance || '100') - ethAmt).toFixed(4);
          setBalance(newBal);
        }

        window.dispatchEvent(new CustomEvent('payment-recorded', { detail: { txHash: mockHash, projectId: selectedProject } }));
        return;
      }
    }

    // Safety: block if on wrong network in real/live mode or when utilizing actual injected MetaMask
    if (!isCorrectNetwork) {
      try { await switchToHardhat(); }
      catch { setTxError('Please switch to Hardhat Localhost first'); return; }
    }

    setTxStatus('pending'); setTxError(''); setTxHash('');

    try {
      const contractAddress = process.env.NEXT_PUBLIC_REVENUE_SPLITTER_ADDRESS || holders[0]?.wallet_address;
      if (!contractAddress) throw new Error('No contract/recipient address configured');

      // The function selector for distributeRevenue() is 0x2d07953a
      const data = '0x2d07953a';

      const hash = await window.ethereum!.request({
        method: 'eth_sendTransaction',
        params: [{ 
          from: account, 
          to: contractAddress, 
          value: weiHex,
          data: data,
          gasPrice: '0x0' // Set gas price to 0 for local Hardhat (FREE)
        }],
      }) as string;

      setTxHash(hash);

      // Record the real transaction to Supabase via server route
      const res = await fetch('/api/web3/record-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: selectedProject,
          tx_hash: hash,
          sender_address: account,
          total_amount_eth: ethAmt,
          is_demo: isDemoMode,
          holders: holders.map(h => ({
            rights_holder_id: h.id,
            wallet_address: h.wallet_address,
            full_name: h.full_name,
            role: h.role,
            percentage: h.percentage,
            amount_eth: (h.percentage / 100) * ethAmt,
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.warn('DB record warning:', err.error);
      }
      
      // Trigger cross-tab update
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('payment-recorded'));
        try {
          const bc = new BroadcastChannel('lunim-realtime');
          bc.postMessage({ type: 'payment-recorded' });
          bc.close();
        } catch (e) {
          console.warn('BroadcastChannel not supported');
        }
      }

      setTxStatus('confirmed');
      await getBalance(account);
      // Notify main dashboard
      window.dispatchEvent(new CustomEvent('payment-recorded', { detail: { txHash: hash, projectId: selectedProject } }));
    } catch (e: any) {
      setTxStatus('error');
      setTxError(e.code === 4001 ? 'Transaction rejected by user' : (e.message || 'Transaction failed'));
    }
  };

  const isCorrectNetwork = chainId === HARDHAT_CHAIN_ID;

  const networkName = (cid: number | null) => {
    if (cid === HARDHAT_CHAIN_ID) return '🟢 Hardhat Localhost (FREE)';
    if (cid === 1)   return '🔴 Ethereum Mainnet (REAL $$$)';
    if (cid === 137) return '🔴 Polygon Mainnet (REAL $$$)';
    if (!cid)        return 'Not connected';
    return `⚠️ Chain ${cid}`;
  };

  const projectData = projects.find(p => p.id === selectedProject);

  return (
    <div className="min-h-screen bg-[#070B14] text-white">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#070B14]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-medium">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
              Back to Dashboard
            </Link>
            <div className="w-px h-5 bg-white/10" />
            <div>
              <h1 className="text-base font-black text-white tracking-tight">⚡ Web3 Revenue Distribution</h1>
              <p className="text-xs text-gray-500 font-medium">
                {isDemoMode ? (
                  <span>Sandbox Simulator · <span className="text-amber-400 font-bold">Demo Mode Active (FREE)</span></span>
                ) : (
                  <span>Hardhat Localhost · <span className="text-emerald-400 font-bold">FREE — No real ETH spent</span></span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {account && (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
                isDemoMode
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isDemoMode ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                <span className="text-xs font-bold font-mono">{trunc(account)}</span>
                {balance && <span className={`text-xs font-mono ${isDemoMode ? 'text-amber-300' : 'text-emerald-300'}`}>{balance} ETH</span>}
              </div>
            )}
            {chainId && (
              <div className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
                isDemoMode
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                  : isCorrectNetwork
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}>
                {isDemoMode ? '🟢 Sandbox (FREE)' : networkName(chainId)}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT: Wallet + Config */}
        <div className="lg:col-span-1 space-y-6">
          {/* Wallet Card */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Wallet Connection</h2>
            {!account ? (
              <div className="text-center space-y-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto ${
                  isDemoMode 
                    ? 'bg-amber-500/10 border border-amber-500/20' 
                    : 'bg-orange-500/10 border border-orange-500/20'
                }`}>
                  <span className="text-3xl">🦊</span>
                </div>
                <div>
                  <p className="text-white font-bold">{isDemoMode ? 'Select a Demo Wallet' : 'Connect MetaMask'}</p>
                  <p className="text-gray-400 text-xs mt-1">
                    {isDemoMode 
                      ? 'Choose one of our pre-seeded local Hardhat accounts to simulate transactions with zero costs.' 
                      : 'Connect your real MetaMask wallet to execute transactions on the local Hardhat chain.'}
                  </p>
                </div>
                {isDemoMode ? (
                  <div className="space-y-2 mt-2">
                    {DEMO_ACCOUNTS.map(acc => (
                      <button
                        key={acc.address}
                        onClick={() => {
                          localStorage.setItem('active_demo_wallet', acc.address);
                          window.dispatchEvent(new CustomEvent('demo-wallet-changed', { detail: acc.address }));
                        }}
                        className="w-full py-2.5 px-4 bg-white/5 border border-white/5 hover:border-amber-500/40 text-left rounded-xl transition-all flex items-center justify-between group hover:bg-amber-500/5"
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">{acc.role}</p>
                          <p className="text-[10px] text-gray-500 font-mono truncate">{acc.address}</p>
                        </div>
                        <span className="text-xs text-amber-300 font-bold shrink-0">{acc.balance} ETH</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <>
                    {walletError && (
                      <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-left">{walletError}</div>
                    )}
                    <button
                      onClick={connectWallet}
                      disabled={isConnecting}
                      className="w-full py-3 px-6 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-orange-500/20"
                    >
                      {isConnecting ? 'Connecting…' : '🦊 Connect MetaMask'}
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className={`flex items-center gap-3 p-3 rounded-xl border ${
                  isDemoMode 
                    ? 'bg-amber-500/10 border-amber-500/20' 
                    : 'bg-emerald-500/10 border-emerald-500/20'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isDemoMode ? 'bg-amber-500/20' : 'bg-emerald-500/20'
                  }`}>
                    <div className={`w-3 h-3 rounded-full ${isDemoMode ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400">
                      {isDemoMode ? 'Connected Sandbox EOA' : 'Connected Account'}
                    </p>
                    <p className="text-sm font-bold text-white font-mono truncate">{account}</p>
                    {isDemoMode && (() => {
                      const activeAcc = DEMO_ACCOUNTS.find(acc => acc.address.toLowerCase() === account.toLowerCase());
                      return activeAcc ? (
                        <span className="text-[10px] text-amber-400 font-bold block mt-0.5">
                          {activeAcc.role} ({activeAcc.name})
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-400 font-bold block mt-0.5">Custom EOA</span>
                      );
                    })()}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white/5 rounded-xl">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">Balance</p>
                    <p className="text-sm font-bold text-white mt-0.5">{balance} ETH</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">Network</p>
                    <p className="text-sm font-bold text-white mt-0.5">
                      {isDemoMode ? '🟢 Sandbox (FREE)' : networkName(chainId)}
                    </p>
                  </div>
                </div>
                {isDemoMode && (
                  <div className="space-y-1.5 border-t border-white/5 pt-3">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                      Switch Role EOA
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {DEMO_ACCOUNTS.map(acc => {
                        const isSelected = acc.address.toLowerCase() === account.toLowerCase();
                        return (
                          <button
                            key={acc.address}
                            onClick={() => {
                              localStorage.setItem('active_demo_wallet', acc.address);
                              window.dispatchEvent(new CustomEvent('demo-wallet-changed', { detail: acc.address }));
                            }}
                            className={`py-1.5 px-2 text-[10px] font-black rounded-lg transition-all border ${
                              isSelected 
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                                : 'bg-white/5 text-gray-400 border-white/5 hover:border-white/15'
                            }`}
                            title={acc.name}
                          >
                            {acc.role}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                <button
                  onClick={() => {
                    if (isDemoMode) {
                      localStorage.removeItem('active_demo_wallet');
                      window.dispatchEvent(new CustomEvent('demo-wallet-changed', { detail: null }));
                    } else {
                      setAccount(null); setBalance(null); setChainId(null);
                    }
                  }}
                  className="w-full py-2 text-xs text-gray-400 hover:text-rose-400 transition-colors border-t border-white/5 mt-2"
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>

          {/* Project Selector */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Select Project</h2>
            <div className="space-y-2">
              {projects.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProject(p.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedProject === p.id
                      ? 'bg-indigo-500/15 border-indigo-500/40 shadow-lg shadow-indigo-500/10'
                      : 'bg-white/3 border-white/5 hover:border-white/15'
                  }`}
                >
                  <p className="font-bold text-white text-sm">{p.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{p.genre}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Amount Input */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Distribution Amount</h2>
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xl font-black focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">ETH</span>
              </div>
              <p className="text-gray-400 text-xs text-center">≈ {fmt((parseFloat(amount) || 0) * ETH_TO_USD)} USD at current rates</p>
              <div className="flex gap-2">
                {['0.001','0.01','0.1','1'].map(v => (
                  <button key={v} onClick={() => setAmount(v)} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${amount === v ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-white/5 text-gray-400 border border-white/5 hover:border-white/15'}`}>{v}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Split Preview + Execute */}
        <div className="lg:col-span-2 space-y-6">
          {/* Split Preview */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-black text-white">Revenue Split Preview</h2>
                <p className="text-gray-400 text-sm mt-1">
                  {projectData?.name} — {holders.length} rights holders
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-white">{fmtEth(parseFloat(amount) || 0)}</p>
                <p className="text-xs text-gray-400 mt-0.5">{fmt((parseFloat(amount) || 0) * ETH_TO_USD)}</p>
              </div>
            </div>

            {holders.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-3">👥</div>
                <p className="font-medium">No rights holders found for this project</p>
              </div>
            ) : (
              <div className="space-y-3">
                {splitPreview.map((s, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-white/3 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-indigo-300 font-black text-sm border border-indigo-500/10">
                      {s.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-sm truncate">{s.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style={{ width: `${s.pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-400 font-mono w-8 text-right">{s.pct}%</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-white font-mono">{fmtEth(s.eth)}</p>
                      <p className="text-xs text-gray-400">{fmt(s.usd)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Execute Button */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
            <AnimatePresence mode="wait">
              {txStatus === 'idle' && (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {!account ? (
                    <div className="text-center py-4">
                      <p className="text-gray-400 font-medium">Connect your MetaMask wallet to distribute</p>
                      <button onClick={connectWallet} className="mt-4 px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-xl hover:opacity-90 transition-all">
                        🦊 Connect MetaMask
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* FREE badge */}
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                        <p className="text-emerald-300 text-sm font-bold mb-1">🟢 100% Free — Hardhat Local Network</p>
                        <p className="text-emerald-200/70 text-xs">This uses <strong>test ETH only</strong> on your local Hardhat chain (Chain ID 31337). No real money, no gas fees, nothing leaves your machine.</p>
                      </div>
                      {/* Network warning if wrong chain */}
                      {!isCorrectNetwork && chainId && (
                        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4">
                          <p className="text-rose-300 text-sm font-bold mb-2">⚠️ Wrong Network — {networkName(chainId)}</p>
                          <p className="text-rose-200/70 text-xs mb-3">You must be on Hardhat Localhost to proceed. Click below to switch automatically.</p>
                          <button onClick={switchToHardhat} className="w-full py-2 bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold rounded-lg text-sm hover:bg-rose-500/30 transition-all">
                            Switch to Hardhat Localhost →
                          </button>
                        </div>
                      )}
                      <button
                        onClick={distributeRevenue}
                        disabled={!selectedProject || holders.length === 0 || !parseFloat(amount) || !isCorrectNetwork}
                        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-lg rounded-xl hover:opacity-90 transition-all disabled:opacity-40 shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40"
                      >
                        ⚡ Distribute {amount} Test ETH (FREE)
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {txStatus === 'pending' && (
                <motion.div key="pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-8">
                  <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-white font-black text-lg">Processing Transaction</p>
                  <p className="text-gray-400 text-sm mt-2">Confirm in MetaMask and wait for confirmation…</p>
                </motion.div>
              )}

              {txStatus === 'confirmed' && (
                <motion.div key="confirmed" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto border border-emerald-500/30">
                    <span className="text-3xl">✅</span>
                  </div>
                  <div>
                    <p className="text-emerald-400 font-black text-xl">Transaction Confirmed!</p>
                    <p className="text-gray-400 text-sm mt-2">Revenue split recorded on-chain and in Supabase</p>
                  </div>
                  {txHash && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Transaction Hash</p>
                      <p className="text-xs font-mono text-indigo-300 break-all">{txHash}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => { setTxStatus('idle'); setTxHash(''); }} className="py-3 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all">
                      New Distribution
                    </button>
                    <Link href="/dashboard" className="py-3 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-bold rounded-xl hover:bg-indigo-500/30 transition-all text-center">
                      View Dashboard →
                    </Link>
                  </div>
                </motion.div>
              )}

              {txStatus === 'error' && (
                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center mx-auto border border-rose-500/30">
                    <span className="text-3xl">❌</span>
                  </div>
                  <div>
                    <p className="text-rose-400 font-black text-xl">Transaction Failed</p>
                    {txError && <p className="text-gray-400 text-sm mt-2">{txError}</p>}
                  </div>
                  <button onClick={() => { setTxStatus('idle'); setTxError(''); }} className="py-3 px-8 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all">
                    Try Again
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* How it works */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">How This Works</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: '🦊', title: 'Connect MetaMask', desc: 'Your real wallet signs the transaction on Ethereum/Hardhat' },
                { icon: '⛓️', title: 'On-Chain Settlement', desc: 'ETH is sent to the smart contract for proportional distribution' },
                { icon: '📊', title: 'Dashboard Sync', desc: 'Transaction is recorded in Supabase and the main dashboard updates' },
              ].map((step, i) => (
                <div key={i} className="text-center p-4">
                  <div className="text-3xl mb-3">{step.icon}</div>
                  <p className="font-bold text-white text-sm">{step.title}</p>
                  <p className="text-gray-400 text-xs mt-1 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
