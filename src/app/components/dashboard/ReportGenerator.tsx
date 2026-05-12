'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate, formatPercentage } from '@/lib/utils';
import type { RevenueReport } from '@/lib/types';
import { ETH_PRICE_USD } from '@/app/lib/constants';
import toast from 'react-hot-toast';

interface ReportGeneratorProps {
  isDemoMode?: boolean;
  activeProjectId?: string | null;
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({ isDemoMode, activeProjectId }) => {
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState<RevenueReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('csv');
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const toggleProject = (id: string) => setExpandedProjects(prev => ({ ...prev, [id]: !prev[id] }));

  // Reset report when demo mode or project selection changes
  React.useEffect(() => {
    setReport(null);
  }, [isDemoMode, activeProjectId]);

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    setIsLoading(true);
    try {
      const isDemoMode = localStorage.getItem('demo_mode') === 'true';
      const response = await fetch(
        `/api/reports?startDate=${startDate}&endDate=${endDate}&demo=${isDemoMode}${activeProjectId && activeProjectId !== 'all' ? `&projectId=${activeProjectId}` : ''}`
      );
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
          format: exportFormat,
          demo: localStorage.getItem('demo_mode') === 'true',
          projectId: activeProjectId && activeProjectId !== 'all' ? activeProjectId : undefined
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
          <Card>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Report Summary
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400 uppercase">Total Revenue</p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {formatCurrency(report.totalRevenue * ETH_PRICE_USD)}
                </p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400 uppercase">Total Paid</p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400 mt-1">
                  {formatCurrency(report.totalPaid * ETH_PRICE_USD)}
                </p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400 uppercase">Payment Count</p>
                <p className="text-lg font-bold text-purple-600 dark:text-purple-400 mt-1">
                  {report.paymentCount}
                </p>
              </div>
              <div className="p-4 bg-indigo-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400 uppercase">Avg Payment</p>
                <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                  {formatCurrency(report.averagePaymentAmount * ETH_PRICE_USD)}
                </p>
              </div>
            </div>
          </Card>

          {/* Revenue by Source */}
          {report.sources && report.sources.length > 0 && (
            <Card>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Revenue by Source
              </h4>
              <div className="space-y-2">
                {report.sources.map((source, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Badge variant="info">{source.source}</Badge>
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${Math.min(source.percentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(source.amount * ETH_PRICE_USD)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatPercentage(source.percentage)} · {source.paymentCount} payments
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Revenue by Project */}
          {report.projects && report.projects.length > 0 && (
            <Card>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Revenue by Project
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                        Project
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                        Total
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-white">
                        Contributors
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-white">
                        Share (%)
                      </th>
                      <th className="px-4 py-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.projects.map((project, idx) => (
                      <React.Fragment key={idx}>
                        <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                            {project.projectName}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-900 dark:text-white font-mono">
                            {formatCurrency(project.totalRevenue * ETH_PRICE_USD)}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-900 dark:text-white">
                            {project.contributorCount}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-900 dark:text-white font-mono">
                            {formatPercentage(project.sharePercentage)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => toggleProject(project.projectId)}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500"
                            >
                              <svg
                                className={`w-5 h-5 transition-transform ${expandedProjects[project.projectId] ? 'rotate-180' : ''}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                        {expandedProjects[project.projectId] && project.splits && (
                          <tr className="bg-gray-50/50 dark:bg-gray-900/30">
                            <td colSpan={5} className="px-8 py-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {project.splits.map((split: any, sIdx: number) => (
                                  <div key={sIdx} className="flex items-center justify-between p-3 bg-white/50 dark:bg-black/20 rounded-xl border border-gray-100 dark:border-white/5">
                                    <div className="flex flex-col">
                                      <span className="text-sm font-medium text-gray-900 dark:text-white">{split.name}</span>
                                      <span className="text-xs text-gray-500">{split.percentage}% Share</span>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-sm font-bold text-green-600 dark:text-green-400">
                                        {formatCurrency(split.amount * ETH_PRICE_USD)}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

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
