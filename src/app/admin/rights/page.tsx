'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/lib/auth';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Modal } from '@/components/ui/Modal';
import { CreativeRight, Project, User } from '@/lib/types';

export default function AdminRightsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [rights, setRights] = useState<CreativeRight[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAssign, setShowAssign] = useState(false);
  const [editing, setEditing] = useState<CreativeRight | null>(null);
  const [form, setForm] = useState({
    projectId: '',
    ownerId: '',
    rightsType: '',
    revenueShare: '',
    expirationDate: '',
    status: 'Active' as CreativeRight['status'],
  });

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [rightsRes, projectsRes, usersRes] = await Promise.all([
        fetch('/api/rights'),
        fetch('/api/projects'),
        fetch('/api/users'),
      ]);
      if (!rightsRes.ok || !projectsRes.ok || !usersRes.ok) throw new Error('Failed to load data');
      const [rightsData, projectsData, usersData] = await Promise.all([
        rightsRes.json(),
        projectsRes.json(),
        usersRes.json(),
      ]);
      setRights(rightsData);
      setProjects(projectsData);
      setUsers(usersData);
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
    if (user.role !== 'admin') {
      router.replace('/unauthorized');
      return;
    }
    loadData();
  }, [user, router]);

  if (!user || user.role !== 'admin') return null;

  const resetForm = () => {
    setForm({
      projectId: '',
      ownerId: '',
      rightsType: '',
      revenueShare: '',
      expirationDate: '',
      status: 'Active',
    });
    setEditing(null);
  };

  const upsertRight = async () => {
    if (!form.projectId || !form.ownerId || !form.rightsType) {
      toast.error('Project, owner, and rights type are required');
      return;
    }
    const project = projects.find(p => p.id === form.projectId);
    const owner = users.find(u => u.id === form.ownerId);
    const payload = {
      id: editing?.id,
      projectId: form.projectId,
      projectName: project?.name,
      rightsType: form.rightsType,
      owner: owner?.name,
      ownerId: form.ownerId,
      status: form.status,
      expirationDate: form.expirationDate,
      revenueShare: Number(form.revenueShare) || 0,
    };
    try {
      const res = await fetch('/api/rights', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to save right');
      toast.success(editing ? 'Right updated' : 'Right assigned');
      setShowAssign(false);
      resetForm();
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Could not save right');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Rights</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Review and manage distribution rights across the platform.
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowAssign(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Assign Right
          </button>
        </div>

        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <p className="text-gray-600 dark:text-gray-400">Loading rights...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 rounded-lg p-4">
            <p className="font-semibold">Error</p>
            <p className="text-sm">{error}</p>
            <button
              onClick={loadData}
              className="mt-3 px-4 py-2 text-sm font-medium bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100 rounded-lg"
            >
              Retry
            </button>
          </div>
        ) : rights.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-3">No rights assigned yet.</p>
            <button
              onClick={() => setShowAssign(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Assign Right
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
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
                      Owner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Share
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
                  {rights.map(right => (
                    <tr key={right.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {right.projectName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {right.rightsType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {right.owner}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                        {right.revenueShare}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          right.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          right.status === 'Expiring Soon' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
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
                              ownerId: right.ownerId,
                              rightsType: right.rightsType,
                              revenueShare: String(right.revenueShare),
                              expirationDate: right.expirationDate,
                              status: right.status,
                            });
                            setShowAssign(true);
                          }}
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={showAssign}
        onClose={() => {
          setShowAssign(false);
          resetForm();
        }}
        title={editing ? 'Edit Right' : 'Assign Right'}
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Owner</label>
            <select
              value={form.ownerId}
              onChange={(e) => setForm({ ...form, ownerId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="">Select user</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
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
                setShowAssign(false);
                resetForm();
              }}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={upsertRight}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
            >
              {editing ? 'Update' : 'Assign'}
            </button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
