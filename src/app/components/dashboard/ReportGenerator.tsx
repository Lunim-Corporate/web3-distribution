'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate, formatPercentage } from '@/lib/utils';
import type { RevenueReport } from '@/lib/types';
import toast from 'react-hot-toast';

interface ReportGeneratorProps {
  walletAddress?: string;
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({ walletAddress }) => {
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState<RevenueReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('csv');

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    setIsLoading(true);
    try {
      const url = new URL('/api/reports', window.location.origin);
      url.searchParams.set('startDate', startDate);
      url.searchParams.set('endDate', endDate);
      if (walletAddress) {
        url.searchParams.set('address', walletAddress);
      }

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('Failed to generate report');
      const { data } = await response.json();
      setReport(data);
      toast.success('Report generated successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate report');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportReport = async () => {
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
          projectId: report.reportPeriod.startDate === startDate ? undefined : undefined, // Keep existing interface
          address: walletAddress,
          format: exportFormat,
        }),
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `revenue-report-${formatDate(new Date(), 'short')}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Report exported as ${exportFormat.toUpperCase()}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Export failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Report Generator Card */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          📊 Revenue Report Generator
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <Button
            className="w-full md:w-auto mt-4 md:mt-0"
            onClick={handleGenerateReport}
            disabled={isLoading}
          >
            {isLoading ? 'Generating...' : 'Generate report'}
          </Button>
        </div>
      </Card>

      {/* Report Results */}
      {report && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white/5 backdrop-blur-xl border border-white/5 p-5 rounded-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 blur-3xl -mr-10 -mt-10" />
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Revenue</p>
              <p className="text-xl font-black text-white">{formatCurrency(report.totalRevenue)}</p>
              <p className="text-[10px] text-gray-600 mt-1">Platform Total</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/5 p-5 rounded-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 blur-3xl -mr-10 -mt-10" />
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Paid</p>
              <p className="text-xl font-black text-emerald-400">{formatCurrency(report.totalPaid)}</p>
              <p className="text-[10px] text-gray-600 mt-1">On-chain Settled</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/5 p-5 rounded-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 blur-3xl -mr-10 -mt-10" />
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Pending</p>
              <p className="text-xl font-black text-amber-500">{formatCurrency(report.totalPending)}</p>
              <p className="text-[10px] text-gray-600 mt-1">In Processing</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/5 p-5 rounded-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/10 blur-3xl -mr-10 -mt-10" />
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Transactions</p>
              <p className="text-xl font-black text-white">{report.paymentCount}</p>
              <p className="text-[10px] text-gray-600 mt-1">Total Events</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/5 p-5 rounded-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 blur-3xl -mr-10 -mt-10" />
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Avg Distribution</p>
              <p className="text-xl font-black text-white">{formatCurrency(report.averagePaymentAmount)}</p>
              <p className="text-[10px] text-gray-600 mt-1">Per Recipient</p>
            </div>
          </div>

          {/* Revenue by Project (Screenshot 1) */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/5 overflow-hidden">
            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
              <h4 className="text-sm font-black text-white uppercase tracking-widest">Revenue by Project</h4>
              <Badge variant="outline" className="bg-white/5 text-gray-400 border-white/10 font-black">LUNIM ECOSYSTEM</Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Project</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Total</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Contributors</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Share (%)</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {report.projects.map((project, idx) => {
                    const sharePercent = ((project.totalRevenue / report.totalRevenue) * 100).toFixed(1);
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
                        <td className="px-6 py-4 text-right">
                          <svg className="w-4 h-4 text-gray-600 group-hover:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Export Options */}
          <Card>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Export Report
            </h4>
            <div className="flex gap-4">
              <div className="flex-1">
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="csv">CSV (Excel/Spreadsheet)</option>
                  <option value="json">JSON (Raw Data)</option>
                </select>
              </div>
              <Button variant="primary" onClick={handleExportReport}>
                📥 Download {exportFormat.toUpperCase()}
              </Button>
            </div>
          </Card>
        </>
      )}

      {/* Empty State */}
      {!report && (
        <Card className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            Select a date range and click &quot;Generate Report&quot; to view revenue analytics
          </p>
        </Card>
      )}
    </div>
  );
};
