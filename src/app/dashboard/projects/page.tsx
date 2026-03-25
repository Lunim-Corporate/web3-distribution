'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PaymentSplitter } from '@/components/dashboard/PaymentSplitter';
import { UpcomingMilestones } from '@/components/dashboard/UpcomingMilestones';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { useAuth } from '@/lib/auth';
import { formatCurrency, formatPercentage, getStatusColor } from '@/lib/utils';

type ContributorRow = {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  revenueShare: number;
  totalEarned: number; // GBP
};

type ProjectRow = {
  id: string;
  name: string;
  type: string;
  status: string;
  progress: number;
  totalRevenue: number; // GBP
  coverImage?: string;
  contributors: ContributorRow[];
};

const ProjectsOverviewReal: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [projects, setProjects] = useState<ProjectRow[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const list = await fetch('/api/projects').then((r) => r.json());
        const projectRows = Array.isArray(list) ? list : [];
        const ids = projectRows.slice(0, 5).map((p: Record<string, unknown>) => String(p.id ?? ''));

        const details = await Promise.all(
          ids.map(async (id) => {
            const res = await fetch(`/api/projects/${id}`);
            const json = await res.json();
            return json?.data as unknown;
          })
        );

        const mapped = details
          .filter((p) => Boolean(p))
          .map((p) => {
            const pr = p as Record<string, unknown>;

            const coverImage =
              typeof pr.cover_image_url === 'string'
                ? pr.cover_image_url
                : typeof pr.cover_image === 'string'
                  ? pr.cover_image
                  : undefined;

            const totalRevenue = Number(pr.total_revenue ?? pr.totalRevenue ?? 0) / 100;

            const contributorsRaw = (pr.project_contributors ?? []) as Array<Record<string, unknown>>;
            const contributors: ContributorRow[] = contributorsRaw.map((pc) => {
              const usersRow = pc.users as Record<string, unknown> | undefined;
              const avatar =
                (usersRow && typeof usersRow.avatar_url === 'string' ? usersRow.avatar_url : undefined) ??
                (usersRow && typeof usersRow.avatar === 'string' ? usersRow.avatar : undefined);

              return {
                id: String(pc.id ?? pc.user_id ?? ''),
                name:
                  (usersRow && typeof usersRow.name === 'string' ? usersRow.name : undefined) ??
                  (usersRow && typeof usersRow.email === 'string' ? usersRow.email : undefined) ??
                  'Unknown',
                avatar,
                role: String(pc.role ?? ''),
                revenueShare: Number(pc.revenue_share ?? 0),
                totalEarned: Number(pc.total_earned ?? 0) / 100,
              };
            });

            return {
              id: String(pr.id ?? ''),
              name: String(pr.name ?? ''),
              type: String(pr.type ?? 'Project'),
              status: String(pr.status ?? 'active'),
              progress: Number(pr.progress ?? 0),
              totalRevenue,
              coverImage,
              contributors,
            };
          });

        setProjects(mapped);
      } catch {
        setProjects([]);
      }
    })();
  }, []);

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Projects & Revenue Sharing</CardTitle>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {projects
            .filter((project) => !selectedProject || project.id === selectedProject)
            .map((project) => (
              <div key={project.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <img
                      src={project.coverImage || 'https://placehold.co/64x64'}
                      alt={project.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{project.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {project.type} • {project.contributors.length} contributors
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant={getStatusColor(project.status)}>{project.status}</Badge>
                        <span className="text-sm text-gray-500">{project.progress}% complete</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(project.totalRevenue)}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                  </div>
                </div>

                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white mb-3">Revenue Sharing Breakdown:</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {project.contributors.map((contributor) => (
                      <div
                        key={contributor.id}
                        className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <img
                          src={contributor.avatar || 'https://placehold.co/40x40'}
                          alt={contributor.name}
                          className="w-10 h-10 rounded-full"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white text-sm">{contributor.name}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{contributor.role}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                              {formatPercentage(contributor.revenueShare)}
                            </span>
                            <span className="text-xs font-medium text-gray-900 dark:text-white">
                              {formatCurrency(contributor.totalEarned)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Progress</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default function ProjectsPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) router.replace('/login');
  }, [user, router]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
        <SidebarNav />
        <div className="lg:col-span-10 space-y-8">
          <ProjectsOverviewReal />
          <PaymentSplitter />
          <div id="upcoming-milestones">
            <UpcomingMilestones />
          </div>
        </div>
      </div>
    </div>
  );
}

