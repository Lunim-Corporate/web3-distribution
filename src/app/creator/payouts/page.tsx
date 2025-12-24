'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/lib/auth';
import { CreatorLayout } from '@/components/layouts/CreatorLayout';
import { Revenue } from '@/lib/types';

export default function CreatorPayoutsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [payouts, setPayouts] = useState<Revenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [available, setAvailable] = useState<Revenue[]>([]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const [projectsData, revenueData] = await Promise.all([
        fetch('/api/projects').then(r => {
          if (!r.ok) throw new Error('Failed to load projects');
          return r.json();
        }),
        fetch('/api/revenue').then(r => {
          if (!r.ok) throw new Error('Failed to load revenue');
          return r.json();
        }),
      ]);
      const creatorProjectIds = projectsData
        .filter((p: any) => p.creatorId === user.id)
        .map((p: any) => p.id);
      
      const creatorRevenue = revenueData.filter((r: Revenue) => 
        creatorProjectIds.includes(r.projectId)
      );

      const paid = creatorRevenue.filter((r: Revenue) => r.status === 'Paid');
      const pending = creatorRevenue.filter((r: Revenue) => r.status !== 'Paid');

      setPayouts(paid);
      setAvailable(pending);
    } catch (err: any) {
      setError(err.message || 'Failed to load payouts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role !== 'creator' && user.role !== 'admin') {
      router.replace('/unauthorized');
      return;
    }
    loadData();
  }, [user, router]);

  if (!user || (user.role !== 'creator' && user.role !== 'admin')) {
    return null;
  }

  const totalPaid = payouts.reduce((sum, p) => sum + p.amount, 0);
  const thisMonth = payouts.filter(p => {
    const date = new Date(p.date);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).reduce((sum, p) => sum + p.amount, 0);
  const availableAmount = useMemo(() => available.reduce((sum, p) => sum + p.amount, 0), [available]);

  const handleRequestPayout = async () => {
    if (available.length === 0) {
      toast.error('No pending revenue to withdraw');
      return;
    }
    try {
      await Promise.all(
        available.map(item =>
          fetch('/api/revenue', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: item.id, status: 'Paid' }),
          })
        )
      );
      toast.success('Payout requested and marked as paid');
      loadData();
    } catch {
      toast.error('Failed to request payout');
    }
  };

  return (
    <CreatorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              My Payouts
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              View completed payouts from your projects.
            </p>
          </div>
          <button
            onClick={handleRequestPayout}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Request Payout
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Distributed</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
            ${totalPaid.toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">This Month</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            ${thisMonth.toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Pending Payouts</p>
          <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
            ${availableAmount.toLocaleString()}
          </p>
        </div>
      </div>

        {/* Payouts Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-400">Loading payouts...</p>
            </div>
          ) : error ? (
            <div className="p-6">
              <p className="text-red-600 dark:text-red-400 mb-2">{error}</p>
              <button
                onClick={loadData}
                className="px-4 py-2 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100 rounded-lg text-sm font-medium"
              >
                Retry
              </button>
            </div>
          ) : payouts.length === 0 ? (
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-400">No payouts yet.</p>
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
                      Source
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Transaction
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {payouts.map(payout => (
                    <tr key={payout.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {payout.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {payout.projectName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {payout.source}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">
                        ${payout.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {payout.transactionHash ? (
                          <a
                            href={`https://etherscan.io/tx/${payout.transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            View on Etherscan
                          </a>
                        ) : (
                          <span className="text-gray-400">Off-chain</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </CreatorLayout>
  );
}
