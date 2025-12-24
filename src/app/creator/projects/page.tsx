'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/lib/auth';
import { CreatorLayout } from '@/components/layouts/CreatorLayout';
import { Project } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';

export default function CreatorProjectsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showContributor, setShowContributor] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [createForm, setCreateForm] = useState({
    name: '',
    type: '',
    status: 'In Progress' as Project['status'],
  });
  const [contributorForm, setContributorForm] = useState({
    name: '',
    email: '',
    revenueShare: '',
    role: '',
  });
  const [filter, setFilter] = useState<'all' | 'Active' | 'Completed' | 'In Progress'>('all');

  const loadProjects = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error('Failed to load projects');
      const data: Project[] = await res.json();
      const creatorProjects = data.filter(p => p.creatorId === user.id);
      setProjects(creatorProjects);
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
    if (user.role !== 'creator' && user.role !== 'admin') {
      router.replace('/unauthorized');
      return;
    }

    loadProjects();
  }, [user, router]);

  if (!user || (user.role !== 'creator' && user.role !== 'admin')) {
    return null;
  }

  const filteredProjects = useMemo(() => (
    filter === 'all' ? projects : projects.filter(p => p.status === filter)
  ), [filter, projects]);

  const handleCreate = async () => {
    if (!createForm.name.trim()) {
      toast.error('Name is required');
      return;
    }
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...createForm,
          creatorId: user.id,
          contributors: [
            {
              id: user.id,
              name: user.name,
              email: user.email,
              avatar: '',
              revenueShare: 100,
              totalEarned: 0,
              role: 'Owner',
            },
          ],
        }),
      });
      if (!res.ok) throw new Error('Failed to create project');
      toast.success('Project created');
      setShowCreate(false);
      setCreateForm({ name: '', type: '', status: 'In Progress' });
      loadProjects();
    } catch (err: any) {
      toast.error(err.message || 'Could not create project');
    }
  };

  const handleAddContributor = async () => {
    if (!selectedProject) return;
    if (!contributorForm.email.trim()) {
      toast.error('Email is required');
      return;
    }
    const updatedContributors = [
      ...selectedProject.contributors,
      {
        id: `contrib_${Date.now()}`,
        name: contributorForm.name || contributorForm.email.split('@')[0],
        email: contributorForm.email,
        avatar: '',
        revenueShare: Number(contributorForm.revenueShare) || 0,
        totalEarned: 0,
        role: contributorForm.role || 'Contributor',
      },
    ];
    try {
      const res = await fetch('/api/projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedProject.id,
          contributors: updatedContributors,
        }),
      });
      if (!res.ok) throw new Error('Failed to update contributors');
      toast.success('Contributor added');
      setShowContributor(false);
      setContributorForm({ name: '', email: '', revenueShare: '', role: '' });
      loadProjects();
    } catch (err: any) {
      toast.error(err.message || 'Could not add contributor');
    }
  };

  return (
    <CreatorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              My Projects
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              View and manage all projects you're involved in.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Create Project
          </button>
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
              All ({projects.length})
            </button>
            <button
              onClick={() => setFilter('Active')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'Active'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Active ({projects.filter(p => p.status === 'Active').length})
            </button>
            <button
              onClick={() => setFilter('In Progress')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'In Progress'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              In Progress ({projects.filter(p => p.status === 'In Progress').length})
            </button>
            <button
              onClick={() => setFilter('Completed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'Completed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Completed ({projects.filter(p => p.status === 'Completed').length})
            </button>
          </div>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <p className="text-gray-600 dark:text-gray-400">Loading projects...</p>
          </div>
        ) : error ? (
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
        ) : filteredProjects.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <p className="text-gray-600 dark:text-gray-400 mb-3">No projects found.</p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredProjects.map(project => {
              const myContribution = project.contributors.find(c => c.email === user.email);
              return (
                <div
                  key={project.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 relative">
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
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Total Revenue:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          ${project.totalRevenue.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Pending Payments:</span>
                        <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                          ${project.pendingPayments.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Contributors:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {project.contributors.length}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Progress:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {project.progress}%
                        </span>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Created {project.createdDate}
                        </p>
                        <button
                          onClick={() => {
                            setSelectedProject(project);
                            setShowContributor(true);
                          }}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Manage Contributors
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Project">
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
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              value={createForm.status}
              onChange={(e) => setCreateForm({ ...createForm, status: e.target.value as Project['status'] })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="In Progress">In Progress</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
              <option value="Paused">Paused</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
            >
              Save
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showContributor}
        onClose={() => setShowContributor(false)}
        title={selectedProject ? `Manage ${selectedProject.name}` : 'Manage Contributors'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contributor Email</label>
            <input
              value={contributorForm.email}
              onChange={(e) => setContributorForm({ ...contributorForm, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              placeholder="contributor@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
            <input
              value={contributorForm.name}
              onChange={(e) => setContributorForm({ ...contributorForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              placeholder="Name (optional)"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Revenue Share (%)</label>
              <input
                type="number"
                value={contributorForm.revenueShare}
                onChange={(e) => setContributorForm({ ...contributorForm, revenueShare: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
              <input
                value={contributorForm.role}
                onChange={(e) => setContributorForm({ ...contributorForm, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="Role"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowContributor(false)}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleAddContributor}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
            >
              Save Contributor
            </button>
          </div>
        </div>
      </Modal>
    </CreatorLayout>
  );
}
