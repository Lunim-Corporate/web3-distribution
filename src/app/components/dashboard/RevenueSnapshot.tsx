'use client';

import React, { useMemo, useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'react-hot-toast';

const formatUSD = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

export const RevenueSnapshot: React.FC<{ activeProjectId?: string | null, projectsList?: {id: string, name: string}[] }> = ({ activeProjectId, projectsList }) => {
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
    }>
  >([]);

  const fetchRevenue = React.useCallback(() => {
    fetch('/api/revenue?ts=' + Date.now(), { cache: 'no-store' })
      .then(r => r.json())
      .then(setRevenue)
      .catch(() => setRevenue([]));
  }, []);

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
  const totals = useMemo(() => {
    const total = filtered.reduce((sum, r) => sum + r.amount, 0);
    const paid = filtered.filter((r) => r.status === 'Paid').reduce((s, r) => s + r.amount, 0);
    const pending = filtered.filter((r) => r.status !== 'Paid').reduce((s, r) => s + r.amount, 0);
    // Count unique transactions by tx_hash, not individual payment rows
    const uniqueTxHashes = new Set(filtered.map(r => r.txHash || r.id));
    return { total, paid, pending, count: uniqueTxHashes.size };
  }, [filtered]);

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
            <p className="text-[10px] font-bold text-purple-400/70 uppercase tracking-widest mb-1">Transactions</p>
            <p className="text-2xl font-black text-white tracking-tight font-mono">{totals.count}</p>
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
                <th className="px-5 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 20).map((r) => (
                <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                  <td className="px-5 py-3.5 text-sm text-gray-400 whitespace-nowrap font-mono">
                    {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-200 font-medium">{r.projectName}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-400">{r.source}</td>
                  <td className="px-5 py-3.5 text-sm font-bold text-white text-right font-mono">{formatUSD(r.amount)}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide ${
                      r.status === 'Paid'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-gray-500">
                    <div className="text-3xl mb-2">📭</div>
                    <p className="font-medium">No payments match your filters</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {filtered.length > 20 && (
            <div className="px-5 py-3 bg-white/[0.02] border-t border-white/5 text-center">
              <span className="text-xs text-gray-500">Showing 20 of {filtered.length} payments</span>
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
