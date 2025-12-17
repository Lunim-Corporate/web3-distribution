'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/lib/auth';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Modal } from '@/components/ui/Modal';
import { Project, Revenue } from '@/lib/types';

export default function AdminRevenuePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [revenue, setRevenue] = useState<Revenue[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    projectId: '',
    amount: '',
    source: 'Streaming',
    status: 'Pending' as Revenue['status'],
    date: new Date().toISOString().split('T')[0],
  });

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [revRes, projRes] = await Promise.all([fetch('/api/revenue'), fetch('/api/projects')]);
      if (!revRes.ok || !projRes.ok) throw new Error('Failed to load data');
      const [revData, projData] = await Promise.all([revRes.json(), projRes.json()]);
      setRevenue(revData);
      setProjects(projData);
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
    if (user.role !== 'admin') {
      router.replace('/unauthorized');
      return;
    }
    loadData();
  }, [user, router]);

  if (!user || user.role !== 'admin') return null;

  const handleAddRevenue = async () => {
    if (!form.projectId || !form.amount) {
      toast.error('Project and amount are required');
      return;
    }
    const project = projects.find(p => p.id === form.projectId);
    try {
      const res = await fetch('/api/revenue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount),
          projectName: project?.name,
          contributor: 'Project Revenue',
          contributorId: 'project',
        }),
      });
      if (!res.ok) throw new Error('Failed to add revenue');
      toast.success('Revenue added');
      setShowAdd(false);
      setForm({
        projectId: '',
        amount: '',
        source: 'Streaming',
        status: 'Pending',
        date: new Date().toISOString().split('T')[0],
      });
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Could not add revenue');
    }
  };

  const exportCsv = () => {
    const headers = ['Date', 'Project', 'Source', 'Amount', 'Status'];
    const rows = revenue.map(r => [r.date, r.projectName, r.source, r.amount, r.status]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'revenue.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Revenue</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Track and review platform revenue streams.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportCsv}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg"
            >
              Export CSV
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Add Revenue
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <p className="text-gray-600 dark:text-gray-400">Loading revenue...</p>
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
        ) : revenue.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-3">No revenue records yet.</p>
            <button
              onClick={() => setShowAdd(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Add Revenue
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {revenue.map(rev => (
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Revenue">
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              placeholder="1000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Source</label>
            <input
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              placeholder="Streaming, Licensing..."
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as Revenue['status'] })}
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
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
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
              Save Revenue
            </button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
