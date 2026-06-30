'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDate } from '@/lib/utils';
import { useEthPrice } from '@/app/lib/useEthPrice';

interface Split {
  id: string;
  full_name: string;
  role: string;
  percentage: number;
  amount_eth: number;
  wallet_address: string;
}

interface Transaction {
  id: string;
  created_at: string;
  tx_hash: string;
  sender_address: string;
  total_amount_eth: number;
  method: string;
  status: string;
  transaction_splits?: Split[];
}

interface TransactionHistoryProps {
  projectId: string;
  isDemoMode: boolean;
}

export function TransactionHistory({ projectId, isDemoMode }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { formatEthAsUsd } = useEthPrice();

  const fetchHistory = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/payments?project_id=${projectId}&demo=${isDemoMode}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        // The API returns transactions mapped to payments structure. Let's see:
        // Wait, let's query transactions with splits if possible.
        // Let's call /api/dashboard with pid and get transactions.
        const dashRes = await fetch(`/api/dashboard?pid=${projectId}&demo=${isDemoMode}`, { cache: 'no-store' });
        if (dashRes.ok) {
          const dashData = await dashRes.json();
          if (dashData.transactions) {
            setTransactions(dashData.transactions);
          }
        } else if (data.payments) {
          setTransactions(data.payments);
        }
      }
    } catch (e) {
      console.error('Failed to fetch transaction history:', e);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, isDemoMode]);

  useEffect(() => {
    fetchHistory();

    const onPaymentRecorded = () => {
      fetchHistory();
    };

    window.addEventListener('payment-recorded', onPaymentRecorded);
    
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('lunim-realtime');
      bc.onmessage = (ev) => {
        if (ev.data?.type === 'payment-recorded') {
          fetchHistory();
        }
      };
    } catch (e) {
      // BroadcastChannel not supported in some sandboxes
    }

    return () => {
      window.removeEventListener('payment-recorded', onPaymentRecorded);
      if (bc) bc.close();
    };
  }, [fetchHistory]);

  const toggleExpand = (id: string) => {
    setExpandedTxId(expandedTxId === id ? null : id);
  };

  const trunc = (addr: string) => addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '';

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-4">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <h2 className="text-lg font-black text-white">Transaction Ledger History</h2>
          <p className="text-xs text-gray-500 mt-0.5">Real-time ledger receipts from database and smart contract events</p>
        </div>
        <button 
          onClick={fetchHistory}
          disabled={isLoading}
          className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg text-gray-300 font-bold transition-all disabled:opacity-50"
        >
          {isLoading ? 'Syncing...' : '🔄 Sync Ledger'}
        </button>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-3">📑</div>
          <p className="font-medium">No transactions recorded yet</p>
          <p className="text-xs mt-1">Simulate a distribution to update the on-chain ledger history.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
          {transactions.map((tx) => {
            const isExpanded = expandedTxId === tx.id;
            const txDate = tx.created_at ? formatDate(tx.created_at) : 'Unknown Date';
            
            return (
              <div 
                key={tx.id} 
                className="bg-white/3 border border-white/5 rounded-xl overflow-hidden hover:border-white/10 transition-all"
              >
                {/* Header row */}
                <div 
                  onClick={() => toggleExpand(tx.id)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-all gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold border ${
                      tx.method === 'manual'
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                        : tx.method === 'web3'
                        ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    }`}>
                      {tx.method === 'manual' ? '✍️' : tx.method === 'web3' ? '🔗' : '⚡'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">
                          {tx.method === 'manual' ? 'Manual Ledger Record' : 'Contract Split Distribution'}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono tracking-widest bg-white/5 px-1.5 py-0.5 rounded uppercase">
                          {tx.method}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 font-mono">{txDate}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6">
                    <div className="text-left sm:text-right">
                      <p className="text-sm font-black text-white font-mono">{(tx.total_amount_eth || 0).toFixed(4)} ETH</p>
                      <p className="text-xs text-gray-500 font-mono">≈ {formatEthAsUsd(tx.total_amount_eth || 0)}</p>
                    </div>
                    <span className="text-gray-400 text-xs shrink-0 select-none">
                      {isExpanded ? '▲' : '▼'}
                    </span>
                  </div>
                </div>

                {/* Expanded content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="border-t border-white/5 bg-white/2 p-4 space-y-4"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="text-gray-500 uppercase tracking-wider font-bold text-[10px]">Transaction Hash</p>
                          {tx.tx_hash.startsWith('0x') ? (
                            <a 
                              href={`https://sepolia.basescan.org/tx/${tx.tx_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-400 font-mono break-all hover:underline"
                            >
                              {tx.tx_hash} ↗
                            </a>
                          ) : (
                            <span className="text-gray-400 font-mono break-all">{tx.tx_hash}</span>
                          )}
                        </div>
                        <div>
                          <p className="text-gray-500 uppercase tracking-wider font-bold text-[10px]">Sender Address</p>
                          <span className="text-gray-300 font-mono break-all" title={tx.sender_address}>
                            {trunc(tx.sender_address)}
                          </span>
                        </div>
                      </div>

                      {tx.transaction_splits && tx.transaction_splits.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-gray-500 uppercase tracking-wider font-bold text-[10px]">Recipients & Share Splits</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {tx.transaction_splits.map((split: any) => (
                              <div 
                                key={split.id}
                                className="flex items-center justify-between p-2.5 bg-slate-950/40 rounded-lg border border-white/5"
                              >
                                <div className="min-w-0 pr-2">
                                  <p className="font-bold text-white text-xs truncate">{split.full_name}</p>
                                  <p className="text-[10px] text-gray-500 truncate">{split.role}</p>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-xs font-mono font-bold text-emerald-400">+{Number(split.amount_eth).toFixed(4)} ETH</p>
                                  <p className="text-[10px] text-gray-500 font-mono">{split.percentage}% share</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
