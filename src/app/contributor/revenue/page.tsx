'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/lib/auth';
import { ContributorLayout } from '@/components/layouts/ContributorLayout';
import { DistributionItem } from '@/lib/types';
import { getTxExplorerUrl } from '@/lib/tx';

export default function ContributorRevenuePage() {
  const { user, isReady } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [revenue, setRevenue] = useState<DistributionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRevenue = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const projectId = searchParams.get('projectId');
      if (projectId && user.role !== 'admin') {
        const projRes = await fetch('/api/projects');
        if (!projRes.ok) throw new Error('Failed to load projects');
        const projects = await projRes.json();
        const assigned = projects.find((p: any) =>
          p.id === projectId && p.contributors?.some((c: any) => c.email === user.email)
        );
        if (!assigned) {
          setRevenue([]);
          setError('Not authorized');
          return;
        }
      }
      const res = await fetch(`/api/distributions?contributorUserId=${encodeURIComponent(user.id)}`);
      if (!res.ok) throw new Error('Failed to load revenue');
      const data = await res.json();
      const items: DistributionItem[] = data.items || [];
      const filtered = projectId ? items.filter(r => r.projectId === projectId) : items;
      setRevenue(filtered);
    } catch (err: any) {
      setError(err.message || 'Failed to load revenue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isReady) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    loadRevenue();
  }, [user, isReady, router, searchParams]);

  if (!isReady || !user || (user.role !== 'contributor' && user.role !== 'admin')) {
    return null;
  }

  const totalEarnings = revenue.reduce((sum, r) => sum + r.amount, 0);
  const paidAmount = revenue.reduce((sum, r) => sum + r.amount, 0);
  const pendingAmount = 0;

  const exportCsv = () => {
    const headers = ['Date', 'Project', 'Amount', 'Tx Hash'];
    const rows = revenue.map(r => [r.createdAt, r.projectName, r.amount, r.txHash]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'earnings.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Exported CSV');
  };

  return (
    <ContributorLayout>
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              My Revenue
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Track your earnings from all projects.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadRevenue}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg"
            >
              Refresh
            </button>
            <button
              onClick={exportCsv}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Export CSV
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Earnings</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              ${totalEarnings.toLocaleString()}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Paid Out</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              ${paidAmount.toLocaleString()}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Pending</p>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              ${pendingAmount.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-400">Loading revenue...</p>
            </div>
          ) : error ? (
            <div className="p-6">
              <p className="text-red-600 dark:text-red-400 mb-2">{error}</p>
              <button
                onClick={loadRevenue}
                className="px-4 py-2 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100 rounded-lg text-sm font-medium"
              >
                Retry
              </button>
            </div>
          ) : revenue.length === 0 ? (
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-400">No revenue records found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tx Hash
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {revenue.map(rev => (
                    <tr key={rev.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {new Date(rev.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {rev.projectName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                    ${rev.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {(() => {
                      const txUrl = getTxExplorerUrl(rev.chainId, rev.txHash);
                      if (txUrl) {
                        return (
                          <a
                            href={txUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            View
                          </a>
                        );
                      }
                      return rev.txHash ? (
                        <span className="font-mono">{rev.txHash.slice(0, 10)}...</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      );
                    })()}
                  </td>
                </tr>
              ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ContributorLayout>
  );
}
