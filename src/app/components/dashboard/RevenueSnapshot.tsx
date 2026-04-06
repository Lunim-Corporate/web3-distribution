'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { toast } from 'react-hot-toast';

export const RevenueSnapshot: React.FC = () => {
  const [projectFilter, setProjectFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const [revenue, setRevenue] = useState<
    Array<{
      id: string;
      projectId: string;
      projectName: string;
      amount: number;
      date: string;
      source: string;
      status: string;
    }>
  >([]);

  React.useEffect(() => {
    fetch('/api/revenue').then(r => r.json()).then(setRevenue).catch(() => setRevenue([]));
  }, []);

  const filtered = useMemo(() => {
    return revenue
      .filter((r) => !projectFilter || r.projectId === projectFilter)
      .filter((r) => !search || r.projectName.toLowerCase().includes(search.toLowerCase()) || r.source.toLowerCase().includes(search.toLowerCase()))
      .filter((r) => (fromDate ? new Date(r.date) >= new Date(fromDate) : true))
      .filter((r) => (toDate ? new Date(r.date) <= new Date(toDate) : true));
  }, [revenue, projectFilter, search, fromDate, toDate]);

  const totals = useMemo(() => {
    const total = filtered.reduce((sum, r) => sum + r.amount, 0);
    const paid = filtered.filter((r) => r.status === 'Paid').reduce((s, r) => s + r.amount, 0);
    const pending = filtered.filter((r) => r.status !== 'Paid').reduce((s, r) => s + r.amount, 0);
    const count = filtered.length;
    return { total, paid, pending, count };
  }, [filtered]);

  const handleGenerateReport = (period?: string) => {
    toast.loading(`Preparing ${period || 'custom'} report...`, { id: 'pdf-snap' });
    
    try {
      const params = new URLSearchParams();
      if (period) {
        params.append('period', period);
      } else {
        if (fromDate) params.append('startDate', fromDate);
        if (toDate) params.append('endDate', toDate);
      }
      if (projectFilter) params.append('projectId', projectFilter);

      const exportUrl = `/api/reports/export?${params.toString()}`;
      window.open(exportUrl, '_blank');
      
      toast.success('Report generation started!', { id: 'pdf-snap' });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Could not trigger server report', { id: 'pdf-snap' });
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Revenue Snapshot</CardTitle>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => handleGenerateReport('ytd')}>YTD Report</Button>
            <Button variant="ghost" size="sm" onClick={() => handleGenerateReport('4months')}>Quarterly Report</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* ... existing filter inputs ... */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
          <Select
            label="Project"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            options={[{ value: '', label: 'All Projects' }, ...Array.from(new Map(revenue.map(r => [r.projectId, r.projectName])).entries()).map(([id, name]) => ({ value: id, label: name }))]}
          />
          <Input label="Search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Source or project" />
          <Input label="From" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          <Input label="To" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>

        {/* ... existing summary cards ... */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="p-5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totals.total)}</p>
          </div>
          <div className="p-5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">Paid</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totals.paid)}</p>
          </div>
          <div className="p-5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">Pending/Processing</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totals.pending)}</p>
          </div>
          <div className="p-5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">Transactions</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totals.count}</p>
          </div>
        </div>

        {/* ... table ... */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 text-sm font-medium text-gray-700 dark:text-gray-300">Date</th>
                <th className="text-left py-3 text-sm font-medium text-gray-700 dark:text-gray-300">Project</th>
                <th className="text-left py-3 text-sm font-medium text-gray-700 dark:text-gray-300">Source</th>
                <th className="text-left py-3 text-sm font-medium text-gray-700 dark:text-gray-300">Amount</th>
                <th className="text-left py-3 text-sm font-medium text-gray-700 dark:text-gray-300">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 text-gray-600 dark:text-gray-400">{new Date(r.date).toLocaleDateString()}</td>
                  <td className="py-3 text-gray-900 dark:text-white">{r.projectName}</td>
                  <td className="py-3 text-gray-600 dark:text-gray-400">{r.source}</td>
                  <td className="py-3 font-medium text-gray-900 dark:text-white">{formatCurrency(r.amount)}</td>
                  <td className="py-3 text-gray-600 dark:text-gray-400">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${r.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="secondary" onClick={() => { setProjectFilter(''); setSearch(''); setFromDate(''); setToDate(''); }}>Clear Filters</Button>
          <Button onClick={() => handleGenerateReport()}>Generate Custom PDF</Button>
          <Button 
            variant="success" 
            onClick={() => {
              document.getElementById('payment-splitter')?.scrollIntoView({ behavior: 'smooth' });
              toast.success('Navigate to Payment Splitter below to split revenue!');
            }}
          >
            Split Revenue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RevenueSnapshot;


