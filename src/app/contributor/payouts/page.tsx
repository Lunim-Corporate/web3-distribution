'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/lib/auth';
import { ContributorLayout } from '@/components/layouts/ContributorLayout';
import { Revenue } from '@/lib/types';

export default function ContributorPayoutsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [payouts, setPayouts] = useState<Revenue[]>([]);
  const [pending, setPending] = useState<Revenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/revenue');
      if (!res.ok) throw new Error('Failed to load revenue');
      const data: Revenue[] = await res.json();
      const userRevenue = data.filter(r => r.contributorId === user.id);
      setPayouts(userRevenue.filter(r => r.status === 'Paid'));
      setPending(userRevenue.filter(r => r.status !== 'Paid'));
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
    if (user.role !== 'contributor' && user.role !== 'admin') {
      router.replace('/unauthorized');
      return;
    }
    loadData();
  }, [user, router]);

  if (!user || (user.role !== 'contributor' && user.role !== 'admin')) {
    return null;
  }

  const totalPaid = payouts.reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = useMemo(() => pending.reduce((sum, p) => sum + p.amount, 0), [pending]);

  const handleWithdraw = async () => {
    if (pending.length === 0) {
      toast.error('No pending payouts to withdraw');
      return;
    }
    try {
      await Promise.all(
        pending.map(item =>
          fetch('/api/revenue', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: item.id, status: 'Paid' }),
          })
        )
      );
      toast.success('Withdrawal requested and marked as paid');
      loadData();
    } catch {
      toast.error('Failed to withdraw');
    }
  };

  return (
    <ContributorLayout>
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Payouts
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              View your completed payout history.
            </p>
          </div>
          <button
            onClick={handleWithdraw}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Request Withdrawal
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Paid Out</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              ${totalPaid.toLocaleString()}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Pending</p>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              ${pendingAmount.toLocaleString()}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Transactions</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {payouts.length}
            </p>
          </div>
        </div>

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
