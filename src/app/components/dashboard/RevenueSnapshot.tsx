'use client';

import React, { useMemo, useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { useSplits } from '@/hooks/useSplits';

const formatUSD = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

export const RevenueSnapshot: React.FC<{ 
  activeProjectId?: string | null, 
  projectsList?: {id: string, name: string}[],
  walletAddress?: string 
}> = ({ activeProjectId, projectsList, walletAddress }) => {
  const { earnings, loading: splitsLoading } = useSplits(walletAddress);
  const isLiveWeb3 = !!walletAddress && !!earnings;

  const [projectFilter, setProjectFilter] = useState<string>(activeProjectId || '');
  
  React.useEffect(() => {
    if (activeProjectId) {
      setProjectFilter(activeProjectId);
    }
  }, [activeProjectId]);

  const [search, setSearch] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const [revenue, setRevenue] = useState<
    Array<{
      id: string;
      projectId: string;
      projectName: string;
      amount: number;
      txHash?: string;
      date: string;
      source: string;
      status: string;
      recipientName?: string;
      splitPercentage?: number;
    }>
  >([]);

  const fetchRevenue = React.useCallback(() => {
    const url = new URL('/api/revenue', window.location.origin);
    url.searchParams.set('ts', Date.now().toString());
    if (walletAddress) {
      url.searchParams.set('address', walletAddress);
      url.searchParams.set('web3', 'true');
    }

    fetch(url.toString(), { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        // Handle new response shape
        if (data.revenue) setRevenue(data.revenue);
        else setRevenue(data);
      })
      .catch(() => setRevenue([]));
  }, [walletAddress]);

  React.useEffect(() => {
    fetchRevenue();
    window.addEventListener('payment-recorded', fetchRevenue);
    return () => window.removeEventListener('payment-recorded', fetchRevenue);
  }, [fetchRevenue]);

  const filtered = useMemo(() => {
    return revenue
      .filter((r) => !projectFilter || r.projectId === projectFilter)
      .filter((r) => !search || r.projectName.toLowerCase().includes(search.toLowerCase()) || r.source.toLowerCase().includes(search.toLowerCase()))
      .filter((r) => (fromDate ? new Date(r.date) >= new Date(fromDate) : true))
      .filter((r) => (toDate ? new Date(r.date) <= new Date(toDate) : true));
  }, [revenue, projectFilter, search, fromDate, toDate]);

  // Group by tx_hash for accurate transaction count
  // Group by tx_hash for accurate transaction count and display
  const { totals, groupedTransactions } = useMemo(() => {
    const total = filtered.reduce((sum, r) => sum + r.amount, 0);
    const paid = filtered.filter((r) => r.status === 'Paid' || r.status === 'completed' || r.status === 'Confirmed').reduce((s, r) => s + r.amount, 0);
    const pending = filtered.filter((r) => r.status !== 'Paid' && r.status !== 'completed' && r.status !== 'Confirmed').reduce((s, r) => s + r.amount, 0);
    
    const txMap = new Map();
    filtered.forEach(r => {
      const hash = r.txHash || r.id; 
      if (!txMap.has(hash)) {
        txMap.set(hash, {
          id: hash,
          txHash: hash,
          date: r.date,
          projectName: r.projectName,
          source: r.source,
          status: r.status,
          totalAmount: 0,
          splits: []
        });
      }
      const tx = txMap.get(hash);
      tx.totalAmount += r.amount;
      tx.splits.push({
        id: r.id,
        recipientName: r.recipientName || 'Unknown',
        splitPercentage: r.splitPercentage || 0,
        amount: r.amount
      });
    });
    
    const groupedTxs = Array.from(txMap.values());
    
    return { 
      totals: { total, paid, pending, count: groupedTxs.length },
      groupedTransactions: groupedTxs
    };
  }, [filtered]);

  const [expandedTx, setExpandedTx] = useState<string | null>(null);

  const handleGenerateReport = (period?: string) => {
    toast.loading(`Preparing ${period || 'custom'} report...`, { id: 'pdf-snap' });
    try {
      const params = new URLSearchParams();
      if (period) params.append('period', period);
      else {
        if (fromDate) params.append('startDate', fromDate);
        if (toDate) params.append('endDate', toDate);
      }
      if (projectFilter) params.append('projectId', projectFilter);
      window.open(`/api/reports/export?${params.toString()}`, '_blank');
      toast.success('Report generation started!', { id: 'pdf-snap' });
    } catch {
      toast.error('Could not trigger report', { id: 'pdf-snap' });
    }
  };

  const projectOptions = projectsList 
    ? projectsList.map(p => [p.id, p.name])
    : Array.from(new Map(revenue.map(r => [r.projectId, r.projectName])).entries());

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl overflow-hidden relative">
      {/* Ambient glow */}
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
        <div>
          <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-400">
            Revenue Snapshot
          </h2>
          <p className="text-xs text-gray-500 mt-0.5 font-medium">Real-time payment tracking across all projects</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleGenerateReport('ytd')}
            className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all"
          >
            📊 YTD Report
          </button>
          <button
            onClick={() => handleGenerateReport('4months')}
            className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all"
          >
            📋 Quarterly
          </button>
        </div>
      </div>

      <div className="p-6 relative z-10 space-y-6">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Project</label>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            >
              <option value="" className="bg-gray-900">All Projects</option>
              {projectOptions.map(([id, name]) => (
                <option key={id} value={id} className="bg-gray-900">{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Search</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Source or project"
              className="w-full bg-white/5 border border-white/10 text-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none placeholder-gray-600"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none [color-scheme:dark]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none [color-scheme:dark]"
            />
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 backdrop-blur-md rounded-xl p-5 border border-indigo-500/15 shadow-lg relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <p className="text-[10px] font-bold text-indigo-400/70 uppercase tracking-widest mb-1">Total Revenue</p>
            <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-300 to-indigo-500 tracking-tight font-mono">
              {formatUSD(totals.total)}
            </p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 backdrop-blur-md rounded-xl p-5 border border-emerald-500/15 shadow-lg relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <p className="text-[10px] font-bold text-emerald-400/70 uppercase tracking-widest mb-1">Paid</p>
            <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-300 to-emerald-500 tracking-tight font-mono">
              {formatUSD(totals.paid)}
            </p>
          </div>
          <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 backdrop-blur-md rounded-xl p-5 border border-amber-500/15 shadow-lg relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-t from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <p className="text-[10px] font-bold text-amber-400/70 uppercase tracking-widest mb-1">Pending</p>
            <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-300 to-amber-500 tracking-tight font-mono">
              {formatUSD(totals.pending)}
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 backdrop-blur-md rounded-xl p-5 border border-purple-500/15 shadow-lg relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-t from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <p className="text-[10px] font-bold text-purple-400/70 uppercase tracking-widest mb-1">Web3 Balance</p>
            <p className="text-2xl font-black text-white tracking-tight font-mono">
              {splitsLoading ? '...' : (isLiveWeb3 ? 'Live' : 'Native')}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="px-5 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                <th className="px-5 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Project</th>
                <th className="px-5 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Source</th>
                <th className="px-5 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Amount</th>
                <th className="px-5 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-5 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Payment Split</th>
              </tr>
            </thead>
            <tbody>
              {groupedTransactions.slice(0, 20).map((tx) => (
                <React.Fragment key={tx.id}>
                  <tr className="border-b border-white/5 hover:bg-white/[0.03] transition-colors group cursor-pointer" onClick={() => setExpandedTx(expandedTx === tx.id ? null : tx.id)}>
                    <td className="px-5 py-3.5 text-sm text-gray-400 whitespace-nowrap font-mono">
                      {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-200 font-medium">{tx.projectName}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-400">{tx.source}</td>
                    <td className="px-5 py-3.5 text-sm font-bold text-white text-right font-mono">{formatUSD(tx.totalAmount)}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide ${
                        tx.status.toLowerCase() === 'paid' || tx.status.toLowerCase() === 'completed'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); setExpandedTx(expandedTx === tx.id ? null : tx.id); }}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all border ${
                          expandedTx === tx.id
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                            : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {expandedTx === tx.id ? '▲ Hide' : '▼ View'} Splits
                      </button>
                    </td>
                  </tr>
                  
                  {expandedTx === tx.id && (
                    <tr className="bg-white/5">
                      <td colSpan={6} className="px-5 py-4 border-b border-white/10">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                          {tx.splits.map((split: any, idx: number) => (
                            <div key={split.id || idx} className="bg-white/5 backdrop-blur-md p-3 rounded-xl border border-white/10 hover:border-indigo-500/20 transition-all">
                              <div className="flex justify-between items-start mb-2">
                                <div className="font-bold text-gray-200 text-sm">{split.recipientName}</div>
                                {split.splitPercentage > 0 && (
                                  <div className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                                    {split.splitPercentage}%
                                  </div>
                                )}
                              </div>
                              <div className="text-sm font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                                +{formatUSD(split.amount)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {groupedTransactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-500">
                    <div className="text-3xl mb-2">📭</div>
                    <p className="font-medium">No payments match your filters</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {groupedTransactions.length > 20 && (
            <div className="px-5 py-3 bg-white/[0.02] border-t border-white/5 text-center">
              <span className="text-xs text-gray-500">Showing 20 of {groupedTransactions.length} transactions</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => { setProjectFilter(''); setSearch(''); setFromDate(''); setToDate(''); }}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            Clear Filters
          </button>
          <button
            onClick={() => handleGenerateReport()}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/20"
          >
            📥 Generate Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default RevenueSnapshot;
