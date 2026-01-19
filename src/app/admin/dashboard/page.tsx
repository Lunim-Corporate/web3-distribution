'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { RevenueDistributionService, DistributionMode } from '@/lib/services/RevenueDistributionService';
import { toast } from 'react-hot-toast';
import { calculateDashboardKPIs, DashboardKPIs } from '@/lib/dashboardMetrics';
import RevenueSnapshot from '@/components/dashboard/RevenueSnapshot';
import { PaymentSplitter } from '@/components/dashboard/PaymentSplitter';
import UpcomingMilestones from '@/components/dashboard/UpcomingMilestones';
import RecentActivity from '@/components/dashboard/RecentActivity';
import { SmartContractPanel } from '@/components/dashboard/SmartContractPanel';
import TraditionalContractsPanel from '@/components/dashboard/TraditionalContractsPanel';
import RightsOverview from '@/components/dashboard/RightsOverview';

export default function AdminDashboardPage() {
  const { user, isReady } = useAuth();
  const router = useRouter();
  const [distributionMode, setDistributionMode] = useState<DistributionMode>('mock');
  const [kpis, setKpis] = useState<DashboardKPIs>({
    totalRevenue: 0,
    pendingPayments: 0,
    activeProjects: 0,
    contributors: 0,
    monthOverMonthChange: 0,
  });

  useEffect(() => {
    if (!isReady) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    const distributionService = RevenueDistributionService.getInstance();
    setDistributionMode(distributionService.getMode());

    // Load stats
    Promise.all([
      fetch('/api/projects').then(r => r.json()),
      fetch('/api/revenue').then(r => r.json()),
      fetch('/api/users').then(r => r.json()),
    ])
      .then(([projects, revenue, users]) => {
        const computed = calculateDashboardKPIs({
          revenue,
          projects,
          users,
        });
        setKpis(computed);
      })
      .catch(console.error);
  }, [user, isReady, router]);

  if (!isReady || !user || user.role !== 'admin') {
    return null;
  }

  const handleModeChange = (mode: DistributionMode) => {
    const distributionService = RevenueDistributionService.getInstance();
    distributionService.setMode(mode);
    setDistributionMode(mode);
    toast.success(`Distribution mode set to ${mode}`);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Admin Dashboard
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Manage the entire platform from here.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Projects</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {kpis.activeProjects}
              </p>
            </div>
            <div className="text-3xl">🎬</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                ${kpis.totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Payouts</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                ${kpis.pendingPayments.toLocaleString()}
              </p>
            </div>
            <div className="text-3xl">⏳</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Contributors</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {kpis.contributors}
              </p>
            </div>
            <div className="text-3xl">🤝</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">MoM Revenue Change</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {kpis.monthOverMonthChange.toFixed(1)}%
              </p>
            </div>
            <div className="text-3xl">📈</div>
          </div>
        </div>
      </div>

      {/* Distribution Mode Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Revenue Distribution Mode
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Control how revenue is distributed across the platform.
        </p>

        <div className="space-y-3">
          <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <input
              type="radio"
              name="mode"
              value="mock"
              checked={distributionMode === 'mock'}
              onChange={(e) => handleModeChange(e.target.value as DistributionMode)}
              className="mt-1"
            />
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-white">Mock Mode</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Simulate distributions without actual blockchain transactions. Perfect for testing and development.
              </p>
            </div>
            {distributionMode === 'mock' && (
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                Active
              </span>
            )}
          </label>

          <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <input
              type="radio"
              name="mode"
              value="testnet"
              checked={distributionMode === 'testnet'}
              onChange={(e) => handleModeChange(e.target.value as DistributionMode)}
              className="mt-1"
            />
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-white">Testnet Mode</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Use testnet networks (Mumbai, Goerli) for real blockchain transactions with test tokens.
              </p>
            </div>
            {distributionMode === 'testnet' && (
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                Active
              </span>
            )}
          </label>

            <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <input
                type="radio"
                name="mode"
                value="production"
                checked={distributionMode === 'production'}
                onChange={(e) => handleModeChange(e.target.value as DistributionMode)}
                className="mt-1"
              />
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">Production Mode</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Use mainnet for real transactions with actual cryptocurrency. Use with caution.
                </p>
              </div>
              {distributionMode === 'production' && (
                <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded">
                  Active
                </span>
              )}
            </label>
          </div>
        </div>

        {/* Dashboard Modules */}
        <RevenueSnapshot />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PaymentSplitter />
          <SmartContractPanel />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RightsOverview />
          <TraditionalContractsPanel />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UpcomingMilestones />
          <RecentActivity />
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/admin/users')}
              className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <p className="font-semibold text-gray-900 dark:text-white">Manage Users</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Invite users and manage roles
              </p>
            </button>
            <button
              onClick={() => router.push('/admin/projects')}
              className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <p className="font-semibold text-gray-900 dark:text-white">View Projects</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Monitor all projects
              </p>
            </button>
            <button
              onClick={() => router.push('/admin/revenue')}
              className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <p className="font-semibold text-gray-900 dark:text-white">Revenue Overview</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Track all revenue streams
              </p>
            </button>
          </div>
        </div>
      </div>
  );
}
