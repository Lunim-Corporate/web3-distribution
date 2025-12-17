'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Role, useAuth } from '@/lib/auth';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { toast } from 'react-hot-toast';
import { User } from '@/lib/types';

export default function AdminUsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [invite, setInvite] = useState({ name: '', email: '', role: 'creator' as Role });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Failed to load users');
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
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
    loadUsers();
  }, [user, router]);

  if (!user || user.role !== 'admin') return null;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Manage Users
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Invite users and manage roles.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Invite User
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
              className="px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Name"
              value={invite.name}
              onChange={(e) => setInvite({ ...invite, name: e.target.value })}
            />
            <input
              className="px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Email"
              value={invite.email}
              onChange={(e) => setInvite({ ...invite, email: e.target.value })}
            />
            <select
              className="px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              value={invite.role}
              onChange={(e) => setInvite({ ...invite, role: e.target.value as Role })}
            >
              <option value="admin">admin</option>
              <option value="creator">creator</option>
              <option value="contributor">contributor</option>
            </select>
            <button
              className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
              onClick={() => {
                const email = invite.email.trim();
                const name = (invite.name || email.split('@')[0]).trim();
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                  toast.error('Please enter a valid email address.');
                  return;
                }
                fetch('/api/users', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name, email, role: invite.role }),
                })
                  .then(res => {
                    if (!res.ok) throw new Error('Invite failed');
                    toast.success(`Invite sent to ${email} as ${invite.role}.`);
                    setInvite({ name: '', email: '', role: 'creator' });
                    loadUsers();
                  })
                  .catch(() => toast.error('Failed to send invite'));
              }}
            >
              Send Invite
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-400">Loading users...</p>
            </div>
          ) : error ? (
            <div className="p-6">
              <p className="text-red-600 dark:text-red-400 mb-2">{error}</p>
              <button
                onClick={loadUsers}
                className="px-4 py-2 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100 rounded-lg text-sm font-medium"
              >
                Retry
              </button>
            </div>
          ) : users.length === 0 ? (
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-400">No users found.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="p-4 text-gray-900 dark:text-white">{u.name}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-400">{u.email}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <select
                        defaultValue={u.role}
                        onChange={(e) => {
                          fetch('/api/users', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: u.id, role: e.target.value }),
                          })
                            .then(res => {
                              if (!res.ok) throw new Error('Update failed');
                              toast.success(`Role updated for ${u.name}`);
                              loadUsers();
                            })
                            .catch(() => toast.error('Unable to update role'));
                        }}
                        className="px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                      >
                        <option value="admin">admin</option>
                        <option value="creator">creator</option>
                        <option value="contributor">contributor</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
