'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { ContributorLayout } from '@/components/layouts/ContributorLayout';
import { DistributionItem, Project } from '@/lib/types';

export default function ContributorDashboardPage() {
  const { user, isReady } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [revenue, setRevenue] = useState<DistributionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isReady) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    Promise.all([
      fetch('/api/projects').then(r => r.json()),
      fetch(`/api/distributions?contributorUserId=${encodeURIComponent(user.id)}`).then(r => r.json()),
    ])
      .then(([projectsData, revenueData]) => {
        // Filter data for current user
        const userProjects = projectsData.filter((p: Project) =>
          p.contributors.some(c => c.email === user.email)
        );
        const projectId = searchParams.get('projectId');
        if (projectId && user.role !== 'admin' && !userProjects.some(p => p.id === projectId)) {
          setProjects([]);
          setRevenue([]);
          setError('Not authorized');
          setLoading(false);
          return;
        }
        const userRevenue = (revenueData.items || []) as DistributionItem[];

        setProjects(userProjects);
        setRevenue(userRevenue);
        setLoading(false);
      })
      .catch((err: any) => {
        setError(err.message || 'Failed to load data');
        setLoading(false);
      });
  }, [user, isReady, router, searchParams]);

  if (!isReady || !user || (user.role !== 'contributor' && user.role !== 'admin')) {
    return null;
  }

  const totalEarnings = revenue.reduce((sum, r) => sum + r.amount, 0);
  const pendingPayments = 0;
  const activeProjects = projects.filter(p => p.status === 'Active').length;

  return (
    <ContributorLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome back, {user.name}!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Here's an overview of your contributions and earnings.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/contributor/revenue')}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg"
            >
              Go to Earnings
            </button>
            <button
              onClick={() => router.push('/contributor/payouts')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Withdraw
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 rounded-lg p-4">
            <p className="font-semibold">Error loading data</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  ${totalEarnings.toLocaleString()}
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
                  ${pendingPayments.toLocaleString()}
                </p>
              </div>
              <div className="text-3xl">⏳</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Projects</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {activeProjects}
                </p>
              </div>
              <div className="text-3xl">🎬</div>
            </div>
          </div>
        </div>

        {/* Recent Projects */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            My Projects
          </h3>
          {loading ? (
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          ) : projects.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">No projects yet.</p>
          ) : (
            <div className="space-y-3">
              {projects.slice(0, 5).map(project => {
                const myContribution = project.contributors.find(c => c.email === user.email);
                return (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">{project.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {project.type} • {myContribution?.role || 'Contributor'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {myContribution?.revenueShare || 0}% share
                      </p>
                      <span className={`text-xs px-2 py-1 rounded ${
                        project.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        project.status === 'Completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Revenue */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Revenue
          </h3>
        {loading ? (
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        ) : revenue.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">No revenue yet.</p>
        ) : (
          <div className="space-y-3">
            {revenue.slice(0, 5).map(rev => (
              <div
                key={rev.id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">{rev.projectName}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(rev.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    ${rev.amount.toLocaleString()}
                  </p>
                  <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Confirmed
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </ContributorLayout>
  );
}
