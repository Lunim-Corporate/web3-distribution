'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/lib/auth';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Modal } from '@/components/ui/Modal';
import { Project } from '@/lib/types';

export function AdminProjectsClient() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    type: '',
    status: 'In Progress' as Project['status'],
    contractAddress: '',
  });

  const loadProjects = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error('Failed to load projects');
      const data = await res.json();
      setProjects(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load projects');
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
    loadProjects();
  }, [user, router]);

  const selectedProject = useMemo(() => {
    const projectId = searchParams.get('projectId');
    return projects.find(p => p.id === projectId);
  }, [projects, searchParams]);

  if (!user || user.role !== 'admin') return null;

  const handleCreate = async () => {
    if (!createForm.name.trim()) {
      toast.error('Project name is required');
      return;
    }
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });
      if (!res.ok) throw new Error('Failed to create project');
      toast.success('Project created');
      setCreateModalOpen(false);
      setCreateForm({ name: '', type: '', status: 'In Progress', contractAddress: '' });
      await loadProjects();
    } catch (err: any) {
      toast.error(err.message || 'Could not create project');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project?')) return;
    try {
      const res = await fetch(`/api/projects?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete project');
      toast.success('Project deleted');
      await loadProjects();
      if (searchParams.get('projectId') === id) {
        router.push('/admin/projects');
      }
    } catch (err: any) {
      toast.error(err.message || 'Could not delete project');
    }
  };

  const renderState = () => {
    if (loading) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <p className="text-gray-600 dark:text-gray-400">Loading projects...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 rounded-lg p-4">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={loadProjects}
            className="mt-3 px-4 py-2 text-sm font-medium bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100 rounded-lg"
          >
            Retry
          </button>
        </div>
      );
    }

    if (projects.length === 0) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-3">No projects found.</p>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Create Project
          </button>
        </div>
      );
    }

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="text-left p-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                <th className="text-left p-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                <th className="text-left p-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-left p-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Revenue</th>
                <th className="text-left p-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {projects.map(project => (
                <tr key={project.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="p-4 text-gray-900 dark:text-white">{project.name}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-400">{project.type}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white">
                      {project.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-900 dark:text-white">${project.totalRevenue.toLocaleString()}</td>
                  <td className="p-4 space-x-3">
                    <button
                      onClick={() => router.push(`/admin/projects?projectId=${project.id}`)}
                      className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="text-red-600 dark:text-red-400 hover:underline text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Projects</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Manage and monitor all projects here.
            </p>
          </div>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Create Project
          </button>
        </div>

        {renderState()}

        {selectedProject && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedProject.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedProject.description}</p>
              </div>
              <button
                onClick={() => router.push('/admin/projects')}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">Type</p>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedProject.type}</p>
              </div>
              <div className="p-4 rounded border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedProject.status}</p>
              </div>
              <div className="p-4 rounded border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">Contract Address</p>
                <p className="font-mono text-gray-900 dark:text-white">
                  {selectedProject.contractAddress || 'N/A'}
                </p>
              </div>
              <div className="p-4 rounded border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">Contributors</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {selectedProject.contributors.length}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create Project">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
            <input
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              placeholder="Project name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
            <input
              value={createForm.type}
              onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              placeholder="Music, Film, Design..."
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select
                value={createForm.status}
                onChange={(e) => setCreateForm({ ...createForm, status: e.target.value as Project['status'] })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                <option value="Active">Active</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Paused">Paused</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contract Address</label>
              <input
                value={createForm.contractAddress}
                onChange={(e) => setCreateForm({ ...createForm, contractAddress: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="0x..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
            >
              Save Project
            </button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
