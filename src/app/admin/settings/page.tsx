'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/lib/auth';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { DistributionMode, RevenueDistributionService } from '@/lib/services/RevenueDistributionService';

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<DistributionMode>('mock');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMode = () => {
    try {
      const service = RevenueDistributionService.getInstance();
      setMode(service.getMode());
    } catch (err: any) {
      setError(err.message || 'Unable to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role !== 'admin') {
      router.replace('/unauthorized');
      return;
    }
    loadMode();
  }, [user, router]);

  if (!user || user.role !== 'admin') return null;

  const saveMode = () => {
    try {
      const service = RevenueDistributionService.getInstance();
      service.setMode(mode);
      toast.success('Settings saved');
    } catch (err: any) {
      toast.error(err.message || 'Unable to save settings');
    }
  };

  const resetMode = () => {
    setMode('mock');
    const service = RevenueDistributionService.getInstance();
    service.setMode('mock');
    toast.success('Settings reset to Mock');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Settings</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Configure platform preferences and administrative options.
          </p>
        </div>

        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <p className="text-gray-600 dark:text-gray-400">Loading settings...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 rounded-lg p-4">
            <p className="font-semibold">Error</p>
            <p className="text-sm">{error}</p>
            <button
              onClick={loadMode}
              className="mt-3 px-4 py-2 text-sm font-medium bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100 rounded-lg"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Distribution Mode</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Choose how the platform distributes revenue. This setting is saved locally for admins.
            </p>
            <div className="space-y-3">
              {(['mock', 'testnet', 'production'] as DistributionMode[]).map(option => (
                <label
                  key={option}
                  className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <input
                    type="radio"
                    name="distributionMode"
                    value={option}
                    checked={mode === option}
                    onChange={(e) => setMode(e.target.value as DistributionMode)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white capitalize">{option} mode</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {option === 'mock' && 'Simulated transfers for demos and QA.'}
                      {option === 'testnet' && 'Use test networks for end-to-end testing with play funds.'}
                      {option === 'production' && 'Live transfers on mainnet. Use only when fully ready.'}
                    </p>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={resetMode}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg"
              >
                Reset
              </button>
              <button
                onClick={saveMode}
                className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
