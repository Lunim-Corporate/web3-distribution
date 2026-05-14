'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const formatUSD = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);

const HOLDER_COLORS = [
  { gradient: 'from-violet-500 to-purple-600', bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20' },
  { gradient: 'from-cyan-500 to-blue-600', bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
  { gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  { gradient: 'from-amber-500 to-orange-600', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  { gradient: 'from-rose-500 to-pink-600', bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
  { gradient: 'from-indigo-500 to-blue-600', bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' },
];

interface RightsHolder {
  id: string;
  name: string;
  role: string;
  percentage: number;
  wallet_address?: string;
  total_received?: number;
}

interface DistributeRevenuePanelProps {
  isConnected: boolean;
  walletAddress: string;
  sendRevenue: (amount: any) => Promise<void> | void;
  txStatus: string;
  lastTxHash: string;
  errorMessage: string;
  rightsHolders: RightsHolder[];
  distributeAmount: any;
  setDistributeAmount: (val: any) => void;
  isDemoMode: boolean;
  project: any;
  projectsList: any[];
  onProjectChange: (projectId: string) => void;
}

const ETH_USD_RATE = 3500;

const DistributeRevenuePanel: React.FC<DistributeRevenuePanelProps> = ({
  isConnected,
  walletAddress,
  sendRevenue,
  txStatus,
  lastTxHash,
  errorMessage,
  rightsHolders,
  distributeAmount,
  setDistributeAmount,
  isDemoMode,
  project,
  projectsList,
  onProjectChange,
}) => {
  const [confirmedAnimation, setConfirmedAnimation] = useState(false);
  const [recentDistributions, setRecentDistributions] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const projectId = project?.id && project.id !== 'all' ? project.id : null;
  const isProjectSelected = !!projectId;
  const totalPct = rightsHolders.reduce((s, h) => s + Number(h.percentage || 0), 0);
  const amountUSD = Number(distributeAmount || 0) * ETH_USD_RATE;

  // Play success animation when tx confirms
  useEffect(() => {
    if (txStatus === 'confirmed') {
      setConfirmedAnimation(true);
      const t = setTimeout(() => setConfirmedAnimation(false), 4000);
      return () => clearTimeout(t);
    }
  }, [txStatus]);

  // Load distribution history for this project
  const fetchHistory = useCallback(async () => {
    if (!projectId) return;
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/revenue?projectId=${projectId}`);
      if (res.ok) {
        const json = await res.json();
        // The revenue API returns { revenue: [...] } — deduplicate by tx_hash
        const raw = Array.isArray(json) ? json : (json.revenue || []);
        // Filter to this project and deduplicate by tx_hash
        const seen = new Set<string>();
        const deduped = raw
          .filter((p: any) => p.projectId === projectId || !projectId)
          .filter((p: any) => {
            const key = p.txHash || p.id;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          })
          .slice(0, 5)
          .map((p: any) => ({
            id: p.id,
            source: p.source,
            date: p.date,
            amount: p.amount,
            txHash: p.txHash,
          }));
        setRecentDistributions(deduped);
      }
    } catch { /* silent */ } finally {
      setLoadingHistory(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Refresh history after confirmed tx
  useEffect(() => {
    if (txStatus === 'confirmed') {
      setTimeout(fetchHistory, 1500);
    }
  }, [txStatus, fetchHistory]);

  const handleDistribute = async () => {
    if (!isProjectSelected) {
      toast.error('Select a specific project first');
      return;
    }
    if (!distributeAmount || Number(distributeAmount) <= 0) {
      toast.error('Enter a valid ETH amount');
      return;
    }
    if (!isConnected) {
      toast.error('Connect your wallet first');
      return;
    }
    await sendRevenue(distributeAmount);
  };

  return (
    <div className="space-y-6">

      {/* ── Project Lock Banner ────────────────────────────────── */}
      {!isProjectSelected && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 flex items-start gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-xl">🔒</span>
          </div>
          <div>
            <p className="text-sm font-black text-amber-400 mb-1">Project Required</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Revenue distribution is project-scoped. Each project maintains its own 100% split configuration.
              Select a project from the top dropdown to unlock distribution.
            </p>
          </div>
        </motion.div>
      )}

      {/* ── Main Distribute Card ───────────────────────────────── */}
      <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden relative shadow-2xl">

        {/* Ambient gradient */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-indigo-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-emerald-500/8 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-white/10 relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                  {isDemoMode ? 'Demo Mode · Simulated Blockchain' : 'Live Mode · Base Sepolia'}
                </span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                {isProjectSelected ? project?.name || 'Project' : 'Distribution Hub'}
              </h2>
              {isProjectSelected && (
                <p className="text-xs text-gray-500 mt-1 font-medium">
                  {rightsHolders.length} rights holders · {totalPct.toFixed(1)}% allocated
                </p>
              )}
            </div>

            {/* Wallet Status */}
            {isConnected ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                <div className="w-2 h-2 bg-rose-400 rounded-full" />
                <span className="text-[10px] font-black text-rose-400 uppercase tracking-wider">
                  Wallet Disconnected
                </span>
              </div>
            )}
          </div>
        </div>

        <div className={`p-8 relative z-10 ${!isProjectSelected ? 'opacity-40 pointer-events-none select-none' : ''}`}>

          {/* Amount Input */}
          <div className="mb-6">
            <label className="flex items-center justify-between text-[10px] font-black text-gray-500 uppercase tracking-[0.15em] mb-3">
              <span>Revenue Amount</span>
              <span className="text-indigo-400 normal-case font-bold">1 ETH ≈ $3,500 USD</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                <span className="text-2xl text-gray-500 font-bold">Ξ</span>
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                value={distributeAmount}
                onChange={(e) => setDistributeAmount(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-12 pr-6 text-3xl font-mono font-black text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder-gray-700 outline-none"
                placeholder="0.5"
              />
            </div>
            {amountUSD > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 flex items-center justify-end gap-2"
              >
                <span className="text-xs text-gray-500">≈</span>
                <span className="text-sm font-black text-indigo-400">{formatUSD(amountUSD)}</span>
                <span className="text-xs text-gray-600">will be distributed</span>
              </motion.div>
            )}
          </div>

          {/* Distribution Button */}
          <motion.button
            whileHover={isProjectSelected && isConnected && Number(distributeAmount) > 0 ? { scale: 1.01 } : {}}
            whileTap={isProjectSelected && isConnected && Number(distributeAmount) > 0 ? { scale: 0.98 } : {}}
            onClick={handleDistribute}
            disabled={!isConnected || txStatus === 'pending' || !distributeAmount || Number(distributeAmount) <= 0}
            className={`w-full py-5 rounded-2xl text-sm font-black tracking-widest uppercase transition-all ${
              txStatus === 'pending'
                ? 'bg-indigo-500/30 border border-indigo-500/30 text-white/60 cursor-wait'
                : !isConnected || !distributeAmount || Number(distributeAmount) <= 0
                ? 'bg-white/5 border border-white/5 text-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40'
            }`}
          >
            {txStatus === 'pending' ? (
              <span className="flex items-center justify-center gap-3">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing on blockchain…
              </span>
            ) : (
              `⇌ Distribute to ${rightsHolders.length || '—'} Holders`
            )}
          </motion.button>

          {/* Transaction Status */}
          <AnimatePresence>
            {txStatus !== 'idle' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className={`mt-5 p-5 rounded-2xl border ${
                  txStatus === 'confirmed'
                    ? 'bg-emerald-500/10 border-emerald-500/20'
                    : txStatus === 'pending'
                    ? 'bg-indigo-500/10 border-indigo-500/20'
                    : 'bg-red-500/10 border-red-500/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl mt-0.5">
                    {txStatus === 'confirmed' ? '✅' : txStatus === 'pending' ? '⏳' : '❌'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-black ${
                      txStatus === 'confirmed' ? 'text-emerald-400' :
                      txStatus === 'pending' ? 'text-indigo-400' : 'text-red-400'
                    }`}>
                      {txStatus === 'confirmed' ? 'Distribution Confirmed!' :
                       txStatus === 'pending' ? 'Transaction Processing…' :
                       'Transaction Failed'}
                    </p>
                    {txStatus === 'confirmed' && (
                      <p className="text-xs text-gray-400 mt-1">
                        {formatUSD(amountUSD)} distributed across {rightsHolders.length} rights holders.
                        Dashboard and charts updated.
                      </p>
                    )}
                    {txStatus === 'pending' && (
                      <div className="mt-3">
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse"
                            style={{ width: '65%' }}
                          />
                        </div>
                        <p className="text-[10px] text-gray-600 mt-1">Awaiting blockchain confirmation…</p>
                      </div>
                    )}
                    {errorMessage && <p className="text-xs text-red-400 mt-1">{errorMessage}</p>}
                    {lastTxHash && (
                      <div className="mt-2 pt-2 border-t border-white/5">
                        <span className="text-[10px] uppercase font-bold text-gray-600 mr-1">Tx:</span>
                        <span className="text-[10px] font-mono text-indigo-400 break-all">
                          {lastTxHash.slice(0, 24)}…
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Recent Distributions ───────────────────────────────── */}
      {isProjectSelected && (
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6">
          <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Recent Distributions</h3>
          {loadingHistory ? (
            <div className="flex items-center justify-center py-6">
              <div className="w-5 h-5 border-2 border-indigo-500/40 border-t-indigo-500 rounded-full animate-spin" />
            </div>
          ) : recentDistributions.length > 0 ? (
            <div className="space-y-2">
              {recentDistributions.map((d, i) => (
                <div key={d.id || i} className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/5 rounded-xl hover:bg-white/[0.06] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <span className="text-xs text-emerald-400">⇌</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-200">{d.source || 'Distribution'}</p>
                      <p className="text-[10px] text-gray-600">
                        {d.date ? new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black font-mono text-white">{formatUSD(d.amount || 0)}</p>
                    <span className="text-[10px] font-bold text-emerald-400">Completed</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center opacity-40">
              <div className="text-3xl mb-2">📭</div>
              <p className="text-xs text-gray-500">No distributions yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DistributeRevenuePanel;
