'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Role, useAuth, type User } from '@/lib/auth';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminPage() {
  const { user, listUsers } = useAuth();
  const router = useRouter();
  
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | 'new' | null>(null);
  const [contributors, setContributors] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Forms
  const [newProject, setNewProject] = useState({ name: '', total_revenue: 0 });
  const [invite, setInvite] = useState({ name: '', email: '', wallet_address: '', percentage: 0 });

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
        await fetchProjects();
      } finally {
        setIsLoading(false);
      }
    })();
  }, [user, router]);

  useEffect(() => {
    if (selectedProjectId && selectedProjectId !== 'new') {
      fetchContributors(selectedProjectId);
      setInvite(prev => ({ ...prev, projectId: selectedProjectId }));
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
        if (data.length > 0 && !selectedProjectId) {
          setSelectedProjectId(data[0].id);
        }
      }
    } catch(e) {
      console.error('Fetch projects failed', e);
    }
  };

  const fetchContributors = async (projectId: string) => {
    try {
      const res = await fetch(`/api/dashboard/data?projectId=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setContributors(data.contributors || []);
      }
    } catch(e) {
      console.error('Fetch contributors failed', e);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.name) return toast.error('Project name required');
    setIsActionLoading(true);
    try {
      const res = await fetch('/api/admin-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_project', payload: newProject })
      });
      if (!res.ok) throw new Error('Failed to create project');
      const result = await res.json();
      toast.success('Project created');
      setNewProject({ name: '', total_revenue: 0 });
      await fetchProjects();
      if (result.data?.[0]?.id) {
        setSelectedProjectId(result.data[0].id);
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      const res = await fetch('/api/admin-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_project', payload: { project_id: projectId } })
      });
      if (!res.ok) throw new Error('Failed to delete project');
      toast.success('Project deleted');
      if (selectedProjectId === projectId) setSelectedProjectId(null);
      await fetchProjects();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleUpdateContributor = async (c: any, field: string, value: any) => {
    // Optimistic update
    const updated = contributors.map(item => 
      item.id === c.id ? { ...item, [field]: value } : item
    );
    setContributors(updated);
  };

  const saveContributorChanges = async (c: any) => {
    try {
      const res = await fetch('/api/admin-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'edit_contributor', 
          payload: { 
            contributor_id: c.id, 
            user_id: c.user_id,
            percentage: Number(c.percentage || c.revenue_share),
            name: c.name,
            wallet_address: c.wallet_address
          } 
        })
      });
      if (!res.ok) throw new Error('Update failed');
      toast.success('Rights holder updated');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDeleteContributor = async (contributorId: string) => {
    if (!confirm('Remove this rights holder?')) return;
    try {
      const res = await fetch('/api/admin-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_contributor', payload: { contributor_id: contributorId } })
      });
      if (!res.ok) throw new Error('Failed to remove contributor');
      toast.success('Contributor removed');
      if (selectedProjectId && selectedProjectId !== 'new') fetchContributors(selectedProjectId);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleAddRightsHolder = async () => {
    if (!invite.email || !selectedProjectId || selectedProjectId === 'new') {
      return toast.error('Email and active project required');
    }
    setIsActionLoading(true);
    try {
      const res = await fetch('/api/admin-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'add_user', 
          payload: { ...invite, projectId: selectedProjectId, role: 'contributor' } 
        })
      });
      if (!res.ok) throw new Error('Failed to add rights holder');
      toast.success('Rights holder added');
      setInvite({ name: '', email: '', wallet_address: '', percentage: 0 });
      if (selectedProjectId && selectedProjectId !== 'new') fetchContributors(selectedProjectId);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading || !user) return null;

  const currentProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div className="flex h-screen bg-[#0B0C10] text-white overflow-hidden">
      
      {/* ── LEFT SIDEBAR ────────────────────────────────────────── */}
      <aside className="w-72 bg-white/5 border-r border-white/10 flex flex-col">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-xl font-black tracking-tighter flex items-center gap-2">
            <span className="text-indigo-500 text-2xl">💎</span>
            LUNIM <span className="text-gray-500 font-light">ADMIN</span>
          </h1>
        </div>

        <div className="p-4">
          <button 
            onClick={() => setSelectedProjectId('new')}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all border ${
              selectedProjectId === 'new' 
                ? 'bg-indigo-500 border-indigo-400 shadow-lg shadow-indigo-500/20' 
                : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            <span className="text-lg">+</span> Add New Project
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-1 py-2 custom-scrollbar">
          <p className="px-2 text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Projects</p>
          {projects.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setSelectedProjectId(p.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all group ${
                selectedProjectId === p.id 
                  ? 'bg-white/10 text-white' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-black text-white shadow-lg`}>
                {p.name.charAt(0)}
              </div>
              <span className="truncate flex-1 text-left">{p.name}</span>
              <div onClick={(e) => { e.stopPropagation(); handleDeleteProject(p.id); }} className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all p-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ───────────────────────────────────── */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* MIDDLE COLUMN: PROJECT MANAGEMENT */}
        <section className="flex-1 overflow-y-auto p-8 border-r border-white/10 custom-scrollbar">
          <AnimatePresence mode="wait">
            {selectedProjectId === 'new' ? (
              <motion.div 
                key="new-project"
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                className="max-w-2xl mx-auto space-y-8 py-10"
              >
                <div className="space-y-2">
                  <h2 className="text-3xl font-black">Launch New Project</h2>
                  <p className="text-gray-500">Initialize a new revenue distribution pool.</p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6 backdrop-blur-xl">
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Project Name</label>
                      <input 
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-all mt-1" 
                        placeholder="e.g. Midnight Horizon EP"
                        value={newProject.name}
                        onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Initial Revenue (USD)</label>
                      <input 
                        type="number"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-all mt-1" 
                        placeholder="0.00"
                        value={newProject.total_revenue || ''}
                        onChange={(e) => setNewProject({...newProject, total_revenue: Number(e.target.value)})}
                      />
                    </div>
                  </div>

                  <button 
                    disabled={isActionLoading}
                    onClick={handleCreateProject}
                    className="w-full py-4 bg-indigo-500 hover:bg-indigo-400 text-white font-black rounded-xl transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50"
                  >
                    {isActionLoading ? 'Creating Pool...' : 'Initialize Project'}
                  </button>
                </div>
              </motion.div>
            ) : selectedProjectId ? (
              <motion.div 
                key={selectedProjectId}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-end border-b border-white/5 pb-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Live Management</span>
                    </div>
                    <h2 className="text-4xl font-black tracking-tight">{currentProject?.name}</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total Distributed</p>
                    <p className="text-2xl font-black text-emerald-400">${Number(currentProject?.total_revenue || 0).toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Rights Holders & Allocations</h3>
                    <span className="text-[10px] font-bold text-gray-600">{contributors.length} RECIPIENTS</span>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 bg-white/5">
                          <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Name</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Wallet Address</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Share %</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {contributors.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-6 py-20 text-center text-gray-500 italic text-sm">
                              No rights holders assigned to this project yet.
                            </td>
                          </tr>
                        ) : (
                          contributors.map((c) => (
                            <tr key={c.id} className="hover:bg-white/[0.02] transition-colors group">
                              <td className="px-6 py-4">
                                <input 
                                  className="bg-transparent border-none text-white font-bold focus:ring-0 w-full p-0"
                                  value={c.name}
                                  onChange={(e) => handleUpdateContributor(c, 'name', e.target.value)}
                                />
                              </td>
                              <td className="px-6 py-4">
                                <input 
                                  className="bg-transparent border-none text-gray-400 font-mono text-xs focus:ring-0 w-full p-0"
                                  value={c.wallet_address}
                                  onChange={(e) => handleUpdateContributor(c, 'wallet_address', e.target.value)}
                                />
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <input 
                                    type="number"
                                    className="bg-white/5 border border-white/10 rounded px-2 py-1 text-white font-black text-sm w-16 text-right focus:border-indigo-500 focus:outline-none"
                                    value={c.percentage || c.revenue_share}
                                    onChange={(e) => handleUpdateContributor(c, 'percentage', e.target.value)}
                                  />
                                  <span className="text-gray-600 font-bold text-xs">%</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-center gap-2">
                                  <button 
                                    onClick={() => saveContributorChanges(c)}
                                    className="p-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-lg transition-all"
                                    title="Save Changes"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteContributor(c.id)}
                                    className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                                    title="Remove"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  {contributors.length > 0 && (
                    <div className="flex justify-end pt-4">
                      <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-3">Total Allocation:</span>
                        <span className={`text-lg font-black ${
                          contributors.reduce((sum, c) => sum + Number(c.percentage || c.revenue_share), 0) === 100 
                            ? 'text-emerald-400' 
                            : 'text-rose-400'
                        }`}>
                          {contributors.reduce((sum, c) => sum + Number(c.percentage || c.revenue_share), 0)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-4xl">📁</div>
                <div>
                  <h3 className="text-xl font-black">Project Workspace</h3>
                  <p className="text-sm text-gray-500 max-w-xs">Select a project from the sidebar to manage its revenue splits and rights holders.</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </section>

        {/* RIGHT COLUMN: ADD RIGHTS HOLDER */}
        <aside className="w-80 bg-white/5 p-6 flex flex-col gap-8">
          <div className="space-y-1">
            <h3 className="text-lg font-black tracking-tight">Add Rights Holder</h3>
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Onboard new contributor</p>
          </div>

          <div className="space-y-5">
            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] ml-1">Full Name</label>
                <input 
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" 
                  placeholder="Artist or Creator Name"
                  value={invite.name}
                  onChange={(e) => setInvite({...invite, name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] ml-1">Email Address</label>
                <input 
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" 
                  placeholder="email@example.com"
                  value={invite.email}
                  onChange={(e) => setInvite({...invite, email: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] ml-1">Wallet Address</label>
                <input 
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono placeholder-gray-600 focus:outline-none focus:border-indigo-500" 
                  placeholder="0x..."
                  value={invite.wallet_address}
                  onChange={(e) => setInvite({...invite, wallet_address: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] ml-1">Allocation Share (%)</label>
                <div className="relative">
                  <input 
                    type="number"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 pr-10" 
                    placeholder="0"
                    value={invite.percentage || ''}
                    onChange={(e) => setInvite({...invite, percentage: Number(e.target.value)})}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 font-bold">%</span>
                </div>
              </div>
            </div>

            <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-4 space-y-2">
              <p className="text-[9px] font-black text-indigo-400/60 uppercase tracking-widest">Target Project</p>
              <p className="text-sm font-bold text-indigo-300">
                {selectedProjectId === 'new' ? 'Create Project First' : currentProject?.name || 'Select a Project'}
              </p>
            </div>

            <button 
              disabled={isActionLoading || !selectedProjectId || selectedProjectId === 'new'}
              onClick={handleAddRightsHolder}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-30 disabled:grayscale"
            >
              {isActionLoading ? 'Onboarding...' : 'Add to Pool'}
            </button>
          </div>

          <div className="mt-auto pt-6 border-t border-white/5">
             <p className="text-[9px] text-gray-600 font-medium leading-relaxed">
               Onboarding a new rights holder will automatically create a secure profile and link their wallet to the project's revenue distribution smart contract.
             </p>
          </div>
        </aside>

      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
