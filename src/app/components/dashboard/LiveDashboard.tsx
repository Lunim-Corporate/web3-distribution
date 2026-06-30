'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useEthPrice } from '@/app/lib/useEthPrice';
import { useRevenueSplitter } from '@/lib/web3';
import { NetworkBadge } from '@/components/ui/NetworkBadge';
import { readDemoMode, isDemoAccessEnabled } from '@/app/lib/demoAccess';

/* ─── Types ───────────────────────────────────────────────── */
interface RightsHolder {
  id: string;
  full_name: string;
  role: string;
  wallet_address: string;
  percentage: number;
}

interface DistributionRecord {
  id: string;
  tx_hash: string;
  total_amount_eth: number;
  created_at: string;
  sender_address: string;
  status: string;
}

/* ─── Helpers ─────────────────────────────────────────────── */
const trunc = (addr: string) => addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '';
const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

/* ═══════════════════════════════════════════════════════════
   LiveDashboard Component
   ═══════════════════════════════════════════════════════════ */
export function LiveDashboard({
  projectId,
  holders,
}: {
  projectId: string;
  holders: RightsHolder[];
}) {
  const {
    getContractBalanceEth,
    getHolderClaimStatuses,
  } = useRevenueSplitter();
  const { formatEthAsUsd } = useEthPrice();

  // Mode
  const [isDemoMode, setIsDemoMode] = useState(false);
  useEffect(() => {
    setIsDemoMode(readDemoMode());
    const handler = (e: CustomEvent) => setIsDemoMode(isDemoAccessEnabled && e.detail);
    window.addEventListener('demo-mode-changed', handler as EventListener);
    return () => window.removeEventListener('demo-mode-changed', handler as EventListener);
  }, []);

  // State
  const [contractBalance, setContractBalance] = useState('0.0');
  const [claimStatuses, setClaimStatuses] = useState<{ address: string; accruedEth: string; hasPending: boolean }[]>([]);
  const [distributions, setDistributions] = useState<DistributionRecord[]>([]);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [totalLifetimeEth, setTotalLifetimeEth] = useState(0);

  /* ── Fetch contract balance ─────────────────────────────── */
  const fetchBalance = useCallback(async () => {
    setIsLoadingBalance(true);
    try {
      const bal = await getContractBalanceEth();
      setContractBalance(bal);
    } catch {
      setContractBalance('0.0');
    } finally {
      setIsLoadingBalance(false);
    }
  }, [getContractBalanceEth]);

  /* ── Fetch claim statuses ───────────────────────────────── */
  const fetchClaimStatuses = useCallback(async () => {
    if (holders.length === 0) return;
    try {
      const statuses = await getHolderClaimStatuses(holders.map(h => h.wallet_address));
      setClaimStatuses(statuses);
    } catch (err) {
      console.error('Failed to fetch claim statuses:', err);
    }
  }, [holders, getHolderClaimStatuses]);

  /* ── Fetch distribution history ─────────────────────────── */
  const fetchHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`/api/revenue?project_id=${projectId}&demo=${isDemoMode}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        const txList: DistributionRecord[] = data.transactions || [];
        setDistributions(txList);
        const lifetime = txList.reduce((sum: number, tx: DistributionRecord) => sum + (tx.total_amount_eth || 0), 0);
        setTotalLifetimeEth(lifetime);
      }
    } catch (err) {
      console.error('Failed to fetch distribution history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [projectId, isDemoMode]);

  /* ── Initial + periodic refresh ─────────────────────────── */
  useEffect(() => {
    fetchBalance();
    fetchClaimStatuses();
    fetchHistory();

    // Refresh balance every 30 seconds
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, [fetchBalance, fetchClaimStatuses, fetchHistory]);

  // Listen for payment-recorded events
  useEffect(() => {
    const onPayment = () => {
      fetchBalance();
      fetchClaimStatuses();
      fetchHistory();
    };
    window.addEventListener('payment-recorded', onPayment);
    return () => window.removeEventListener('payment-recorded', onPayment);
  }, [fetchBalance, fetchClaimStatuses, fetchHistory]);

  const pendingCount = claimStatuses.filter(s => s.hasPending).length;
  const totalPendingEth = claimStatuses.reduce((sum, s) => sum + parseFloat(s.accruedEth || '0'), 0);
  const contractBalFloat = parseFloat(contractBalance) || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">
            {isDemoMode ? 'Demo Dashboard' : 'Live Dashboard'}
          </h2>
          <p className="text-gray-400 mt-1 text-sm font-medium">
            Real-time contract state and distribution history.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <NetworkBadge isDemoMode={isDemoMode} />
          <button
            onClick={() => { fetchBalance(); fetchClaimStatuses(); fetchHistory(); }}
            className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-black text-gray-400 hover:text-white transition-colors uppercase tracking-widest"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Contract Balance */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-300"
        >
          <div className="absolute -top-8 -right-8 w-16 h-16 bg-indigo-500/20 rounded-full blur-[40px] group-hover:bg-indigo-500/30 transition-all" />
          <div className="relative z-10">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Contract Balance</p>
            <p className="text-2xl font-black text-white font-mono mt-2">
              {isLoadingBalance ? (
                <span className="inline-block w-20 h-6 bg-white/10 rounded animate-pulse" />
              ) : (
                `${contractBalFloat.toFixed(4)} Ξ`
              )}
            </p>
            <p className="text-xs text-indigo-400 font-bold mt-1">{formatEthAsUsd(contractBalFloat)}</p>
            <p className="text-[9px] text-gray-600 mt-2">Auto-refreshes every 30s</p>
          </div>
        </motion.div>

        {/* Pending Claims */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden group hover:border-amber-500/30 transition-all duration-300"
        >
          <div className="absolute -top-8 -right-8 w-16 h-16 bg-amber-500/20 rounded-full blur-[40px]" />
          <div className="relative z-10">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Pending Claims</p>
            <p className="text-2xl font-black text-amber-400 font-mono mt-2">
              {pendingCount}/{holders.length}
            </p>
            <p className="text-xs text-gray-400 font-bold mt-1">{totalPendingEth.toFixed(6)} ETH unclaimed</p>
            <p className="text-[9px] text-gray-600 mt-2">{formatEthAsUsd(totalPendingEth)} value</p>
          </div>
        </motion.div>

        {/* Total Distributions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300"
        >
          <div className="absolute -top-8 -right-8 w-16 h-16 bg-emerald-500/20 rounded-full blur-[40px]" />
          <div className="relative z-10">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Lifetime Distributed</p>
            <p className="text-2xl font-black text-emerald-400 font-mono mt-2">{totalLifetimeEth.toFixed(4)} Ξ</p>
            <p className="text-xs text-gray-400 font-bold mt-1">{formatEthAsUsd(totalLifetimeEth)}</p>
            <p className="text-[9px] text-gray-600 mt-2">{distributions.length} transactions</p>
          </div>
        </motion.div>

        {/* Network Status */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden group hover:border-purple-500/30 transition-all duration-300"
        >
          <div className="absolute -top-8 -right-8 w-16 h-16 bg-purple-500/20 rounded-full blur-[40px]" />
          <div className="relative z-10">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Network</p>
            <p className="text-lg font-black text-white mt-2">
              {isDemoMode ? 'Demo Mode' : (process.env.NEXT_PUBLIC_CHAIN_ID === '8453' ? 'Base Mainnet' : 'Base Sepolia')}
            </p>
            {!isDemoMode && process.env.NEXT_PUBLIC_CHAIN_ID !== '8453' && (
              <a
                href="https://www.alchemy.com/faucets/base-sepolia"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] font-black text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest mt-2"
              >
                Get Test ETH ↗
              </a>
            )}
          </div>
        </motion.div>
      </div>

      {/* Holder Claim Status */}
      {holders.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 backdrop-blur-xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Holder Claim Status</h3>
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{pendingCount} pending</span>
          </div>
          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin">
            {holders.map(h => {
              const status = claimStatuses.find(s => s.address.toLowerCase() === h.wallet_address.toLowerCase());
              const accrued = parseFloat(status?.accruedEth || '0');
              const hasPending = accrued > 0;

              return (
                <div key={h.id} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl hover:bg-white/[0.04] transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black border transition-colors ${
                      hasPending
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    }`}>
                      {h.full_name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{h.full_name}</p>
                      <p className="text-[10px] text-gray-500 font-mono">{trunc(h.wallet_address)}</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <div>
                      <p className="text-sm font-black text-white">{h.percentage}%</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">{h.role}</p>
                    </div>
                    <div className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                      hasPending
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {hasPending ? `${accrued.toFixed(4)} ETH` : 'Claimed'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Distribution History */}
      <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 backdrop-blur-xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Distribution History</h3>
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{distributions.length} records</span>
        </div>

        {isLoadingHistory ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : distributions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-xs font-black uppercase tracking-widest">No distributions yet</p>
            <p className="text-gray-600 text-[10px] mt-1">Use the Distribution Wizard to create your first one.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
            {distributions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl hover:bg-white/[0.04] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white font-mono">{(tx.total_amount_eth || 0).toFixed(4)} ETH</p>
                    <p className="text-[10px] text-gray-500">{timeAgo(tx.created_at)} · {trunc(tx.tx_hash || '')}</p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-3">
                  <p className="text-xs text-indigo-400 font-bold">{formatEthAsUsd(tx.total_amount_eth || 0)}</p>
                  <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                    tx.status === 'confirmed'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : tx.status === 'pending'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                  }`}>
                    {tx.status || 'confirmed'}
                  </div>
                  {!isDemoMode && tx.tx_hash && tx.tx_hash.startsWith('0x') && !tx.tx_hash.includes('demo') && (
                    <a
                      href={`https://sepolia.basescan.org/tx/${tx.tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 transition-colors"
                      title="View on BaseScan"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
