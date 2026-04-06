'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Role, useAuth, type User } from '@/lib/auth';
import { toast } from 'react-hot-toast';

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { listUsers, setUserRole, inviteUser } = useAuth();
  
  const [users, setUsers] = useState<User[]>([]);
  const [invite, setInvite] = useState({ name: '', email: '', role: 'creator' as Role });
  const [isLoading, setIsLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role !== 'admin') {
      router.replace('/dashboard');
      return;
    }

    void (async () => {
      try {
        const next = await listUsers();
        setUsers(next);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [user, router, listUsers]);

  const refresh = async () => {
    const next = await listUsers();
    setUsers(next);
  };

  if (isLoading || !user || user.role !== 'admin') return null;

  return (
    <main className="p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Manage Users</h1>
      <p className="text-gray-600">Invite users and manage roles.</p>

      <div className="rounded border border-gray-200 dark:border-gray-700 p-4 space-y-3">
        <h2 className="font-semibold">Invite User</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input className="px-3 py-2 rounded border border-gray-300 dark:border-gray-700" placeholder="Name" value={invite.name} onChange={(e)=>setInvite({...invite, name: e.target.value})} />
          <input className="px-3 py-2 rounded border border-gray-300 dark:border-gray-700" placeholder="Email" value={invite.email} onChange={(e)=>setInvite({...invite, email: e.target.value})} />
          <select className="px-3 py-2 rounded border border-gray-300 dark:border-gray-700" value={invite.role} onChange={(e)=>setInvite({...invite, role: e.target.value as Role})}>
            <option value="admin">admin</option>
            <option value="creator">creator</option>
            <option value="contributor">contributor</option>
          </select>
          <button
            className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
            disabled={isInviting}
            onClick={()=>{
              void (async () => {
                const email = invite.email.trim();
                const name = (invite.name || email.split('@')[0]).trim();
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if(!emailRegex.test(email)) {
                  toast.error('Please enter a valid email address.');
                  return;
                }
                
                setIsInviting(true);
                toast.loading('Sending invite...', { id: 'invite' });
                try {
                  await inviteUser(email, name, invite.role);
                  toast.success(`Invite sent to ${email} as ${invite.role}.`, { id: 'invite' });
                  setInvite({ name:'', email:'', role:'creator' });
                  await refresh();
                } catch (e: unknown) {
                  const msg = e instanceof Error ? e.message : 'Failed to send invite';
                  toast.error(msg, { id: 'invite' });
                } finally {
                  setIsInviting(false);
                }
              })();
            }}
          >
            {isInviting ? "Sending..." : "Send Invite"}
          </button>
        </div>
      </div>
      <div className="rounded border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Role</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-gray-100 dark:border-gray-800">
                <td className="p-3">{u.name}</td>
                <td className="p-3 text-gray-600">{u.email}</td>
                <td className="p-3">
                  <span className="px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-800">{u.role}</span>
                </td>
                <td className="p-3">
                  <select
                    defaultValue={u.role}
                    onChange={(e) => {
                      void (async () => {
                        await setUserRole(u.id, e.target.value as Role);
                        await refresh();
                      })();
                    }}
                    className="px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
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
      </div>
    </main>
  );
}


