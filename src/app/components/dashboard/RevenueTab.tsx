'use client';
import React, { useMemo, useState } from 'react';

type RevenueSplit = {
  id?: string;
  name?: string;
  role?: string;
  percentage?: number;
  amount_eth?: number;
};

type RevenueTransaction = {
  id: string;
  tx_hash?: string;
  created_at?: string;
  status?: string;
  source?: string;
  project_id?: string;
  total_amount?: number;
  transaction_splits?: RevenueSplit[];
};

type RevenueProject = {
  id: string;
  name: string;
};

type RevenueTabProps = {
  transactions: RevenueTransaction[];
  totalRevenue: number;
  projectsList?: RevenueProject[];
  activeProjectId?: string | null;
};

const formatUSD = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(amount || 0));

export const RevenueTab = ({ transactions, totalRevenue, projectsList, activeProjectId }: RevenueTabProps) => {
  const [expandedTx, setExpandedTx] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [holderFilter, setHolderFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');

  const getProjectName = (id?: string) => {
    const p = projectsList?.find(proj => proj.id === id);
    return p ? p.name : 'Unknown';
  };

  const holderOptions = useMemo(() => {
    const names = new Set<string>();
    transactions.forEach((tx) => {
      tx.transaction_splits?.forEach((split) => {
        if (split.name) names.add(split.name);
      });
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    const now = Date.now();
    const search = query.trim().toLowerCase();

    return transactions.filter((tx) => {
      if (activeProjectId && tx.project_id !== activeProjectId) return false;

      const txDate = tx.created_at ? new Date(tx.created_at).getTime() : 0;
      if (periodFilter === '30d' && now - txDate > 30 * 24 * 60 * 60 * 1000) return false;
      if (periodFilter === '90d' && now - txDate > 90 * 24 * 60 * 60 * 1000) return false;

      if (holderFilter !== 'all' && !tx.transaction_splits?.some((split) => split.name === holderFilter)) {
        return false;
      }

      if (!search) return true;
      const projectName = getProjectName(tx.project_id).toLowerCase();
      const holderNames = tx.transaction_splits?.map((split) => split.name || '').join(' ').toLowerCase() || '';
      return [
        tx.tx_hash,
        tx.source,
        tx.status,
        projectName,
        holderNames,
      ].some((value) => String(value || '').toLowerCase().includes(search));
    });
  }, [transactions, activeProjectId, periodFilter, holderFilter, query, projectsList]);

  const totalDistributed = filteredTransactions.reduce((sum, tx) => sum + Number(tx.total_amount || 0), 0);

  const selectedProjectName = activeProjectId ? getProjectName(activeProjectId) : 'All Projects';

  return (
    <div className="space-y-6">
      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Revenue</p>
          <p className="text-3xl font-black text-white tracking-tight">{formatUSD(totalRevenue || totalDistributed)}</p>
          <p className="text-[10px] text-gray-600 mt-1">{selectedProjectName}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Visible Transactions</p>
          <p className="text-3xl font-black text-white tracking-tight">{filteredTransactions.length}</p>
          <p className="text-[10px] text-gray-600 mt-1">{holderFilter === 'all' ? 'all rights holders' : holderFilter}</p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="flex flex-col md:flex-row gap-4 mb-2">
        <div className="flex-1 relative">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search transactions..." 
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors" 
          />
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-gray-300 min-w-[160px]">
          {selectedProjectName}
        </div>
        <select
          value={holderFilter}
          onChange={(e) => setHolderFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors min-w-[180px]"
        >
          <option value="all" className="bg-slate-900">All Rights Holders</option>
          {holderOptions.map((name) => (
            <option key={name} value={name} className="bg-slate-900">{name}</option>
          ))}
        </select>
        <select
          value={periodFilter}
          onChange={(e) => setPeriodFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors min-w-[160px]"
        >
          <option value="all" className="bg-slate-900">All Time</option>
          <option value="30d" className="bg-slate-900">Last 30 Days</option>
          <option value="90d" className="bg-slate-900">Last 90 Days</option>
        </select>
      </div>

      {/* Transactions Table */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Project</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Source</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Amount</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Recipients</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 text-sm">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <React.Fragment key={tx.id}>
                    <tr 
                      onClick={() => setExpandedTx(expandedTx === tx.id ? null : tx.id)}
                      className="border-b border-white/5 hover:bg-white/[0.03] transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">
                          {tx.created_at ? new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-white">
                          {getProjectName(tx.project_id)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-400">
                          {tx.source || 'Client Payment'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-white font-mono">
                          {formatUSD(tx.total_amount || 0)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-black text-indigo-300">
                          {tx.transaction_splits?.length || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full text-[10px] font-black tracking-wide capitalize bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                          {tx.status || 'completed'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-xs font-black text-gray-500 group-hover:text-indigo-300 transition-colors">
                          {expandedTx === tx.id ? 'Hide split' : 'View split'}
                        </span>
                      </td>
                    </tr>
                    {/* Dropdown content */}
                    {expandedTx === tx.id && (
                      <tr className="bg-black/20">
                        <td colSpan={7} className="px-6 py-6 border-b border-white/5">
                          <div className="mb-3 flex items-center justify-between">
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Revenue Split Distribution</h4>
                            <span className="text-xs text-gray-500 font-mono">Tx: {tx.tx_hash || '—'}</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {tx.transaction_splits && tx.transaction_splits.length > 0 ? tx.transaction_splits.map((split, idx) => (
                              <div key={split.id || `${tx.id}-${idx}`} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/[0.08] transition-all group/card">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-sm font-bold text-indigo-400 border border-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                                    {split.name?.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="font-bold text-white text-sm">{split.name}</div>
                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">{split.role}</div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-black text-white">{split.percentage}%</div>
                                  <div className="text-[10px] font-mono text-emerald-400 font-bold">
                                    {formatUSD(split.amount_eth || 0)}
                                  </div>
                                </div>
                              </div>
                            )) : (
                              <div className="col-span-full p-4 bg-white/5 rounded-2xl border border-white/5 text-sm text-gray-500">
                                No split details were recorded for this transaction.
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
