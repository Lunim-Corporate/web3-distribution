'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [contributors, setContributors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Forms
  const [newProject, setNewProject] = useState({ name: '', type: 'Film', status: 'Active' });
  const [invite, setInvite] = useState({ name: '', email: '', wallet_address: '', percentage: 0 });
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      fetchProjects();
      return;
    }

    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role !== 'admin') {
      router.replace('/dashboard');
      return;
    }

    fetchProjects();
  }, [user, router]);

  const fetchProjects = async () => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      fetchContributors(selectedProjectId);
    }
  }, [selectedProjectId]);

  const fetchContributors = async (projectId: string) => {
    try {
      const res = await fetch(`/api/dashboard/data?projectId=${projectId}&mode=live`);
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
      toast.success('Project initialized successfully');
      setNewProject({ name: '', type: 'Film', status: 'Active' });
      setShowNewProjectModal(false);
      await fetchProjects();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUpdateContributor = (id: string, field: string, value: any) => {
    setContributors(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const getProjectedTotal = (targetId: string, nextPercentage: number) => {
    return contributors.reduce((sum, contributor) => {
      if (contributor.id === targetId) return sum + nextPercentage;
      return sum + Number(contributor.percentage || contributor.revenue_share || 0);
    }, 0);
  };

  const saveContributor = async (c: any) => {
    const nextPercentage = Number(c.percentage ?? c.revenue_share ?? 0);
    if (!Number.isFinite(nextPercentage) || nextPercentage < 0 || nextPercentage > 100) {
      toast.error('Allocation must be between 0% and 100%');
      return;
    }

    const projectedTotal = getProjectedTotal(c.id, nextPercentage);
    if (projectedTotal > 100.000001) {
      toast.error(`This update would push the project to ${projectedTotal.toFixed(2)}%`);
      return;
    }

    setIsActionLoading(true);
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
      toast.success('Allocation updated');
      fetchContributors(selectedProjectId!);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRemoveContributor = async (id: string) => {
    if (!confirm('Are you sure you want to remove this rights holder?')) return;
    setIsActionLoading(true);
    try {
      const res = await fetch('/api/admin-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'delete_contributor', 
          payload: { contributor_id: id } 
        })
      });
      if (!res.ok) throw new Error('Removal failed');
      toast.success('Rights holder removed');
      fetchContributors(selectedProjectId!);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleAddRightsHolder = async () => {
    if (!invite.name || !invite.email || !invite.wallet_address || !selectedProjectId) {
      return toast.error('Name, email, wallet address, and project are required');
    }

    const nextPercentage = Number(invite.percentage || 0);
    if (!Number.isFinite(nextPercentage) || nextPercentage < 0 || nextPercentage > 100) {
      return toast.error('Allocation must be between 0% and 100%');
    }

    const projectedTotal = totalAllocation + nextPercentage;
    if (projectedTotal > 100.000001) {
      return toast.error(`This addition would push the project to ${projectedTotal.toFixed(2)}%`);
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
      if (!res.ok) throw new Error('Onboarding failed');
      toast.success('New rights holder onboarded');
      setInvite({ name: '', email: '', wallet_address: '', percentage: 0 });
      fetchContributors(selectedProjectId);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) return (
    <div className="h-screen bg-[#0B0C10] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const currentProject = projects.find(p => p.id === selectedProjectId);
  const totalAllocation = contributors.reduce((sum, c) => sum + Number(c.percentage || c.revenue_share || 0), 0);

  return (
    <div className="flex h-screen bg-[#0B0C10] text-white overflow-hidden font-sans">
      
      {/* ── SIDEBAR: PROJECT LIST ─────────────────────────── */}
      <aside className="w-80 bg-white/5 border-r border-white/10 flex flex-col">
        <div className="p-8 border-b border-white/10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-xl">💎</span>
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight uppercase">Lunim Admin</h1>
              <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Management Suite</p>
            </div>
          </div>

          <button 
            onClick={() => setShowNewProjectModal(true)}
            className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-white/10 hover:border-white/20 transition-all shadow-inner"
          >
            + New Project
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedProjectId(p.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group ${
                selectedProjectId === p.id 
                  ? 'bg-indigo-500/10 border border-indigo-500/20 shadow-lg' 
                  : 'hover:bg-white/5 text-gray-400 hover:text-white border border-transparent'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${selectedProjectId === p.id ? 'from-indigo-500 to-purple-600' : 'from-gray-700 to-gray-800'} flex items-center justify-center text-xs font-black text-white shadow-md transition-transform group-hover:scale-105`}>
                {p.name.charAt(0)}
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className={`text-sm font-black truncate ${selectedProjectId === p.id ? 'text-white' : 'text-gray-400'}`}>{p.name}</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{p.type || 'Project'}</p>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* ── MAIN: CONTRIBUTOR MANAGEMENT ──────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-transparent to-white/[0.02]">
        {currentProject ? (
          <>
            <header className="p-10 border-b border-white/10 flex justify-between items-end">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Active Workspace</span>
                </div>
                <h2 className="text-4xl font-black tracking-tighter">{currentProject.name}</h2>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Total Distributed</p>
                <p className="text-3xl font-black text-emerald-400 font-mono">${(Number(currentProject.total_revenue || 0) / 100).toLocaleString()}</p>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Revenue Allocations</h3>
                <div className={`px-4 py-2 rounded-xl border ${totalAllocation === 100 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                   <span className="text-[10px] font-black uppercase tracking-widest mr-2">Total:</span>
                   <span className="text-lg font-black">{totalAllocation.toFixed(2)}%</span>
                </div>
              </div>

              <div className="space-y-3">
                {contributors.map((c) => {
                  const isEditing = editingId === c.id;
                  const share = c.percentage || c.revenue_share || 0;
                  
                  return (
                    <div key={c.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center gap-6 group hover:bg-white/[0.07] transition-all">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-xl font-black text-white/50 border border-white/10 shadow-lg">
                        {c.name.charAt(0)}
                      </div>
                      
                      <div className="flex-1 grid grid-cols-12 gap-8 items-center">
                        <div className="col-span-3">
                          <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest block mb-1.5">Full Name</label>
                          {isEditing ? (
                            <input 
                              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-bold text-sm w-full focus:border-indigo-500 outline-none"
                              value={c.name}
                              onChange={(e) => handleUpdateContributor(c.id, 'name', e.target.value)}
                            />
                          ) : (
                            <p className="text-white font-black text-lg truncate">{c.name}</p>
                          )}
                        </div>
                        
                        <div className="col-span-4">
                          <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest block mb-1.5">Wallet Address</label>
                          {isEditing ? (
                            <input 
                              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-gray-300 font-mono text-[10px] w-full focus:border-indigo-500 outline-none"
                              value={c.wallet_address}
                              onChange={(e) => handleUpdateContributor(c.id, 'wallet_address', e.target.value)}
                            />
                          ) : (
                            <p className="text-gray-500 font-mono text-xs truncate">{c.wallet_address.slice(0, 10)}...{c.wallet_address.slice(-8)}</p>
                          )}
                        </div>
                        
                        <div className="col-span-2">
                          <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest block mb-1.5">Share %</label>
                          {isEditing ? (
                            <div className="relative">
                              <input 
                                type="number"
                                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white font-black text-xl w-full focus:border-indigo-500 transition-all outline-none"
                                value={share}
                                onChange={(e) => handleUpdateContributor(c.id, 'percentage', e.target.value)}
                              />
                            </div>
                          ) : (
                            <p className="text-emerald-400 font-black text-2xl tracking-tighter">{share}%</p>
                          )}
                        </div>

                        <div className="col-span-3 flex items-center justify-end gap-6">
                          {isEditing ? (
                            <>
                              <button 
                                onClick={() => {
                                  saveContributor(c);
                                  setEditingId(null);
                                }}
                                className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors"
                              >
                                Save
                              </button>
                              <button 
                                onClick={() => setEditingId(null)}
                                className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-300 transition-colors"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                onClick={() => setEditingId(c.id)}
                                className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-indigo-400 transition-colors"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => handleRemoveContributor(c.id)}
                                className="text-[10px] font-black uppercase tracking-widest text-gray-700 hover:text-rose-400 transition-colors"
                              >
                                Remove
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30">
            <div className="text-8xl mb-6">📂</div>
            <h3 className="text-2xl font-black uppercase tracking-tighter">Workspace Empty</h3>
            <p className="max-w-xs text-gray-500 font-medium">Select a project from the sidebar or create a new one to begin management.</p>
          </div>
        )}
      </main>

      {/* ── RIGHT: ONBOARDING ─────────────────────────────── */}
      <aside className="w-96 bg-white/5 border-l border-white/10 p-10 overflow-y-auto custom-scrollbar">
        <div className="mb-10">
          <h3 className="text-xl font-black tracking-tight mb-2">Onboard Rights Holder</h3>
          <p className="text-sm text-gray-500 leading-relaxed">Add a new participant to the <strong>{currentProject?.name || 'current'}</strong> pool.</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Selected Project</label>
              <input
                className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-gray-400 outline-none mt-1"
                value={currentProject?.name || ''}
                readOnly
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Full Name</label>
              <input 
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-emerald-500 transition-all outline-none mt-1"
                placeholder="Artist Name"
                value={invite.name}
                onChange={(e) => setInvite({...invite, name: e.target.value})}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Email Address</label>
              <input 
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-emerald-500 transition-all outline-none mt-1"
                placeholder="email@moonstone.io"
                value={invite.email}
                onChange={(e) => setInvite({...invite, email: e.target.value})}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Wallet Address</label>
              <input 
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white font-mono text-xs focus:border-emerald-500 transition-all outline-none mt-1"
                placeholder="0x..."
                value={invite.wallet_address}
                onChange={(e) => setInvite({...invite, wallet_address: e.target.value})}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Allocation Share (%)</label>
              <div className="relative mt-1">
                <input 
                  type="number"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white font-black text-xl focus:border-emerald-500 transition-all outline-none pr-12"
                  value={invite.percentage || ''}
                  onChange={(e) => setInvite({...invite, percentage: Number(e.target.value)})}
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-600 font-black text-xl">%</span>
              </div>
            </div>
          </div>

          <button 
            disabled={isActionLoading || !selectedProjectId}
            onClick={handleAddRightsHolder}
            className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-30 flex items-center justify-center gap-3"
          >
            {isActionLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : '+ Add to Pool'}
          </button>
          
          <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
            <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
               <span className="text-sm">ℹ️</span> System Note
            </p>
            <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
              Allocations are capped at 100% per project. This panel will block edits or new additions that would exceed the total across all rights holders.
            </p>
          </div>
        </div>
      </aside>

      {/* ── MODALS ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showNewProjectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
              onClick={() => setShowNewProjectModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-xl bg-[#0B0C10] border border-white/10 rounded-[3rem] p-10 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
              
              <div className="mb-10">
                <h3 className="text-3xl font-black tracking-tighter mb-2">Launch Project</h3>
                <p className="text-gray-500">Initialize a new revenue distribution vault.</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Project Name</label>
                  <input 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white text-lg focus:border-indigo-500 transition-all outline-none mt-1"
                    placeholder="e.g. Neon City Soundtrack"
                    value={newProject.name}
                    onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Category</label>
                    <select 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-indigo-500 transition-all outline-none mt-1"
                      value={newProject.type}
                      onChange={(e) => setNewProject({...newProject, type: e.target.value})}
                    >
                      <option value="Film">Film</option>
                      <option value="Music">Music</option>
                      <option value="Series">Series</option>
                      <option value="Game">Game</option>
                      <option value="Book">Book</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Status</label>
                    <select 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-indigo-500 transition-all outline-none mt-1"
                      value={newProject.status}
                      onChange={(e) => setNewProject({...newProject, status: e.target.value})}
                    >
                      <option value="Active">Active</option>
                      <option value="Draft">Draft</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button 
                    onClick={() => setShowNewProjectModal(false)}
                    className="flex-1 py-5 rounded-2xl font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleCreateProject}
                    disabled={isActionLoading}
                    className="flex-[2] py-5 bg-indigo-500 hover:bg-indigo-400 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-3"
                  >
                    {isActionLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : 'Confirm Launch'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
