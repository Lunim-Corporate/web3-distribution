'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import {
  getProjectById,
  getProjectContributors,
  getPayments,
  recordPayment,
  addContributor,
  getCreativeRights,
  getMilestones,
} from '@/lib/database';
import { formatCurrencyFromCentsGB } from '@/lib/currency';
import { normalizePaymentStatus } from '@/lib/utils';

export default function ProjectPage() {
  const params = useParams();
  const { user } = useAuth();
  const projectId = params?.id as string;

  const [project, setProject] = useState<{
    id: string;
    name: string;
    description: string;
    type?: string | null;
    status?: string | null;
    created_at?: string | null;
    total_revenue?: number | null;
    progress?: number | null;
    cover_image_url?: string | null;
    cover_image?: string | null;
  } | null>(null);
  const [contributors, setContributors] = useState<
    Array<{
      id: string;
      role: string;
      revenue_share: number;
      total_earned?: number | null;
      users?: {
        name?: string | null;
        email?: string | null;
      } | null;
    }>
  >([]);
  const [payments, setPayments] = useState<Array<{ id: string; amount: number; payment_date: string; source?: string; status?: string }>>([]);
  const [rights, setRights] = useState<
    Array<{
      id: string;
      rights_type?: string | null;
      users?: {
        name?: string | null;
        email?: string | null;
      } | null;
      revenue_share?: number | null;
      status?: string | null;
      expiration_date?: string | null;
    }>
  >([]);
  const [milestones, setMilestones] = useState<
    Array<{
      id: string;
      title: string;
      date: string;
      current_amount?: number | null;
      target_amount?: number | null;
      deadline?: string | null;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [showContributorModal, setShowContributorModal] = useState(false);
  const [contributorForm, setContributorForm] = useState({
    name: '',
    email: '',
    role: '',
    revenue_share: 0,
  });

  useEffect(() => {
    if (!projectId) return;
    loadProject();
  }, [projectId]);

  async function loadProject() {
    try {
      const [proj, contribs, pays, rts, mls] = await Promise.all([
        getProjectById(projectId),
        getProjectContributors(projectId),
        getPayments(projectId),
        getCreativeRights(projectId),
        getMilestones(projectId),
      ]);
      setProject(proj);
      setContributors(contribs || []);
      const normalizedPayments = (pays || []).map((p) => {
        const pr = p as Record<string, unknown>;
        const amount = typeof pr.amount === 'number' ? pr.amount : Number(pr.amount_cents ?? 0);
        const status = normalizePaymentStatus(pr.status);
        return {
          id: String(pr.id ?? ''),
          amount,
          payment_date: String(pr.payment_date ?? pr.date ?? ''),
          source: typeof pr.source === 'string' ? pr.source : undefined,
          status,
        };
      });
      setPayments(normalizedPayments);
      setRights(rts || []);
      setMilestones(mls || []);
    } catch (error) {
      console.error('Failed to load project:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRecordPayment() {
    try {
      await recordPayment({
        project_id: projectId,
        amount_cents: 5000,
        source: 'Manual Payment',
      });
      loadProject();
    } catch (error) {
      console.error('Failed to record payment:', error);
    }
  }

  async function handleAddContributor(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    try {
      await addContributor({
        project_id: projectId,
        user_id: `user-${Date.now()}`,
        role: contributorForm.role,
        revenue_share: contributorForm.revenue_share,
      });
      setContributorForm({ name: '', email: '', role: '', revenue_share: 0 });
      setShowContributorModal(false);
      loadProject();
    } catch (error) {
      console.error('Failed to add contributor:', error);
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!project) {
    return <div className="p-8 text-center">Project not found</div>;
  }

  return (
    <main className="min-h-screen bg-gray-50 pt-16">
      {/* Header */}
      <header className="bg-white shadow sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link href="/dashboard" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="text-sm text-gray-600">{project.description}</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Info Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Project Details</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-semibold">{project.type || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-semibold">{project.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-semibold">
                    {project.created_at ? new Date(project.created_at).toLocaleDateString('en-GB') : '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Contributors Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Contributors ({contributors.length})</h2>
                <button
                  onClick={() => setShowContributorModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  + Add Contributor
                </button>
              </div>
              <div className="space-y-3">
                {contributors.length === 0 ? (
                  <p className="text-gray-600">No contributors yet</p>
                ) : (
                  contributors.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-3 border border-gray-200 rounded">
                      <div>
                        <div className="font-semibold">{c.users?.name || 'Unknown'}</div>
                        <div className="text-sm text-gray-600">{c.role}</div>
                        <div className="text-xs text-gray-500">{c.users?.email}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-blue-600">{c.revenue_share}%</div>
                        <div className="text-sm text-gray-600">
                          Earned: {formatCurrencyFromCentsGB(c.total_earned)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Payments Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Payment History</h2>
                <button
                  onClick={handleRecordPayment}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                >
                  Record Payment
                </button>
              </div>
              <div className="space-y-2">
                {payments.length === 0 ? (
                  <p className="text-gray-600">No payments recorded</p>
                ) : (
                  payments.map((p) => (
                    <div key={p.id} className="flex justify-between items-center p-3 border border-gray-200 rounded">
                      <div>
                        <div className="font-semibold">{p.source || 'Payment'}</div>
                        <div className="text-sm text-gray-600">
                          {p.payment_date
                            ? new Date(p.payment_date).toLocaleDateString('en-GB')
                            : '-'}
                        </div>
                      </div>
                      <div className="font-bold text-green-600">
                        +{formatCurrencyFromCentsGB(p.amount)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Rights Section */}
            {rights.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">Creative Rights</h2>
                <div className="space-y-3">
                  {rights.map((r) => (
                    <div key={r.id} className="p-3 border border-orange-200 bg-orange-50 rounded">
                      <div className="font-semibold">{r.rights_type}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        Owner: {r.users?.name || 'Unknown'}
                      </div>
                      <div className="flex justify-between mt-2">
                        <span className="text-sm">{r.revenue_share}% Revenue Share</span>
                        <span className="text-sm font-semibold">{r.status}</span>
                      </div>
                      {r.expiration_date && (
                        <div className="text-xs text-gray-500 mt-1">
                          Expires: {r.expiration_date}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Milestones Section */}
            {milestones.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">Milestones</h2>
                <div className="space-y-3">
                  {milestones.map((m) => (
                    <div key={m.id} className="p-3 border border-purple-200 bg-purple-50 rounded">
                      <div className="font-semibold">{m.title}</div>
                      <div className="mt-2 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{
                            width: `${Math.min(
                              (Number(m.current_amount ?? 0) / Math.max(Number(m.target_amount ?? 0), 1)) * 100,
                              100
                            )}%`,
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600 mt-1">
                        <span>{formatCurrencyFromCentsGB(m.current_amount)}</span>
                        <span>{formatCurrencyFromCentsGB(m.target_amount)}</span>
                      </div>
                      {m.deadline && (
                        <div className="text-xs text-gray-500 mt-1">Deadline: {m.deadline}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Revenue Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm text-gray-600 mb-2">Total Revenue</h3>
              <div className="text-3xl font-bold text-blue-600">
                {formatCurrencyFromCentsGB(project.total_revenue || 0)}
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm text-gray-600 mb-1">Progress</div>
                <div className="text-2xl font-bold mb-2">{project.progress || 0}%</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${project.progress || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Summary Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold mb-4">Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Contributors:</span>
                  <span className="font-semibold">{contributors.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payments:</span>
                  <span className="font-semibold">{payments.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Rights:</span>
                  <span className="font-semibold">{rights.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Milestones:</span>
                  <span className="font-semibold">{milestones.length}</span>
                </div>
              </div>
            </div>

            {/* Actions Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold mb-4">Actions</h3>
              <div className="space-y-2">
                <Link
                  href={`/project/${projectId}/edit`}
                  className="block px-4 py-2 bg-blue-600 text-white rounded text-center hover:bg-blue-700 text-sm font-semibold"
                >
                  Edit Project
                </Link>
                <button
                  onClick={() => setShowContributorModal(true)}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm font-semibold"
                >
                  Add Contributor
                </button>
                <Link
                  href={`/project/${projectId}/rights`}
                  className="block px-4 py-2 bg-orange-600 text-white rounded text-center hover:bg-orange-700 text-sm font-semibold"
                >
                  Manage Rights
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Add Contributor Modal */}
      {showContributorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Add Contributor</h2>
            <form onSubmit={handleAddContributor} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={contributorForm.name}
                  onChange={(e) => setContributorForm({ ...contributorForm, name: e.target.value })}
                  placeholder="Full name"
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Email</label>
                <input
                  type="email"
                  value={contributorForm.email}
                  onChange={(e) => setContributorForm({ ...contributorForm, email: e.target.value })}
                  placeholder="email@example.com"
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Role *</label>
                <input
                  type="text"
                  required
                  value={contributorForm.role}
                  onChange={(e) => setContributorForm({ ...contributorForm, role: e.target.value })}
                  placeholder="e.g., Producer, Artist, Engineer"
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Revenue Share (%) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  value={contributorForm.revenue_share}
                  onChange={(e) =>
                    setContributorForm({ ...contributorForm, revenue_share: Number(e.target.value) })
                  }
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowContributorModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
                >
                  Add Contributor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}