'use client';
import React, { useState } from 'react';

const formatUSD = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(amount || 0));

export const RightsHolderRow = ({ holder, transactions }) => {
  const [expanded, setExpanded] = useState(false);

  // Find all splits for this holder across all transactions
  const userPayments = [];
  transactions?.forEach(tx => {
    const split = tx.transaction_splits?.find(s => s.name === holder.name);
    if (split) {
      userPayments.push({
        date: tx.created_at,
        tx_hash: tx.tx_hash,
        project_id: tx.project_id,
        amount: split.amount_eth
      });
    }
  });

  return (
    <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden transition-all duration-300">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/[0.03]"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-sm font-bold text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
            {holder.name?.charAt(0)}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black text-white leading-none">{holder.name}</span>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[9px] text-gray-500 uppercase font-black tracking-[0.1em]">{holder.role}</span>
              {holder.project_name && (
                <span className="text-[8px] bg-white/10 text-gray-400 px-1.5 py-0.5 rounded-md font-black uppercase tracking-tighter">
                  {holder.project_name}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right flex items-center gap-6">
          <div className="hidden md:block">
            <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest mb-0.5">Allocation</p>
            <span className="font-mono text-indigo-400 font-black text-lg">{holder.percentage}%</span>
          </div>
          <div className="hidden lg:block w-[1px] h-8 bg-white/5 mx-2" />
          <div className="min-w-[100px]">
            <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest mb-0.5">Total Payout</p>
            <span className="text-sm font-black text-white">{formatUSD(holder.total_received)}</span>
          </div>
          <div className={`p-2 rounded-xl transition-colors ${expanded ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-gray-600 hover:text-gray-400'}`}>
            <svg className={`w-4 h-4 transform transition-transform duration-500 ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-white/5 bg-black/40 p-6 space-y-6">
          {/* Profile Header Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Status</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Active</span>
              </div>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Contract Share</p>
              <p className="text-sm font-black text-indigo-400">{holder.percentage}% Fixed</p>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Project</p>
              <p className="text-sm font-black text-white truncate">{holder.project_name || 'Project X'}</p>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Join Date</p>
              <p className="text-sm font-black text-white">Oct 2023</p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left: Metadata */}
            <div className="flex-1 space-y-4">
              <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1 h-3 bg-indigo-500 rounded-full" />
                Registry Details
              </h4>
              <div className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-3">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-xs text-gray-500 font-bold uppercase">Wallet Address</span>
                  <span className="text-xs font-mono text-gray-300">{holder.wallet_address || '0x...'}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-xs text-gray-500 font-bold uppercase">Email</span>
                  <span className="text-xs text-gray-300">{holder.name?.toLowerCase().replace(' ', '.')}@moonstone.io</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 font-bold uppercase">Auth Level</span>
                  <span className="text-xs font-bold text-amber-500 uppercase">Verified Creator</span>
                </div>
              </div>
            </div>

            {/* Right: Payment History Dropdown */}
            <div className="flex-[1.5] space-y-4">
              <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1 h-3 bg-emerald-500 rounded-full" />
                Payment Ledger ({userPayments.length})
              </h4>
              {userPayments.length === 0 ? (
                <div className="bg-white/5 p-8 rounded-2xl border border-white/5 text-center">
                  <p className="text-sm text-gray-500 italic">No distribution records found for this period.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {userPayments.map((p, i) => (
                    <div key={i} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5 hover:bg-white/[0.08] transition-colors group/row">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div>
                          <p className="text-xs text-white font-bold">{new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                          <p className="text-[9px] font-mono text-gray-500 tracking-tight">{p.tx_hash ? `${p.tx_hash.substring(0,24)}...` : '—'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-emerald-400">+{formatUSD(p.amount)}</p>
                        <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Confirmed</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
