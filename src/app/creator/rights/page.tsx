'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/lib/auth';
import { CreatorLayout } from '@/components/layouts/CreatorLayout';
import { CreativeRight, Project } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';

export default function CreatorRightsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [rights, setRights] = useState<CreativeRight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CreativeRight | null>(null);
  const [form, setForm] = useState({
    projectId: '',
    rightsType: '',
    revenueShare: '',
    expirationDate: '',
    status: 'Active' as CreativeRight['status'],
  });
  const [filter, setFilter] = useState<'all' | 'Active' | 'Expiring Soon' | 'Expired'>('all');

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const [rightsRes, projectsRes] = await Promise.all([
        fetch('/api/rights'),
        fetch('/api/projects'),
      ]);
      if (!rightsRes.ok || !projectsRes.ok) throw new Error('Failed to load data');
      const [rightsData, projectsData] = await Promise.all([rightsRes.json(), projectsRes.json()]);
      const userRights = rightsData.filter((r: CreativeRight) => r.ownerId === user.id);
      setRights(userRights);
      setProjects(projectsData.filter((p: Project) => p.creatorId === user.id));
    } catch (err: any) {
      setError(err.message || 'Failed to load rights');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role !== 'creator' && user.role !== 'admin') {
      router.replace('/unauthorized');
      return;
    }

    loadData();
  }, [user, router]);

  if (!user || (user.role !== 'creator' && user.role !== 'admin')) {
    return null;
  }

  const filteredRights = useMemo(() => (
    filter === 'all' ? rights : rights.filter(r => r.status === filter)
  ), [filter, rights]);

  const resetForm = () => {
    setForm({
      projectId: '',
      rightsType: '',
      revenueShare: '',
      expirationDate: '',
      status: 'Active',
    });
    setEditing(null);
  };

  const totalShareForProject = (projectId: string, excludeId?: string) => {
    return rights
      .filter(r => r.projectId === projectId && r.id !== excludeId)
      .reduce((sum, r) => sum + r.revenueShare, 0);
  };

  const handleSave = async () => {
    if (!form.projectId || !form.rightsType) {
      toast.error('Project and rights type are required');
      return;
    }
    const newShare = Number(form.revenueShare) || 0;
    const existingShare = totalShareForProject(form.projectId, editing?.id);
    if (existingShare + newShare > 100) {
      toast.error('Total revenue share cannot exceed 100%');
      return;
    }
    const project = projects.find(p => p.id === form.projectId);
    const payload = {
      id: editing?.id,
      projectId: form.projectId,
      projectName: project?.name,
      rightsType: form.rightsType,
      owner: user.name,
      ownerId: user.id,
      status: form.status,
      expirationDate: form.expirationDate,
      revenueShare: newShare,
    };
    try {
      const res = await fetch('/api/rights', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to save split');
      toast.success(editing ? 'Split updated' : 'Split created');
      setShowModal(false);
      resetForm();
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Could not save split');
    }
  };

  return (
    <CreatorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              My Rights
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Manage creative rights for your projects.
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Set Splits
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Rights</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {rights.length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Active</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {rights.filter(r => r.status === 'Active').length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Expiring Soon</p>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {rights.filter(r => r.status === 'Expiring Soon').length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Expired</p>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">
              {rights.filter(r => r.status === 'Expired').length}
            </p>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              All ({rights.length})
            </button>
            <button
              onClick={() => setFilter('Active')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'Active'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Active ({rights.filter(r => r.status === 'Active').length})
            </button>
            <button
              onClick={() => setFilter('Expiring Soon')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'Expiring Soon'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Expiring Soon ({rights.filter(r => r.status === 'Expiring Soon').length})
            </button>
            <button
              onClick={() => setFilter('Expired')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'Expired'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Expired ({rights.filter(r => r.status === 'Expired').length})
            </button>
          </div>
        </div>

        {/* Rights Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-400">Loading rights...</p>
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
          ) : filteredRights.length === 0 ? (
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-400">No rights found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Rights Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Revenue Share
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Expires
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredRights.map(right => (
                    <tr key={right.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {right.projectName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {right.rightsType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                        {right.revenueShare}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {right.createdDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {right.expirationDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          right.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          right.status === 'Expiring Soon' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          right.status === 'Expired' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        }`}>
                          {right.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => {
                            setEditing(right);
                            setForm({
                              projectId: right.projectId,
                              rightsType: right.rightsType,
                              revenueShare: String(right.revenueShare),
                              expirationDate: right.expirationDate,
                              status: right.status,
                            });
                            setShowModal(true);
                          }}
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Update Splits
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editing ? 'Update Splits' : 'Set Splits'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project</label>
            <select
              value={form.projectId}
              onChange={(e) => setForm({ ...form, projectId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="">Select project</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rights Type</label>
            <input
              value={form.rightsType}
              onChange={(e) => setForm({ ...form, rightsType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              placeholder="Distribution, Sync..."
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Revenue Share (%)</label>
              <input
                type="number"
                value={form.revenueShare}
                onChange={(e) => setForm({ ...form, revenueShare: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="20"
              />
              {form.projectId && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Current total: {totalShareForProject(form.projectId, editing?.id)}%
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expiration Date</label>
              <input
                type="date"
                value={form.expirationDate}
                onChange={(e) => setForm({ ...form, expirationDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as CreativeRight['status'] })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="Active">Active</option>
              <option value="Expiring Soon">Expiring Soon</option>
              <option value="Expired">Expired</option>
              <option value="Transferred">Transferred</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
            >
              {editing ? 'Update' : 'Save'}
            </button>
          </div>
        </div>
      </Modal>
    </CreatorLayout>
  );
}
