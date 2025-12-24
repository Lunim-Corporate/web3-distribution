'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/lib/auth';
import { CreatorLayout } from '@/components/layouts/CreatorLayout';
import { Revenue, Project } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';
import { RevenueDistributionService } from '@/lib/services/RevenueDistributionService';

export default function CreatorRevenuePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [revenue, setRevenue] = useState<Revenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showDistribute, setShowDistribute] = useState(false);
  const [addForm, setAddForm] = useState({
    projectId: '',
    amount: '',
    source: 'Direct',
    status: 'Pending' as Revenue['status'],
    date: new Date().toISOString().split('T')[0],
  });
  const [distribution, setDistribution] = useState({
    projectId: '',
    amount: '',
  });
  const [filter, setFilter] = useState<'all' | 'Paid' | 'Pending' | 'Processing'>('all');

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const [projectsData, revenueData] = await Promise.all([
        fetch('/api/projects').then(r => {
          if (!r.ok) throw new Error('Failed to load projects');
          return r.json();
        }),
        fetch('/api/revenue').then(r => {
          if (!r.ok) throw new Error('Failed to load revenue');
          return r.json();
        }),
      ]);

      setProjects(projectsData);
      const creatorProjectIds = projectsData
        .filter((p: any) => p.creatorId === user.id)
        .map((p: any) => p.id);
      
      const creatorRevenue = revenueData.filter((r: Revenue) => 
        creatorProjectIds.includes(r.projectId)
      );
      
      setRevenue(creatorRevenue);
    } catch (err: any) {
      setError(err.message || 'Failed to load revenue');
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

  const filteredRevenue = useMemo(() => (
    filter === 'all' ? revenue : revenue.filter(r => r.status === filter)
  ), [filter, revenue]);

  const totalEarnings = revenue.reduce((sum, r) => sum + r.amount, 0);
  const paidAmount = revenue.filter(r => r.status === 'Paid').reduce((sum, r) => sum + r.amount, 0);
  const pendingAmount = revenue
    .filter(r => r.status === 'Pending' || r.status === 'Processing')
    .reduce((sum, r) => sum + r.amount, 0);

  const handleAddRevenue = async () => {
    if (!addForm.projectId || !addForm.amount) {
      toast.error('Project and amount are required');
      return;
    }
    const project = projects.find(p => p.id === addForm.projectId);
    try {
      const res = await fetch('/api/revenue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...addForm,
          amount: Number(addForm.amount),
          projectName: project?.name,
          contributor: 'Project Revenue',
          contributorId: 'project',
        }),
      });
      if (!res.ok) throw new Error('Failed to add revenue');
      toast.success('Revenue recorded');
      setShowAdd(false);
      setAddForm({
        projectId: '',
        amount: '',
        source: 'Direct',
        status: 'Pending',
        date: new Date().toISOString().split('T')[0],
      });
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Could not record revenue');
    }
  };

  const handleDistribute = async () => {
    if (!distribution.projectId) {
      toast.error('Select a project');
      return;
    }
    const project = projects.find(p => p.id === distribution.projectId);
    if (!project) return;
    const amount = Number(distribution.amount) || pendingAmount;
    const service = RevenueDistributionService.getInstance();
    try {
      await service.distributeRevenue({
        projectId: project.id,
        projectName: project.name,
        totalAmount: amount,
        shares: project.contributors.map(c => ({
          contributorId: c.id,
          contributorName: c.name,
          walletAddress: c.id ? `0x${c.id.slice(-8).padStart(8, '0')}` : '0x0',
          percentage: c.revenueShare,
          amount: (amount * c.revenueShare) / 100,
        })),
        mode: service.getMode(),
        useSmartContract: false,
      });
      toast.success('Distribution triggered');

      // Mark project revenue as paid in UI
      const relevant = revenue.filter(r => r.projectId === project.id);
      await Promise.all(
        relevant.map(r =>
          fetch('/api/revenue', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: r.id, status: 'Paid' }),
          })
        )
      );
      setShowDistribute(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Distribution failed');
    }
  };

  return (
    <CreatorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              My Revenue
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Track revenue from all your projects.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDistribute(true)}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg"
            >
              Distribute
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Record Revenue
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Project Revenue</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              ${totalEarnings.toLocaleString()}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Distributed</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              ${paidAmount.toLocaleString()}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Pending Distribution</p>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              ${pendingAmount.toLocaleString()}
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
              All ({revenue.length})
            </button>
            <button
              onClick={() => setFilter('Paid')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'Paid'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Paid ({revenue.filter(r => r.status === 'Paid').length})
            </button>
            <button
              onClick={() => setFilter('Pending')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'Pending'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Pending ({revenue.filter(r => r.status === 'Pending').length})
            </button>
            <button
              onClick={() => setFilter('Processing')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'Processing'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Processing ({revenue.filter(r => r.status === 'Processing').length})
            </button>
          </div>
        </div>

        {/* Revenue Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-400">Loading revenue...</p>
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
          ) : filteredRevenue.length === 0 ? (
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-400">No revenue records found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Transaction
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredRevenue.map(rev => (
                    <tr key={rev.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {rev.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {rev.projectName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {rev.source}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                        ${rev.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          rev.status === 'Paid' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          rev.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        }`}>
                          {rev.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {rev.transactionHash ? (
                          <a
                            href={`https://etherscan.io/tx/${rev.transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            View
                          </a>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Record Revenue">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project</label>
            <select
              value={addForm.projectId}
              onChange={(e) => setAddForm({ ...addForm, projectId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="">Select project</option>
              {projects.filter(p => p.creatorId === user.id).map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
            <input
              type="number"
              value={addForm.amount}
              onChange={(e) => setAddForm({ ...addForm, amount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              placeholder="5000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Source</label>
            <input
              value={addForm.source}
              onChange={(e) => setAddForm({ ...addForm, source: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              placeholder="Streaming, Merch..."
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select
                value={addForm.status}
                onChange={(e) => setAddForm({ ...addForm, status: e.target.value as Revenue['status'] })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
              <input
                type="date"
                value={addForm.date}
                onChange={(e) => setAddForm({ ...addForm, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleAddRevenue}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
            >
              Save
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showDistribute} onClose={() => setShowDistribute(false)} title="Distribute Revenue">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project</label>
            <select
              value={distribution.projectId}
              onChange={(e) => setDistribution({ ...distribution, projectId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="">Select project</option>
              {projects.filter(p => p.creatorId === user.id).map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount to Distribute</label>
            <input
              type="number"
              value={distribution.amount}
              onChange={(e) => setDistribution({ ...distribution, amount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              placeholder={pendingAmount.toString()}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowDistribute(false)}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleDistribute}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
            >
              Distribute
            </button>
          </div>
        </div>
      </Modal>
    </CreatorLayout>
  );
}
