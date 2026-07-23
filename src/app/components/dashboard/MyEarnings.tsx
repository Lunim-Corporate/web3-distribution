'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRevenueSplitter } from '@/lib/web3';
import { useSafeWallets } from '@/lib/web3/useSafeWallets';
import { ADMIN_LIVE_ADDRESS } from '@/lib/web3/config';
import { useEthPrice } from '@/app/lib/useEthPrice';
import { toast } from 'react-hot-toast';
import { dedupeJsonFetch } from '@/app/lib/requestCache';

interface RightsHolder {
  id: string;
  full_name: string;
  role: string;
  wallet_address: string;
  percentage: number;
  total_received: number;
  email?: string;
}

interface TransactionSplit {
  id: string;
  rights_holder_id: string;
  full_name: string;
  role: string;
  percentage: number;
  amount_eth: number;
  wallet_address: string;
}

interface Transaction {
  id: string;
  tx_hash?: string;
  txHash?: string;
  total_amount_eth?: number;
  amount?: number;
  status: string;
  created_at?: string;
  date?: string;
  project_id?: string;
  projectId?: string;
  projectName?: string;
  transaction_splits?: TransactionSplit[];
  splits?: TransactionSplit[];
}

interface MyEarningsProps {
  user: any;
  projectId: string | null;
  holders: RightsHolder[];
  isDemoMode: boolean;
  project?: { id: string; name: string; contract_address?: string; demo_contract_address?: string; } | null;
}

const formatUSD = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

const getSplits = (tx: Transaction) => tx.transaction_splits || tx.splits || [];

const getTransactionDate = (tx: Transaction) => tx.created_at || tx.date || new Date().toISOString();

const demoClaimStorageKey = (wallet: string) => `demo_claimed_earnings:${wallet.toLowerCase()}`;

export const MyEarnings: React.FC<MyEarningsProps> = ({ user, projectId: _projectId, holders, isDemoMode, project }) => {
  const { wallets } = useSafeWallets();
  const demoCA = project?.demo_contract_address || process.env.NEXT_PUBLIC_DEMO_CONTRACT_ADDRESS;
  const liveCA = project?.contract_address || process.env.NEXT_PUBLIC_LIVE_CONTRACT_ADDRESS;
  const targetCA = isDemoMode ? demoCA : liveCA;

  const { getAccruedBalanceEth, claimRevenue } = useRevenueSplitter(targetCA);
  const { ethPrice } = useEthPrice();

  const serializedWallets = wallets.map(w => `${w.address}:${w.walletClientType}`).join(',');
  const serializedHolders = holders.map(h => `${h.wallet_address}:${h.full_name}`).join(',');

  const [activeWallet, setActiveWallet] = useState<string | null>(null);
  const [claimableBalance, setClaimableBalance] = useState<string>('0.0');
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [claimedDemoTotal, setClaimedDemoTotal] = useState(0);

  const determineWallet = useCallback(() => {
    if (isDemoMode) {
      const storedDemo = localStorage.getItem('active_demo_wallet');
      if (storedDemo) return storedDemo;
    }

    const matchingHolder = holders.find(
      h => h.email?.toLowerCase() === user?.email?.toLowerCase()
    );

    if (matchingHolder?.wallet_address) {
      return matchingHolder.wallet_address;
    }

    if (isDemoMode) {
      return '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
    }

    // Prefer the user's own wallet from their profile first
    if (user?.wallet_address) return user.wallet_address;
    const externalWallet = wallets.find(w => w.walletClientType !== 'privy');
    if (externalWallet) return externalWallet.address;
    const embeddedWallet = wallets.find(w => w.walletClientType === 'privy');
    if (embeddedWallet) return embeddedWallet.address;
    // Fallback to ADMIN_LIVE_ADDRESS only if no personal wallet found
    const isAdmin = user?.role === 'admin';
    if (isAdmin && ADMIN_LIVE_ADDRESS) return ADMIN_LIVE_ADDRESS;
    return wallets[0]?.address || null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemoMode, user?.id, user?.wallet_address, user?.role, serializedWallets, serializedHolders]);

  useEffect(() => {
    const updateWallet = () => setActiveWallet(determineWallet());
    updateWallet();

    window.addEventListener('demo-wallet-changed', updateWallet);
    window.addEventListener('demo-mode-changed', updateWallet);
    return () => {
      window.removeEventListener('demo-wallet-changed', updateWallet);
      window.removeEventListener('demo-mode-changed', updateWallet);
    };
  }, [determineWallet]);

  useEffect(() => {
    if (!isDemoMode || !activeWallet) {
      setClaimedDemoTotal(0);
      return;
    }

    const rawClaimed = localStorage.getItem(demoClaimStorageKey(activeWallet));
    setClaimedDemoTotal(Number(rawClaimed || 0));
  }, [activeWallet, isDemoMode]);

  const fetchClaimableBalance = useCallback(async () => {
    if (!activeWallet) return;
    if (isDemoMode) return;

    setIsLoadingBalance(true);
    try {
      const bal = await getAccruedBalanceEth(activeWallet);
      setClaimableBalance(bal);
    } catch {
      setClaimableBalance('0.0');
    } finally {
      setIsLoadingBalance(false);
    }
  }, [activeWallet, getAccruedBalanceEth, isDemoMode]);

  useEffect(() => {
    fetchClaimableBalance();
    window.addEventListener('payment-recorded', fetchClaimableBalance);
    return () => window.removeEventListener('payment-recorded', fetchClaimableBalance);
  }, [fetchClaimableBalance]);

  // Fetch transactions for this wallet
  const fetchTransactions = useCallback(async () => {
    try {
      const data: Transaction[] = await dedupeJsonFetch(
        `revenue:myearnings:${isDemoMode}`,
        `/api/revenue?demo=${isDemoMode}`
      );
      setTransactions(data || []);
    } catch {
      setTransactions([]);
    }
  }, [isDemoMode]);

  useEffect(() => {
    fetchTransactions();
    window.addEventListener('payment-recorded', fetchTransactions);
    return () => window.removeEventListener('payment-recorded', fetchTransactions);
  }, [fetchTransactions]);

  // Find this wallet in holders
  const myHoldings = holders.filter(
    h => h.wallet_address.toLowerCase() === activeWallet?.toLowerCase()
  );

  const myName = myHoldings[0]?.full_name || 'Your Account';
  const myRole = myHoldings[0]?.role || 'Wallet';
  const myPercentage = myHoldings.reduce((s, h) => s + h.percentage, 0);

  // Find all splits matching this wallet
  const myTxs = transactions
    .filter(tx =>
      getSplits(tx).some(
        s => s.wallet_address.toLowerCase() === activeWallet?.toLowerCase()
      )
    )
    .sort((a, b) => new Date(getTransactionDate(b)).getTime() - new Date(getTransactionDate(a)).getTime());

  const totalDistributedEth = myTxs.reduce((acc, tx) => {
    const split = getSplits(tx).find(
      s => s.wallet_address.toLowerCase() === activeWallet?.toLowerCase()
    );
    return acc + (split?.amount_eth || 0);
  }, 0);

  const demoClaimableEth = Math.max(totalDistributedEth - claimedDemoTotal, 0);

  useEffect(() => {
    if (!isDemoMode) return;
    setClaimableBalance(demoClaimableEth.toFixed(8));
  }, [demoClaimableEth, isDemoMode]);

  const handleClaim = async () => {
    if (parseFloat(claimableBalance) <= 0) {
      return toast.error('No accrued earnings to claim');
    }
    setIsClaiming(true);
    const tid = toast.loading('Claiming your earnings...');
    try {
      if (isDemoMode && activeWallet) {
        // Execute smart contract claim if connected to MetaMask on localhost Hardhat network
        try {
          await claimRevenue();
        } catch (contractErr) {
          console.warn('Smart contract claim transaction skipped or failed in demo mode:', contractErr);
        }
        localStorage.setItem(demoClaimStorageKey(activeWallet), totalDistributedEth.toFixed(8));
        setClaimedDemoTotal(totalDistributedEth);
      } else {
        await claimRevenue();
      }
      toast.success('Claimed successfully!', { id: tid });
      fetchClaimableBalance();
    } catch (e: any) {
      toast.error(e.message || 'Claim failed', { id: tid });
    } finally {
      setIsClaiming(false);
    }
  };

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const hasClaimable = parseFloat(claimableBalance) > 0;

  return (
    <div className="space-y-6">
      {/* Nudge banner */}
      <AnimatePresence>
        {hasClaimable && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-5 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 to-transparent pointer-events-none" />
            <div className="flex items-start gap-4 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                <span className="text-xl">💰</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-emerald-400 uppercase tracking-wider">Unclaimed Earnings</p>
                <p className="text-xs text-gray-400 mt-1">
                  You have <span className="text-emerald-400 font-bold">{parseFloat(claimableBalance).toFixed(4)} ETH</span> ({formatUSD(parseFloat(claimableBalance) * ethPrice)}) ready to claim.
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleClaim}
                    disabled={isClaiming}
                    className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-black rounded-xl hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                  >
                    {isClaiming ? 'Claiming...' : 'Claim Now'}
                  </button>
                  <button
                    onClick={fetchClaimableBalance}
                    disabled={isLoadingBalance}
                    className="px-3 py-2 bg-white/5 border border-white/10 text-gray-400 text-xs font-bold rounded-xl hover:text-white transition-all"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wallet Info Card */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden relative">
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="p-6 relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-black text-white">My Earnings</h2>
              <p className="text-xs text-gray-500 mt-0.5">Your personal revenue dashboard</p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isDemoMode ? 'bg-amber-400' : 'bg-emerald-400'}`} />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                {isDemoMode ? 'Demo Mode' : 'Live Mode'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-indigo-300 font-black border border-indigo-500/10">
              {myName.charAt(0) || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-white truncate">{myName}</p>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {myRole}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-[11px] font-mono text-gray-500 truncate">{activeWallet || 'Unknown'}</p>
                {activeWallet && (
                  <button onClick={() => copyAddress(activeWallet)} className="text-gray-500 hover:text-gray-300 transition-colors shrink-0">
                    {copied ? (
                      <span className="text-[9px] text-emerald-500 font-bold">Copied!</span>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Claimable Balance</p>
          <div className="flex items-baseline gap-2">
            <p className={`text-2xl font-black font-mono tracking-tight ${hasClaimable ? 'text-emerald-400' : 'text-gray-400'}`}>
              {parseFloat(claimableBalance).toFixed(4)}
            </p>
            <span className="text-sm font-bold text-gray-500">ETH</span>
          </div>
          <p className="text-xs text-gray-600 mt-0.5">≈ {formatUSD(parseFloat(claimableBalance) * ethPrice)}</p>
          <button
            onClick={fetchClaimableBalance}
            disabled={isLoadingBalance}
            className="mt-3 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
          >
            <svg className={`w-3 h-3 ${isLoadingBalance ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12" />
            </svg>
            Refresh
          </button>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-t from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Distributed to You</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-purple-400 font-mono tracking-tight">
              {totalDistributedEth.toFixed(4)}
            </p>
            <span className="text-sm font-bold text-gray-500">ETH</span>
          </div>
          <p className="text-xs text-gray-600 mt-0.5">≈ {formatUSD(totalDistributedEth * ethPrice)}</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Revenue Share</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-cyan-400 font-mono tracking-tight">{myPercentage.toFixed(1)}</p>
            <span className="text-sm font-bold text-gray-500">%</span>
          </div>
          <p className="text-xs text-gray-600 mt-0.5">{myTxs.length} transaction{myTxs.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Claim button (if not already shown in nudge) */}
      {!hasClaimable && parseFloat(claimableBalance) > 0 && (
        <div className="flex justify-center">
          <button
            onClick={handleClaim}
            disabled={isClaiming}
            className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-black rounded-xl hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20"
          >
            {isClaiming ? 'Claiming...' : `Claim ${parseFloat(claimableBalance).toFixed(4)} ETH`}
          </button>
        </div>
      )}

      {/* Transaction History */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden relative">
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="p-6 border-b border-white/10 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-indigo-500 rounded-full" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Transaction History</h3>
            </div>
            <span className="text-[10px] text-gray-500 font-bold">{myTxs.length} total</span>
          </div>
        </div>

        {myTxs.length === 0 ? (
          <div className="p-12 text-center relative z-10">
            <div className="text-4xl mb-3 opacity-50">📭</div>
            <p className="text-gray-400 font-medium">No transactions yet</p>
            <p className="text-gray-600 text-xs mt-1">Your earnings will appear here once revenue is distributed</p>
          </div>
        ) : (
          <div className="relative z-10">
            <div className="grid grid-cols-12 gap-2 px-6 py-3 text-[9px] font-bold text-gray-500 uppercase tracking-widest border-b border-white/5 bg-white/[0.02]">
              <div className="col-span-3">Date</div>
              <div className="col-span-3">Source</div>
              <div className="col-span-2 text-right">Share</div>
              <div className="col-span-2 text-right">Amount</div>
              <div className="col-span-2 text-right">Value</div>
            </div>
            <AnimatePresence>
              {myTxs.map((tx, idx) => {
                const split = getSplits(tx).find(
                  s => s.wallet_address.toLowerCase() === activeWallet?.toLowerCase()
                );
                if (!split) return null;
                const txDate = getTransactionDate(tx);
                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="grid grid-cols-12 gap-2 items-center px-6 py-3 border-b border-white/5 hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="col-span-3">
                      <p className="text-xs text-gray-300 font-medium">
                        {new Date(txDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-[10px] text-gray-600">
                        {new Date(txDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="col-span-3">
                      <p className="text-xs text-gray-300 font-medium">{split.role}</p>
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${
                        tx.status === 'confirmed' ? 'text-emerald-500' : tx.status === 'pending' ? 'text-amber-500' : 'text-rose-500'
                      }`}>
                        {tx.status}
                      </span>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="text-xs text-indigo-400 font-black font-mono">{split.percentage}%</span>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="text-xs text-white font-bold font-mono">{split.amount_eth.toFixed(4)}</span>
                      <p className="text-[9px] text-gray-600">ETH</p>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="text-xs text-emerald-400 font-black font-mono">
                        {formatUSD(split.amount_eth * ethPrice)}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Tip card */}
      <div className="bg-gradient-to-br from-indigo-500/[0.03] to-purple-500/[0.03] border border-indigo-500/10 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
            <span className="text-sm">💡</span>
          </div>
          <div>
            <p className="text-xs font-bold text-indigo-400">Pull-Payment Pattern</p>
            <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
              Your earnings are held securely in the smart contract until you claim them. 
              There&apos;s no time limit — claim whenever you want. Each claim transfers 
              your full accrued balance to your wallet in a single transaction.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
