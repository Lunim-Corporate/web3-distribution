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
        wallet_address?: string | null;
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
    wallet_address: '',
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
        name: contributorForm.name,
        email: contributorForm.email,
        role: contributorForm.role,
        revenue_share: contributorForm.revenue_share,
        wallet_address: contributorForm.wallet_address || '0x' + Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join(''),
      });
      setContributorForm({ name: '', email: '', role: '', revenue_share: 0, wallet_address: '' });
      setShowContributorModal(false);
      loadProject();
    } catch (error) {
      console.error('Failed to add contributor:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070B14] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-medium">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#070B14] flex items-center justify-center p-6">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 text-center max-w-md shadow-2xl">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-black text-white mb-3">Project Not Found</h2>
          <p className="text-gray-400 mb-6 text-sm">The project you are trying to view does not exist or has been deleted.</p>
          <Link href="/dashboard" className="inline-block bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-indigo-500/20">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#070B14] text-white pt-16">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#070B14]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors text-xs font-semibold flex items-center gap-2 mb-2 uppercase tracking-wider">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-black text-white tracking-tight">{project.name}</h1>
            <p className="text-sm text-gray-400 mt-1.5 max-w-3xl leading-relaxed">{project.description}</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Project Info Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
              <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Project Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white/3 border border-white/5 rounded-xl">
                  <span className="text-gray-500 text-[10px] uppercase tracking-wider block font-bold">Type</span>
                  <span className="font-bold text-white text-sm mt-1 block">{project.type || 'N/A'}</span>
                </div>
                <div className="p-4 bg-white/3 border border-white/5 rounded-xl">
                  <span className="text-gray-500 text-[10px] uppercase tracking-wider block font-bold">Status</span>
                  <span className="font-bold text-white text-sm mt-1 block uppercase tracking-wide">{project.status}</span>
                </div>
                <div className="p-4 bg-white/3 border border-white/5 rounded-xl">
                  <span className="text-gray-500 text-[10px] uppercase tracking-wider block font-bold">Created</span>
                  <span className="font-bold text-white text-sm mt-1 block">
                    {project.created_at ? new Date(project.created_at).toLocaleDateString('en-GB') : '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Contributors Section */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xs font-black uppercase tracking-widest text-gray-400">Contributors ({contributors.length})</h2>
                <button
                  onClick={() => setShowContributorModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:opacity-90 transition-all font-bold text-xs shadow-md shadow-indigo-500/10"
                >
                  + Add Contributor
                </button>
              </div>
              <div className="space-y-3">
                {contributors.length === 0 ? (
                  <p className="text-gray-400 text-sm italic">No contributors yet</p>
                ) : (
                  contributors.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-4 bg-white/3 border border-white/5 hover:border-white/10 rounded-xl transition-all">
                      <div>
                        <div className="font-bold text-white text-sm">{c.users?.name || 'Unknown'}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{c.role}</div>
                        <div className="text-[10px] text-indigo-300 font-mono mt-1 select-all">{c.users?.wallet_address || 'No wallet address'}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-indigo-400 text-sm">{c.revenue_share}% Share</div>
                        <div className="text-xs text-gray-300 mt-1 font-mono">
                          Earned: {formatCurrencyFromCentsGB(c.total_earned)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Payments Section */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xs font-black uppercase tracking-widest text-gray-400">Payment History</h2>
                <button
                  onClick={handleRecordPayment}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:opacity-90 transition-all font-bold text-xs shadow-md shadow-emerald-500/10"
                >
                  Record Payment
                </button>
              </div>
              <div className="space-y-3">
                {payments.length === 0 ? (
                  <p className="text-gray-400 text-sm italic">No payments recorded</p>
                ) : (
                  payments.map((p) => (
                    <div key={p.id} className="flex justify-between items-center p-4 bg-white/3 border border-white/5 hover:border-white/10 rounded-xl transition-all">
                      <div>
                        <div className="font-bold text-white text-sm">{p.source || 'Payment'}</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {p.payment_date
                            ? new Date(p.payment_date).toLocaleDateString('en-GB')
                            : '-'}
                        </div>
                      </div>
                      <div className="font-black text-emerald-400 font-mono">
                        +{formatCurrencyFromCentsGB(p.amount)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Rights Section */}
            {rights.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
                <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Creative Rights</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rights.map((r) => (
                    <div key={r.id} className="p-4 border border-orange-500/20 bg-orange-500/5 rounded-xl hover:border-orange-500/30 transition-all">
                      <div className="font-bold text-orange-400 text-sm">{r.rights_type}</div>
                      <div className="text-xs text-gray-300 mt-2">
                        Owner: <span className="text-white font-medium">{r.users?.name || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between mt-3 text-xs border-t border-white/5 pt-2">
                        <span className="text-gray-400">{r.revenue_share}% Revenue Share</span>
                        <span className="text-orange-300 font-semibold uppercase">{r.status}</span>
                      </div>
                      {r.expiration_date && (
                        <div className="text-[10px] text-gray-400 mt-2 font-mono">
                          Expires: {new Date(r.expiration_date).toLocaleDateString('en-GB')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Milestones Section */}
            {milestones.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
                <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Milestones</h2>
                <div className="space-y-4">
                  {milestones.map((m) => (
                    <div key={m.id} className="p-4 border border-purple-500/20 bg-purple-500/5 rounded-xl hover:border-purple-500/30 transition-all">
                      <div className="font-bold text-purple-400 text-sm mb-2">{m.title}</div>
                      <div className="bg-white/5 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full"
                          style={{
                            width: `${Math.min(
                              (Number(m.current_amount ?? 0) / Math.max(Number(m.target_amount ?? 0), 1)) * 100,
                              100
                            )}%`,
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-400 mt-2 font-mono">
                        <span>{formatCurrencyFromCentsGB(m.current_amount || 0)}</span>
                        <span>Target: {formatCurrencyFromCentsGB(m.target_amount || 0)}</span>
                      </div>
                      {m.deadline && (
                        <div className="text-[10px] text-gray-400 mt-2 font-mono">Deadline: {new Date(m.deadline).toLocaleDateString('en-GB')}</div>
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
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
              <h3 className="text-xs uppercase tracking-wider text-gray-400 font-black mb-2">Total Revenue</h3>
              <div className="text-3xl font-black text-indigo-400 font-mono">
                {formatCurrencyFromCentsGB(project.total_revenue || 0)}
              </div>
              <div className="mt-6 pt-6 border-t border-white/5">
                <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Progress</div>
                <div className="text-2xl font-black text-white mb-2 font-mono">{project.progress || 0}%</div>
                <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full"
                    style={{ width: `${project.progress || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Summary Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
              <h3 className="text-xs uppercase tracking-wider text-gray-400 font-black mb-4">Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Contributors</span>
                  <span className="font-bold text-white">{contributors.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Payments</span>
                  <span className="font-bold text-white">{payments.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Rights</span>
                  <span className="font-bold text-white">{rights.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Milestones</span>
                  <span className="font-bold text-white">{milestones.length}</span>
                </div>
              </div>
            </div>

            {/* Actions Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
              <h3 className="text-xs uppercase tracking-wider text-gray-400 font-black mb-4">Actions</h3>
              <div className="space-y-3">
                <Link
                  href={`/project/${projectId}/edit`}
                  className="block w-full py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-center text-white text-sm font-bold transition-all"
                >
                  Edit Project
                </Link>
                <button
                  onClick={() => setShowContributorModal(true)}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-center text-sm font-bold transition-all shadow-lg shadow-indigo-600/20"
                >
                  Add Contributor
                </button>
                <Link
                  href={`/project/${projectId}/rights`}
                  className="block w-full py-3 bg-orange-600/20 border border-orange-500/30 hover:bg-orange-600/30 rounded-xl text-center text-orange-300 text-sm font-bold transition-all"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#0c1322] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-black text-white mb-4">Add Contributor</h2>
            <form onSubmit={handleAddContributor} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-gray-400">Name *</label>
                <input
                  type="text"
                  required
                  value={contributorForm.name}
                  onChange={(e) => setContributorForm({ ...contributorForm, name: e.target.value })}
                  placeholder="Full name"
                  className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm placeholder-gray-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-gray-400">Email</label>
                <input
                  type="email"
                  value={contributorForm.email}
                  onChange={(e) => setContributorForm({ ...contributorForm, email: e.target.value })}
                  placeholder="email@example.com"
                  className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm placeholder-gray-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-gray-400">Role *</label>
                <input
                  type="text"
                  required
                  value={contributorForm.role}
                  onChange={(e) => setContributorForm({ ...contributorForm, role: e.target.value })}
                  placeholder="e.g., Producer, Artist, Engineer"
                  className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm placeholder-gray-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-gray-400">Wallet Address (Optional)</label>
                <input
                  type="text"
                  value={contributorForm.wallet_address}
                  onChange={(e) => setContributorForm({ ...contributorForm, wallet_address: e.target.value })}
                  placeholder="0x..."
                  className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-mono placeholder-gray-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-gray-400">Revenue Share (%) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  value={contributorForm.revenue_share}
                  onChange={(e) =>
                    setContributorForm({ ...contributorForm, revenue_share: Number(e.target.value) })
                  }
                  className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm placeholder-gray-600"
                />
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-white/5 mt-6">
                <button
                  type="button"
                  onClick={() => setShowContributorModal(false)}
                  className="px-4 py-2 border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:opacity-90 font-bold text-xs transition-all shadow-md shadow-indigo-500/10"
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