'use client';

import React, { useCallback, useState } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { RevenueReport } from '@/lib/types';
import toast from 'react-hot-toast';

interface ReportGeneratorProps {
  walletAddress?: string;
  projectId?: string | null;
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({ walletAddress, projectId }) => {
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState<RevenueReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasGeneratedBefore, setHasGeneratedBefore] = useState(false);

  // Re-fetch report when projectId changes if we already have one showing
  const handleGenerateReport = useCallback(async (overrideStartDate?: string, overrideEndDate?: string) => {
    const effectiveStartDate = typeof overrideStartDate === 'string' ? overrideStartDate : startDate;
    const effectiveEndDate = typeof overrideEndDate === 'string' ? overrideEndDate : endDate;

    if (!effectiveStartDate || !effectiveEndDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    setIsLoading(true);
    try {
      const url = new URL('/api/reports', window.location.origin);
      url.searchParams.set('startDate', effectiveStartDate);
      url.searchParams.set('endDate', effectiveEndDate);
      if (projectId) {
        url.searchParams.set('projectId', projectId);
      }
      if (walletAddress) {
        url.searchParams.set('address', walletAddress);
      }

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('Failed to generate report');
      const { data } = await response.json();
      setStartDate(effectiveStartDate);
      setEndDate(effectiveEndDate);
      setReport(data);
      setHasGeneratedBefore(true);
      toast.success('Report generated successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate report');
    } finally {
      setIsLoading(false);
    }
  }, [endDate, projectId, startDate, walletAddress]);

  React.useEffect(() => {
    if (hasGeneratedBefore) {
      void handleGenerateReport();
    }
  }, [projectId, hasGeneratedBefore, handleGenerateReport]);

  const handleExportCsv = async () => {
    if (!report) {
      toast.error('Please generate a report first');
      return;
    }

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate,
          endDate,
          projectId,
          address: walletAddress,
          format: 'csv',
        }),
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `revenue-report-${formatDate(new Date(), 'short')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Report exported as CSV');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Export failed');
    }
  };

  const handleExportPdf = async () => {
    if (!report) {
      toast.error('Please generate a report first');
      return;
    }

    try {
      const url = new URL('/api/reports/export', window.location.origin);
      url.searchParams.set('startDate', startDate);
      url.searchParams.set('endDate', endDate);
      if (projectId) {
        url.searchParams.set('projectId', projectId);
      }
      if (walletAddress) {
        url.searchParams.set('address', walletAddress);
      }

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('Failed to generate PDF');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `lunim-report-${startDate}-to-${endDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      toast.success('PDF generated successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate PDF');
    }
  };

  const handlePresetReport = async (period: 'quarterly' | 'ytd') => {
    const now = new Date();
    let nextStartDate = '';
    const nextEndDate = now.toISOString().split('T')[0];

    if (period === 'ytd') {
      // Year to Date: January 1st of current year to today
      nextStartDate = `${now.getFullYear()}-01-01`;
    } else {
      // Quarterly: Start of current quarter to today
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      nextStartDate = new Date(now.getFullYear(), quarterStartMonth, 1).toISOString().split('T')[0];
    }

    await handleGenerateReport(nextStartDate, nextEndDate);
  };

  const rightsHolderCount = report
    ? report.projects.reduce((sum, project) => sum + project.contributorCount, 0)
    : 0;

  return (
    <div className="space-y-8">
      {/* Report Generator Header */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
        <h3 className="text-xl font-black text-white tracking-tight mb-6">
          <span className="mr-2">📊</span> Revenue Report Generator
        </h3>
        <div className="flex flex-wrap gap-3 mb-5">
          <button
            onClick={() => void handlePresetReport('quarterly')}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl font-bold uppercase tracking-widest text-[11px] transition-all shadow-lg active:scale-95 bg-white/10 hover:bg-white/20 text-white disabled:bg-white/5 disabled:text-gray-500"
          >
            Quarterly Report
          </button>
          <button
            onClick={() => void handlePresetReport('ytd')}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl font-bold uppercase tracking-widest text-[11px] transition-all shadow-lg active:scale-95 bg-white/10 hover:bg-white/20 text-white disabled:bg-white/5 disabled:text-gray-500"
          >
            Year to Date
          </button>
        </div>
        <div className="flex flex-col md:flex-row items-end gap-4">
          <div className="flex-1 w-full">
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>
          <button
            onClick={() => void handleGenerateReport()}
            disabled={isLoading}
            className="w-full md:w-auto px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-sm transition-all shadow-lg active:scale-95 bg-indigo-500 hover:bg-indigo-400 text-white shadow-indigo-500/20 disabled:bg-white/10 disabled:text-gray-500 disabled:shadow-none"
          >
            {isLoading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {/* Report Results */}
      {report && (
        <div className="report-print-area space-y-8">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/5 backdrop-blur-xl border border-white/5 p-5 rounded-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 blur-3xl -mr-10 -mt-10" />
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Distributed</p>
              <p className="text-xl font-black text-white">{formatCurrency(report.totalRevenue)}</p>
              <p className="text-[10px] text-gray-600 mt-1">Platform Total</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/5 p-5 rounded-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 blur-3xl -mr-10 -mt-10" />
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Rights Holders</p>
              <p className="text-xl font-black text-white">{rightsHolderCount}</p>
              <p className="text-[10px] text-gray-600 mt-1">Active Contributors</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/5 p-5 rounded-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/10 blur-3xl -mr-10 -mt-10" />
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Transactions</p>
              <p className="text-xl font-black text-white">{report.paymentCount}</p>
              <p className="text-[10px] text-gray-600 mt-1">On-chain Events</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/5 p-5 rounded-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 blur-3xl -mr-10 -mt-10" />
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Project Status</p>
              <p className="text-xl font-black text-emerald-400">active</p>
              <p className="text-[10px] text-gray-600 mt-1">Verified Sync</p>
            </div>
          </div>

          {/* Revenue by Project */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
              <h4 className="text-sm font-black text-white uppercase tracking-widest">Revenue by Project</h4>
              <span className="bg-white/10 text-gray-400 border border-white/5 font-black text-[10px] px-2 py-1 rounded-lg">
                {report.projects.length === 1 ? 'SPECIFIC PROJECT' : 'LUNIM ECOSYSTEM'}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Project</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Total</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Contributors</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Share (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {report.projects.map((project, idx) => {
                    const sharePercent = report.totalRevenue > 0 ? ((project.totalRevenue / report.totalRevenue) * 100).toFixed(1) : '0.0';
                    return (
                      <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-xs font-bold text-indigo-400">
                              {project.projectName.charAt(0)}
                            </div>
                            <span className="text-sm font-bold text-gray-200 group-hover:text-white transition-colors">{project.projectName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-black text-white">{formatCurrency(project.totalRevenue)}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-bold text-gray-400">{project.contributorCount}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-black text-indigo-400">{sharePercent}%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Export Options */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl print:hidden flex items-center justify-between">
            <div>
              <h4 className="text-base font-black text-white">Export Report Data</h4>
              <p className="text-sm text-gray-500 mt-1">Download your data for accounting or generate a print-ready PDF.</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => void handleExportCsv()}
                className="px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all shadow-lg active:scale-95 bg-white/10 hover:bg-white/20 text-white"
              >
                📥 Download CSV
              </button>
              <button
                onClick={() => void handleExportPdf()}
                className="px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all shadow-lg active:scale-95 bg-indigo-500 hover:bg-indigo-400 text-white shadow-indigo-500/20"
              >
                📄 Generate PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!report && (
        <div className="bg-white/5 border border-white/5 rounded-3xl p-12 flex flex-col items-center justify-center text-center">
          <span className="text-4xl mb-4 opacity-50">📅</span>
          <h3 className="text-lg font-black text-white mb-2">No Report Data</h3>
          <p className="text-sm text-gray-500 max-w-sm">
            Select a date range and click &quot;Generate Report&quot; above to compile revenue and distribution analytics.
          </p>
        </div>
      )}

      {/* CSS for print styling */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          /* Hide everything except the report print area */
          body > *:not(#__next) {
            display: none !important;
          }
          #navbar, .sidebar-nav, .tab-navigation, .print\\:hidden {
            display: none !important;
          }
          .report-print-area {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            padding: 20px;
          }
          /* Fix colors for print */
          .report-print-area * {
            color: black !important;
            border-color: #ddd !important;
          }
          .bg-white\\/5 {
            background-color: transparent !important;
            border: 1px solid #eee !important;
          }
        }
      `}</style>
    </div>
  );
};
