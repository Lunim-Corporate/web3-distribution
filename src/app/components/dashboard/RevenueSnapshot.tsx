'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useEthPrice } from '@/app/lib/useEthPrice';
import { dedupeJsonFetch } from '@/app/lib/requestCache';
import { getExplorerUrl } from '@/app/lib/constants';

const formatUSD = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

import { jsPDF } from 'jspdf';
interface RevenueSnapshotProps {
  activeProjectId: string | null;
  projectsList: Array<{ id: string; name: string }>;
  transactions?: any[];
  isDemoMode?: boolean;
}

export const RevenueSnapshot: React.FC<RevenueSnapshotProps> = ({ activeProjectId, projectsList, isDemoMode }) => {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const toggleRow = (id: string) => setExpandedRows(prev => ({...prev, [id]: !prev[id]}));
  const { ethPrice } = useEthPrice();
  const [projectFilter, setProjectFilter] = useState<string>(activeProjectId || '');
  
  React.useEffect(() => {
    setProjectFilter(activeProjectId || '');
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
      splits?: any[];
    }>
  >([]);

  const fetchRevenue = React.useCallback(async () => {
    try {
      const isDemoModeStr = localStorage.getItem('demo_mode') === 'true';
      const data = await dedupeJsonFetch('revenue:snapshot', `/api/revenue?demo=${isDemoModeStr}`);
      setRevenue(data);
    } catch {
      setRevenue([]);
    }
  }, []);

  React.useEffect(() => {
    fetchRevenue();
    window.addEventListener('payment-recorded', fetchRevenue);
    return () => window.removeEventListener('payment-recorded', fetchRevenue);
  }, [fetchRevenue, isDemoMode]);

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

  const handleGenerateReport = async (period?: string) => {
    toast.loading(`Preparing ${period || 'custom'} report...`, { id: 'pdf-snap' });
    try {
      const params = new URLSearchParams();
      if (period) params.append('period', period);
      else {
        if (fromDate) params.append('startDate', fromDate);
        if (toDate) params.append('endDate', toDate);
      }
      if (projectFilter) params.append('projectId', projectFilter);
      
      const res = await fetch(`/api/reports?${params.toString()}`);
      const { data: report } = await res.json();
      
      const doc = new jsPDF();
      doc.setFillColor(30, 64, 175);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.text('LUNIM', 20, 25);
      doc.setFontSize(10);
      doc.text('CREATIVE RIGHTS PLATFORM - REPORT', 20, 32);
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.text('EXECUTIVE SUMMARY', 20, 55);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated At: ${new Date().toLocaleString()}`, 20, 62);
      
      doc.setFont('helvetica', 'bold');
      doc.text(`Total Revenue: USD ${(report.totalRevenue * ethPrice).toFixed(2)}`, 20, 78);
      doc.text(`Total Paid: USD ${(report.totalPaid * ethPrice).toFixed(2)}`, 20, 86);
      doc.text(`Payment Count: ${report.paymentCount}`, 20, 94);
      
      doc.setFontSize(14);
      doc.text('RECENT PROJECTS & REVENUE', 20, 118);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      let y = 128;
      
      if (report.projects && report.projects.length > 0) {
        report.projects.slice(0, 15).forEach((proj: any) => {
          if (y > 270) { doc.addPage(); y = 20; }
          const share = proj.sharePercentage ? `${proj.sharePercentage.toFixed(1)}%` : '0%';
          doc.text(`${proj.projectName}: USD ${(proj.totalRevenue * ethPrice).toFixed(2)} (${share} share)`, 25, y);
          y += 8;
        });
      } else {
        doc.text('No matching project data found for this period.', 25, y);
      }

      // Transaction History Section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('TRANSACTION HISTORY', 20, y + 10);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      y += 20;

      if (report.trends && report.trends.length > 0) {
        // Headers
        doc.setFont('helvetica', 'bold');
        doc.text('Date & Time', 25, y);
        doc.text('Project', 75, y);
        doc.text('Amount (ETH)', 135, y);
        doc.text('Value (USD)', 170, y);
        doc.setFont('helvetica', 'normal');
        y += 8;

        report.trends.slice(0, 20).forEach((t: any) => {
          if (y > 270) { doc.addPage(); y = 20; }
          const formattedDate = new Date(t.date).toLocaleString();
          const txPrice = t.ethPriceAtTx || ethPrice; // Fallback to current live price if not stored
          const usdValue = t.amount * txPrice;
          
          doc.text(formattedDate, 25, y);
          doc.text(t.projectName.slice(0, 20), 75, y);
          doc.text(`${t.amount.toFixed(4)} ETH`, 135, y);
          doc.text(`$${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 170, y);
          y += 8;
        });
      } else {
        doc.text('No transactions found for this period.', 25, y);
      }
      
      doc.save(`lunim_report_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success('Report downloaded successfully!', { id: 'pdf-snap' });
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
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 backdrop-blur-md rounded-xl p-5 border border-indigo-500/15 shadow-lg relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <p className="text-[10px] font-bold text-indigo-400/70 uppercase tracking-widest mb-1">Total Revenue</p>
            <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-300 to-indigo-500 tracking-tight font-mono">
              {formatUSD(totals.total * ethPrice)}
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
              {filtered.slice(0, 20).map((r: any) => {
                const hasSplits = r.splits && r.splits.length > 0;
                const isExpanded = expandedRows[r.id];
                return (
                  <React.Fragment key={r.id}>
                    <tr onClick={() => hasSplits && toggleRow(r.id)} className={`border-b border-white/5 transition-colors ${hasSplits ? 'cursor-pointer hover:bg-white/[0.05]' : 'hover:bg-white/[0.03]'}`}>
                      <td className="px-5 py-3.5 text-sm text-gray-400 whitespace-nowrap font-mono">
                        {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-200 font-medium">{r.projectName}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-400">{r.source}</td>
                      <td className="px-5 py-3.5 text-sm font-bold text-white text-right font-mono">{formatUSD(r.amount * ethPrice)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide ${
                            r.status === 'Paid'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                          }`}>
                            {r.status}
                          </span>
                          <span className="text-gray-500 text-xs w-3 text-center">{hasSplits ? (isExpanded ? '▼' : '▶') : ''}</span>
                        </div>
                      </td>
                    </tr>
                    <AnimatePresence>
                      {isExpanded && hasSplits && (
                        <tr className="bg-white/[0.02] border-b border-white/5">
                          <td colSpan={5} className="px-5 py-0 overflow-hidden">
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: 'easeInOut' }}
                              className="px-5 py-5 space-y-4"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-1 h-4 bg-indigo-500/40 rounded-full" />
                                  <span className="text-[10px] font-black text-indigo-400/80 uppercase tracking-[0.2em]">Distribution Breakdown</span>
                                </div>
                                {r.txHash?.startsWith('0x') ? (
                                  <a
                                    href={getExplorerUrl('tx', r.txHash)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-mono text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/20 transition-colors"
                                  >
                                    {r.txHash?.slice(0, 12)}... ↗
                                  </a>
                                ) : (
                                  <div className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-mono text-gray-500">
                                    {r.txHash?.slice(0, 12)}...
                                  </div>
                                )}
                              </div>

                              <div className="space-y-1 relative pl-4">
                                {/* Vertical connection line */}
                                <div className="absolute left-1.5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-white/10 via-white/5 to-transparent rounded-full" />
                                
                                {r.splits.map((s: any) => {
                                  const pct = s.percentage || 0;
                                  const circumference = 2 * Math.PI * 14;
                                  const offset = circumference - (pct / 100) * circumference;
                                  return (
                                  <div key={s.id} className="flex items-center justify-between p-3 bg-slate-950/40 rounded-xl border border-white/5 hover:border-indigo-500/20 transition-all group/split">
                                    <div className="flex items-center gap-3 min-w-0 pr-2">
                                      <div className="relative shrink-0">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-[11px] font-black text-indigo-300 border border-white/10 shadow-sm group-hover/split:border-indigo-500/30 transition-colors">
                                          {s.full_name?.charAt(0) || '?'}
                                        </div>
                                        <div className="absolute -left-[14px] top-1/2 -translate-y-1/2 w-2 h-0.5 bg-white/10" />
                                      </div>
                                      <div className="min-w-0">
                                        <span className="text-sm font-bold text-gray-200 group-hover/split:text-white transition-colors truncate block">{s.full_name}</span>
                                        <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{s.role}</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-5 shrink-0">
                                      {/* Circular progress ring */}
                                      <div className="relative w-9 h-9 flex items-center justify-center">
                                        <svg className="w-9 h-9 -rotate-90" viewBox="0 0 32 32">
                                          <circle cx="16" cy="16" r="14" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                                          <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"
                                            strokeDasharray={circumference}
                                            strokeDashoffset={offset}
                                            className="text-indigo-400 transition-all duration-700 ease-out"
                                          />
                                        </svg>
                                        <span className="absolute text-[8px] font-black text-indigo-400 font-mono">{pct}%</span>
                                      </div>
                                      <div className="flex flex-col items-end min-w-[90px]">
                                        <span className="text-sm font-black text-emerald-400 font-mono tracking-tight">{formatUSD(s.amount_eth * ethPrice)}</span>
                                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">{s.amount_eth?.toFixed(4) || '0'} ETH</span>
                                      </div>
                                    </div>
                                  </div>
                                  );
                                })}
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })}
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
