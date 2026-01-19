'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { ContributorLayout } from '@/components/layouts/ContributorLayout';
import { Project } from '@/lib/types';

export default function ContributorProjectsPage() {
  const { user, isReady } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isReady) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    fetch('/api/projects')
      .then(r => {
        if (!r.ok) throw new Error('Failed to load projects');
        return r.json();
      })
      .then((data: Project[]) => {
        const userProjects = data.filter(p =>
          p.contributors.some(c => c.email === user.email)
        );
        setProjects(userProjects);
        setLoading(false);
      })
      .catch((err: any) => {
        setError(err.message || 'Failed to load projects');
        setLoading(false);
      });
  }, [user, isReady, router]);

  if (!isReady || !user || (user.role !== 'contributor' && user.role !== 'admin')) {
    return null;
  }

  return (
    <ContributorLayout>
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            My Projects
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            View all projects you're contributing to.
          </p>
        </div>

        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <p className="text-gray-600 dark:text-gray-400">Loading projects...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 rounded-lg p-4">
            <p className="font-semibold">Error</p>
            <p className="text-sm">{error}</p>
            <button
              onClick={() => router.refresh()}
              className="mt-3 px-4 py-2 text-sm font-medium bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100 rounded-lg"
            >
              Refresh
            </button>
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <p className="text-gray-600 dark:text-gray-400">No projects found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map(project => {
              const myContribution = project.contributors.find(c => c.email === user.email);
              return (
                <div
                  key={project.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="h-48 bg-gradient-to-br from-purple-500 to-blue-600 relative">
                    {project.coverImage && (
                      <img
                        src={project.coverImage}
                        alt={project.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute top-4 right-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        project.status === 'Active' ? 'bg-green-500 text-white' :
                        project.status === 'Completed' ? 'bg-blue-500 text-white' :
                        'bg-yellow-500 text-white'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {project.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {project.type}
                    </p>
                    {myContribution && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">My Role:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {myContribution.role}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Revenue Share:</span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {myContribution.revenueShare}%
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Total Earned:</span>
                          <span className="font-semibold text-green-600 dark:text-green-400">
                            ${myContribution.totalEarned.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => router.push(`/contributor/revenue?projectId=${project.id}`)}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        View Earnings
                      </button>
                      <button
                        onClick={() => router.push(`/contributor/dashboard?projectId=${project.id}`)}
                        className="text-sm text-gray-700 dark:text-gray-200 hover:underline"
                      >
                        View Rights
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ContributorLayout>
  );
}
