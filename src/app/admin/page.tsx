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
  const [projects, setProjects] = useState<any[]>([]);
  const [contributors, setContributors] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  const [invite, setInvite] = useState({ name: '', email: '', role: 'creator' as Role, wallet_address: '', projectId: '', percentage: 0 });
  const [newProject, setNewProject] = useState({ name: '', total_revenue: 0 });
  
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
        await fetchProjects();
      } finally {
        setIsLoading(false);
      }
    })();
  }, [user, router, listUsers]);

  useEffect(() => {
    if (selectedProjectId) {
      fetchContributors(selectedProjectId);
    } else {
      setContributors([]);
    }
  }, [selectedProjectId]);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch(e) {}
  };

  const fetchContributors = async (projectId: string) => {
    try {
      const res = await fetch(`/api/dashboard/data?projectId=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setContributors(data.contributors || []);
      }
    } catch(e) {}
  };

  const refresh = async () => {
    const next = await listUsers();
    setUsers(next);
    if (selectedProjectId) await fetchContributors(selectedProjectId);
  };

  const handleCreateProject = async () => {
    if (!newProject.name) return toast.error('Project name required');
    try {
      const res = await fetch('/api/admin-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_project', payload: newProject })
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('Project created');
      setNewProject({ name: '', total_revenue: 0 });
      await fetchProjects();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This will remove all associated contributors and data.')) return;
    try {
      const res = await fetch('/api/admin-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_project', payload: { project_id: projectId } })
      });
      if (!res.ok) throw new Error('Failed to delete project');
      toast.success('Project deleted');
      if (selectedProjectId === projectId) setSelectedProjectId('');
      await fetchProjects();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDeleteContributor = async (contributorId: string) => {
    if (!confirm('Remove this rights holder from the project?')) return;
    try {
      const res = await fetch('/api/admin-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_contributor', payload: { contributor_id: contributorId } })
      });
      if (!res.ok) throw new Error('Failed to remove contributor');
      toast.success('Contributor removed');
      if (selectedProjectId) fetchContributors(selectedProjectId);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleEditPercentage = async (contributorId: string, percentage: number) => {
    try {
      const res = await fetch('/api/admin-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'edit_contributor', payload: { contributor_id: contributorId, percentage } })
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('Updated percentage');
      if (selectedProjectId) fetchContributors(selectedProjectId);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleAddUser = async () => {
    const email = invite.email.trim();
    const name = (invite.name || email.split('@')[0]).trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailRegex.test(email)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    setIsInviting(true);
    toast.loading('Creating user...', { id: 'invite' });
    try {
      const res = await fetch('/api/admin-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_user', payload: { ...invite, name, email } })
      });
      if (!res.ok) throw new Error('Failed to create user and contributor');
      toast.success('User and contributor added!', { id: 'invite' });
      setInvite({ name:'', email:'', role:'creator', wallet_address: '', projectId: selectedProjectId, percentage: 0 });
      await refresh();
    } catch (e: any) {
      toast.error(e.message, { id: 'invite' });
    } finally {
      setIsInviting(false);
    }
  };

  if (isLoading || !user || user.role !== 'admin') return null;

  return (
    <main className="p-8 max-w-6xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-black text-white">Admin Dashboard</h1>
        <p className="text-gray-400">Manage projects, rights holders, and revenue shares.</p>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-white">Project Management</h2>
        <div className="flex gap-4 items-center">
          <input className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500" placeholder="Project Name" value={newProject.name} onChange={(e)=>setNewProject({...newProject, name: e.target.value})} />
          <input type="number" className="w-48 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500" placeholder="Initial Revenue (USD)" value={newProject.total_revenue || ''} onChange={(e)=>setNewProject({...newProject, total_revenue: Number(e.target.value)})} />
          <button onClick={handleCreateProject} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors">Create Project</button>
        </div>

        {projects.length > 0 && (
          <div className="pt-4 border-t border-white/5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Existing Projects</p>
            <div className="flex flex-wrap gap-2">
              {projects.map(p => (
                <div key={p.id} className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                  <span className="text-sm text-white font-medium">{p.name}</span>
                  <button onClick={() => handleDeleteProject(p.id)} className="text-gray-500 hover:text-red-400 transition-colors p-0.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* ADD USER / CONTRIBUTOR */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white">Add New Rights Holder</h2>
          <div className="grid grid-cols-2 gap-4">
            <input className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white" placeholder="Name" value={invite.name} onChange={(e)=>setInvite({...invite, name: e.target.value})} />
            <input className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white" placeholder="Email" value={invite.email} onChange={(e)=>setInvite({...invite, email: e.target.value})} />
            <input className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white col-span-2" placeholder="Wallet Address (0x...)" value={invite.wallet_address} onChange={(e)=>setInvite({...invite, wallet_address: e.target.value})} />
            
            <select className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white" value={invite.projectId} onChange={(e)=>setInvite({...invite, projectId: e.target.value})}>
              <option value="">Select Project...</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            
            <input type="number" className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white" placeholder="Revenue Share (%)" value={invite.percentage || ''} onChange={(e)=>setInvite({...invite, percentage: Number(e.target.value)})} />
            
            <button disabled={isInviting} onClick={handleAddUser} className="col-span-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg disabled:opacity-50">
              {isInviting ? "Adding..." : "Add to Project"}
            </button>
          </div>
        </div>

        {/* EDIT PROJECT CONTRIBUTORS */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white">Edit Project Shares</h2>
            <select className="bg-black/40 border border-white/10 rounded-lg px-4 py-1 text-sm text-white" value={selectedProjectId} onChange={(e)=>setSelectedProjectId(e.target.value)}>
              <option value="">Select Project</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          
          {!selectedProjectId ? (
            <p className="text-gray-500 text-sm">Select a project to view and edit its rights holders.</p>
          ) : contributors.length === 0 ? (
            <p className="text-gray-500 text-sm">No rights holders found for this project.</p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {contributors.map((c: any) => (
                <div key={c.id || c.user_id} className="flex items-center justify-between bg-black/20 p-3 rounded-xl border border-white/5 group">
                  <div className="flex items-center gap-3">
                    <button onClick={() => handleDeleteContributor(c.id)} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all p-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                    <div>
                      <p className="text-white font-bold text-sm">{c.name || 'Unknown'}</p>
                      <p className="text-gray-500 text-xs font-mono truncate w-32">{c.wallet_address || 'No wallet'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      className="w-16 bg-black/40 border border-white/10 rounded px-2 py-1 text-white text-right"
                      defaultValue={c.percentage}
                      onBlur={(e) => {
                        const val = Number(e.target.value);
                        if (val !== c.percentage) handleEditPercentage(c.id, val);
                      }}
                    />
                    <span className="text-gray-500 text-sm">%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
    </main>
  );
}
