'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { mockProjects } from '@/data/mockData';
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

  const handleGenerateReport = async () => {
    try {
      toast.loading('Generating revenue report...');
      
      // Simulate report generation delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create PDF report using jsPDF
      const jsPdfModule = await import('jspdf');
      const jsPDF = jsPdfModule.default || (jsPdfModule as { jsPDF: typeof jsPdfModule.default }).jsPDF || jsPdfModule;
      
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.text('Revenue Report', 14, 20);
      doc.setFontSize(12);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
      
      // Summary
      doc.setFontSize(14);
      doc.text('Summary', 14, 45);
      doc.setFontSize(10);
      doc.text(`Total Revenue: ${formatCurrency(totals.total)}`, 14, 55);
      doc.text(`Paid: ${formatCurrency(totals.paid)}`, 14, 62);
      doc.text(`Pending: ${formatCurrency(totals.pending)}`, 14, 69);
      doc.text(`Total Transactions: ${totals.count}`, 14, 76);
      
      // Filters applied
      if (projectFilter || search || fromDate || toDate) {
        doc.text('Filters Applied:', 14, 86);
        let yPos = 93;
        if (projectFilter) {
          const project = mockProjects.find(p => p.id === projectFilter);
          doc.text(`Project: ${project?.name || 'Unknown'}`, 14, yPos);
          yPos += 7;
        }
        if (search) {
          doc.text(`Search: ${search}`, 14, yPos);
          yPos += 7;
        }
        if (fromDate) {
          doc.text(`From: ${fromDate}`, 14, yPos);
          yPos += 7;
        }
        if (toDate) {
          doc.text(`To: ${toDate}`, 14, yPos);
          yPos += 7;
        }
      }
      
      // Revenue details
      doc.setFontSize(14);
      doc.text('Revenue Details', 14, 110);
      doc.setFontSize(8);
      
      let y = 120;
      filtered.forEach((r, idx) => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        const line = `${idx + 1}. ${new Date(r.date).toLocaleDateString()} | ${r.projectName} | ${r.source} | ${formatCurrency(r.amount)} | ${r.status}`;
        doc.text(line, 14, y);
        y += 6;
      });
      
      // Save the PDF
      const fileName = `revenue_report_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      toast.dismiss();
      toast.success(`Report generated successfully! Downloaded as ${fileName}`);
      
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to generate report. Please try again.');
      console.error('Report generation error:', error);
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Revenue Snapshot</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
          <Select
            label="Project"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            options={[{ value: '', label: 'All Projects' }, ...mockProjects.map(p => ({ value: p.id, label: p.name }))]}
          />
          <Input label="Search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Source or project" />
          <Input label="From" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          <Input label="To" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>

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

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 text-sm font-medium text-gray-700 dark:text-gray-300">Date</th>
                <th className="text-left py-3 text-sm font-medium text-gray-700 dark:text-gray-300">Project</th>
                <th className="text-left py-3 text-sm font-medium text-gray-700 dark:text-gray-300">Source</th>
                <th className="text-left py-3 text-sm font-medium text-gray-700 dark:text-gray-300">Amount</th>
                <th className="text-left py-3 text-sm font-medium text-gray-700 dark:text-gray-300">Paid%</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 text-gray-600 dark:text-gray-400">{new Date(r.date).toLocaleDateString()}</td>
                  <td className="py-3 text-gray-900 dark:text-white">{r.projectName}</td>
                  <td className="py-3 text-gray-600 dark:text-gray-400">{r.source}</td>
                  <td className="py-3 font-medium text-gray-900 dark:text-white">{formatCurrency(r.amount)}</td>
                  <td className="py-3 text-gray-600 dark:text-gray-400">{formatPercentage(r.status === 'Paid' ? 100 : 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="secondary" onClick={() => { setProjectFilter(''); setSearch(''); setFromDate(''); setToDate(''); }}>Clear Filters</Button>
          <Button onClick={handleGenerateReport}>Generate PDF Report</Button>
          <Button 
            variant="success" 
            onClick={() => {
              // Scroll to payment splitter
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


