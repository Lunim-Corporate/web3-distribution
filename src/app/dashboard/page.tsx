'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PaymentSplitter } from '@/components/dashboard/PaymentSplitter';
import { SmartContractPanel } from '@/components/dashboard/SmartContractPanel';
import { RevenueSnapshot } from '@/components/dashboard/RevenueSnapshot';
import { UpcomingMilestones } from '@/components/dashboard/UpcomingMilestones';
import { NotifyWidget } from '@/components/dashboard/NotifyWidget';
import { useAuth } from '@/lib/auth';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { ChartsPanel } from '@/components/dashboard/ChartsPanel';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { AddProjectModal } from '@/components/dashboard/AddProjectModal';
import { TraditionalContractsPanel } from '@/components/dashboard/TraditionalContractsPanel';
import { formatCurrency, formatPercentage, formatDate, getStatusColor } from '@/lib/utils';
import { toast } from 'react-hot-toast';

// Simple Dashboard Layout
const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const { user, logout, settings, setNotifyResurfacingHours } = useAuth();

  useEffect(() => {
    const savedTheme = localStorage.getItem('crt_theme');
    if (savedTheme === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    const theme = newIsDark ? 'dark' : 'light';
    localStorage.setItem('crt_theme', theme);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Creative Rights & Revenue Tracker
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              RISIDIO Capstone Project Dashboard
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Theme toggle */}
            <Button variant="ghost" size="sm" onClick={toggleTheme} className="p-2">
              {isDark ? '☀️' : '🌙'}
            </Button>

            {/* Resurfacing Interval */}
            <select
              value={settings?.notifyResurfacingHours || 24}
              onChange={(e) => setNotifyResurfacingHours(Number(e.target.value))}
              className="px-2 py-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100"
              title="Notification resurface interval"
            >
              <option value={2}>2h</option>
              <option value={6}>6h</option>
              <option value={12}>12h</option>
              <option value={24}>24h</option>
            </select>
            
            {/* Notifications */}
            <div className="relative">
              <Button variant="ghost" size="sm" className="p-2 relative">
                🔔
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  3
                </span>
              </Button>
            </div>

            {/* User info */}
            <div className="flex items-center space-x-2">
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face"
                alt="User"
                className="w-8 h-8 rounded-full"
              />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {user?.name || 'Guest'}
              </span>
              {user?.role === 'admin' && (
                <Link href="/admin" className="text-xs px-2 py-1 rounded bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 ml-2 hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors">
                  Manage Users
                </Link>
              )}
              {user && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void logout()}
                  className="ml-1"
                >
                  Logout
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

// Revenue Metrics Component
const RevenueMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState<{
    totalRevenue: number;
    pendingPayments: number;
    activeProjects: number;
    contributors: number;
  } | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [revenueRes, projectsRes, usersRes] = await Promise.all([
          fetch('/api/revenue').then((r) => r.json()),
          fetch('/api/projects').then((r) => r.json()),
          fetch('/api/users').then((r) => r.json()),
        ]);

        const totalRevenue = (revenueRes || []).reduce((sum: number, r: unknown) => {
          const row = r as Record<string, unknown>;
          if (row && typeof row.amount === 'number') return sum + row.amount;
          return sum;
        }, 0);

        const pendingPayments = (revenueRes || []).reduce((sum: number, r: unknown) => {
          const row = r as Record<string, unknown>;
          if (row && row.status !== 'Paid' && typeof row.amount === 'number') return sum + row.amount;
          return sum;
        }, 0);

        const activeProjects = (projectsRes || []).filter((p: unknown) => {
          const row = p as Record<string, unknown>;
          const s = String(row?.status ?? '').toLowerCase();
          return s === 'active' || s === 'in progress' || s === 'in_progress' || s === 'in-progress';
        }).length;

        const contributors = (usersRes || []).length;

        setMetrics({
          totalRevenue,
          pendingPayments,
          activeProjects,
          contributors,
        });
      } catch {
        // If metrics fail, keep UI readable.
        setMetrics({
          totalRevenue: 0,
          pendingPayments: 0,
          activeProjects: 0,
          contributors: 0,
        });
      }
    })();
  }, []);

  if (!metrics) return null;

  const cards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(metrics.totalRevenue),
      change: 23.1,
      icon: '💰',
      color: 'bg-blue-500',
    },
    {
      title: 'Pending Payments',
      value: formatCurrency(metrics.pendingPayments),
      change: -8.2,
      icon: '⏳',
      color: 'bg-yellow-500',
    },
    {
      title: 'Active Projects',
      value: metrics.activeProjects.toString(),
      change: 15.8,
      icon: '📁',
      color: 'bg-green-500',
    },
    {
      title: 'Contributors',
      value: metrics.contributors.toString(),
      icon: '👥',
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((metric, index) => (
        <Card key={index} className="relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-full h-1 ${metric.color}`} />
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {metric.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metric.value}
                </p>
                {metric.change && (
                  <div className="flex items-center mt-2">
                    <span className={`text-sm font-medium ${
                      metric.change > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {metric.change > 0 ? '↗' : '↘'} {formatPercentage(Math.abs(metric.change))}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">vs last month</span>
                  </div>
                )}
              </div>
              <div className="text-2xl">{metric.icon}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Projects Overview Component with Revenue Sharing Dropdown
const ProjectsOverview: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [projects, setProjects] = useState<
    Array<{
      id: string;
      name: string;
      type: string;
      status: string;
      progress: number;
      totalRevenue: number; // GBP
      coverImage?: string;
      contributors: Array<{
        id: string;
        name: string;
        avatar?: string;
        role: string;
        revenueShare: number;
        totalEarned: number; // GBP
      }>;
    }>
  >([]);

  useEffect(() => {
    void (async () => {
      try {
        const list = await fetch('/api/projects').then((r) => r.json());
        const projectRows = Array.isArray(list) ? list : [];
        const ids = projectRows.slice(0, 5).map((p) => String(p.id ?? ''));

        const details = await Promise.all(
          ids.map(async (id) => {
            const res = await fetch(`/api/projects/${id}`);
            const json = await res.json();
            return json?.data;
          })
        );

        const mapped = details
          .filter((p) => p)
          .map((p) => {
            const pr = p as Record<string, unknown>;
            const coverImage =
              typeof pr.cover_image_url === 'string'
                ? pr.cover_image_url
                : typeof pr.cover_image === 'string'
                  ? pr.cover_image
                  : undefined;

            const totalRevenue =
              Number(pr.total_revenue ?? pr.totalRevenue ?? 0) / 100;

            const contributorsRaw = (pr.project_contributors ??
              []) as Array<Record<string, unknown>>;

            const contributors = contributorsRaw.map((pc) => {
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
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              {/* Project Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <img
                    src={project.coverImage}
                    alt={project.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {project.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {project.type} • {project.contributors.length} contributors
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {project.progress}% complete
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(project.totalRevenue)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Total Revenue
                  </p>
                </div>
              </div>

              {/* Revenue Sharing Breakdown */}
              <div>
                <h5 className="font-medium text-gray-900 dark:text-white mb-3">
                  Revenue Sharing Breakdown:
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {project.contributors.map((contributor) => (
                    <div
                      key={contributor.id}
                      className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <img
                        src={contributor.avatar}
                        alt={contributor.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {contributor.name}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {contributor.role}
                        </p>
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

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Progress</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {project.progress}%
                  </span>
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

// Rights Ledger Component
const RightsLedger: React.FC = () => {
  const [rights, setRights] = useState<
    Array<{
      id: string;
      projectName: string;
      rightsType: string;
      owner: string;
      revenueShare: number;
      status: string;
      expirationDate: string;
    }>
  >([]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/rights');
        const json = await res.json();
        setRights(Array.isArray(json) ? json : []);
      } catch {
        setRights([]);
      }
    })();
  }, []);

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Creative Rights Overview</CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Track ownership and rights distribution across all projects
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 font-medium text-gray-700 dark:text-gray-300">Project</th>
                <th className="text-left py-3 font-medium text-gray-700 dark:text-gray-300">Rights Type</th>
                <th className="text-left py-3 font-medium text-gray-700 dark:text-gray-300">Owner</th>
                <th className="text-left py-3 font-medium text-gray-700 dark:text-gray-300">Share</th>
                <th className="text-left py-3 font-medium text-gray-700 dark:text-gray-300">Status</th>
                <th className="text-left py-3 font-medium text-gray-700 dark:text-gray-300">Expires</th>
              </tr>
            </thead>
            <tbody>
              {rights.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-sm text-gray-600 dark:text-gray-400">
                    No creative rights found.
                  </td>
                </tr>
              ) : (
                rights.map((right) => (
                <tr
                  key={right.id}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="py-4 font-medium text-gray-900 dark:text-white">
                    {right.projectName}
                  </td>
                  <td className="py-4 text-gray-600 dark:text-gray-400">
                    {right.rightsType}
                  </td>
                  <td className="py-4 text-gray-900 dark:text-white">
                    {right.owner}
                  </td>
                  <td className="py-4 font-medium text-gray-900 dark:text-white">
                    {formatPercentage(right.revenueShare)}
                  </td>
                  <td className="py-4">
                    <Badge variant={getStatusColor(right.status)}>
                      {right.status}
                    </Badge>
                  </td>
                  <td className="py-4 text-gray-600 dark:text-gray-400">
                    {formatDate(right.expirationDate)}
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

// Main Dashboard Page
export default function DashboardPage() {
  const router = useRouter();
  const { user, settings } = useAuth();
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace('/login');
    }
  }, [user, router]);

  return (
    <DashboardLayout>
      <NotifyWidget resurfacingHours={settings?.notifyResurfacingHours || 24} />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <SidebarNav />
        {/* Welcome Section */}
        <div className="lg:col-span-7 space-y-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Welcome back! 👋
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Here&apos;s your creative rights and revenue overview. Manage payments, track rights, and interact with smart contracts.
          </p>
          
          {/* Revenue Metrics */}
          <RevenueMetrics />

          {/* Revenue Snapshot with filters */}
          <RevenueSnapshot />

          {/* Charts to match screenshots */}
          <ChartsPanel />

          {/* Projects Overview with Revenue Sharing */}
          <ProjectsOverview />

          {/* Payment Splitter */}
          <PaymentSplitter />

          {/* Smart Contract Panel */}
          <SmartContractPanel />

          {/* Traditional Contracts for non-web3 flows */}
          <TraditionalContractsPanel />

          {/* Rights Ledger */}
          <div id="rights-ledger">
            <RightsLedger />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            <Button 
              variant="primary" 
              onClick={() => setIsAddProjectOpen(true)}
              className="px-6 py-3"
            >
              Add Project
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => { document.getElementById('payment-splitter')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="px-6 py-3"
            >
              Record Payment
            </Button>
            <Button 
              variant="ghost" 
              onClick={async () => {
                try {
                  const jsPdfModule: unknown = await import('jspdf');
                  type JsPDFConstructor = new () => {
                    setFontSize: (n: number) => void;
                    text: (t: string, x: number, y: number) => void;
                    addPage: () => void;
                    save: (name: string) => void;
                  };

                  const mod = jsPdfModule as {
                    default?: JsPDFConstructor;
                    jsPDF?: JsPDFConstructor;
                  };
                  const jsPDFCtor = mod.default ?? mod.jsPDF;
                  if (!jsPDFCtor) throw new Error('Failed to load jsPDF');
                  const res = await fetch('/api/revenue');
                  const data: unknown = await res.json();
                  const doc = new jsPDFCtor();
                  doc.setFontSize(16);
                  doc.text('Revenue Report', 14, 16);
                  doc.setFontSize(11);
                  let y = 26;
                  const rows = Array.isArray(data) ? data : [];
                  rows.forEach((r, idx) => {
                    const row = r as Record<string, unknown>;
                    const date = row.date ? new Date(String(row.date)).toLocaleDateString() : '-';
                    const projectName = typeof row.projectName === 'string' ? row.projectName : 'Project';
                    const amount = typeof row.amount === 'number' ? row.amount : Number(row.amount) || 0;
                    const source = typeof row.source === 'string' ? row.source : 'Direct Payment';
                    const line = `${idx + 1}. ${date}  ${projectName}  ${formatCurrency(amount)}  (${source})`;
                    doc.text(line, 14, y);
                    y += 8;
                    if (y > 280) {
                      doc.addPage();
                      y = 20;
                    }
                  });
                  doc.save('revenue_report.pdf');
                  toast.success('Report generated successfully!');
                } catch (error) {
                  console.error('Error generating PDF:', error);
                  toast.error('Failed to generate report');
                }
              }}
              className="px-6 py-3"
            >
              Generate Report (PDF)
            </Button>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-3 space-y-6">
          <div id="upcoming-milestones">
            <UpcomingMilestones />
          </div>
          <RecentActivity />
        </div>
      </div>
      <AddProjectModal isOpen={isAddProjectOpen} onClose={() => setIsAddProjectOpen(false)} />
    </DashboardLayout>
  );
}
