'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { CreatorLayout } from '@/components/layouts/CreatorLayout';
import { Project, Revenue, CreativeRight } from '@/lib/types';

export default function CreatorDashboardPage() {
  const { user, isReady } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [revenue, setRevenue] = useState<Revenue[]>([]);
  const [rights, setRights] = useState<CreativeRight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isReady) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    Promise.all([
      fetch('/api/projects').then(r => r.json()),
      fetch('/api/revenue').then(r => r.json()),
      fetch('/api/rights').then(r => r.json()),
    ])
      .then(([projectsData, revenueData, rightsData]) => {
        // Filter data for creator - only show projects they created/own
        const creatorProjects = projectsData.filter((p: Project) => p.creatorId === user.id);
        
        // Get project IDs for this creator
        const creatorProjectIds = creatorProjects.map((p: Project) => p.id);
        
        // Only show revenue from creator's own projects
        const creatorRevenue = revenueData.filter((r: Revenue) => 
          creatorProjectIds.includes(r.projectId)
        );
        
        // Only show rights owned by this creator
        const creatorRights = rightsData.filter((r: CreativeRight) => r.ownerId === user.id);

        setProjects(creatorProjects);
        setRevenue(creatorRevenue);
        setRights(creatorRights);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user, isReady, router]);

  if (!isReady || !user || (user.role !== 'creator' && user.role !== 'admin')) {
    return null;
  }

  const totalEarnings = revenue.reduce((sum, r) => sum + r.amount, 0);
  const pendingPayments = revenue
    .filter(r => r.status === 'Pending' || r.status === 'Processing')
    .reduce((sum, r) => sum + r.amount, 0);
  const activeProjects = projects.filter(p => p.status === 'Active').length;
  const activeRights = rights.filter(r => r.status === 'Active').length;

  return (
    <CreatorLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {user.name}!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Here's an overview of your projects and earnings.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">My Total Revenue</p>
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">My Active Projects</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {activeProjects}
                </p>
              </div>
              <div className="text-3xl">🎬</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">My Active Rights</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {activeRights}
                </p>
              </div>
              <div className="text-3xl">⚖️</div>
            </div>
          </div>
        </div>

        {/* My Projects */}
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
              {projects.slice(0, 5).map(project => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">{project.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{project.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      ${project.totalRevenue.toLocaleString()}
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
              ))}
            </div>
          )}
        </div>

        {/* My Recent Revenue */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            My Recent Revenue
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
                    <p className="text-sm text-gray-600 dark:text-gray-400">{rev.source} • {rev.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      ${rev.amount.toLocaleString()}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded ${
                      rev.status === 'Paid' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      rev.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}>
                      {rev.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </CreatorLayout>
  );
}
