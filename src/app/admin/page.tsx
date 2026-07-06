'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { toast } from 'react-hot-toast';
import { readDemoMode } from '@/lib/demoAccess';

interface Project { id: string; name: string; }
interface RightsHolder { id: string; full_name: string; role: string; wallet_address: string; percentage: number; }
interface ProfileUser { id: string; display_name: string; role: string; wallet_address: string | null; created_at: string; }

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [holders, setHolders] = useState<RightsHolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profileUsers, setProfileUsers] = useState<ProfileUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [activeTab, setActiveTab] = useState<'roster' | 'users'>('roster');

  // New Holder State
  const [newName, setNewName] = useState('');
  const [newWallet, setNewWallet] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newPct, setNewPct] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editRole, setEditRole] = useState<string>('');
  const [editWallet, setEditWallet] = useState<string>('');
  const [editPct, setEditPct] = useState<string>('');
  const [editingWalletUserId, setEditingWalletUserId] = useState<string | null>(null);
  const [editedWalletAddress, setEditedWalletAddress] = useState<string>('');

  // Project Creation State
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectGenre, setNewProjectGenre] = useState('');

  // Project Editing State
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectGenre, setEditProjectGenre] = useState('');
  const [isSavingProject, setIsSavingProject] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const demoParam = readDemoMode();
      const res = await fetch(`/api/dashboard?pid=${selectedProjectId || 'all'}&demo=${demoParam}`);
      if (!res.ok) throw new Error('Failed to fetch admin data');
      const data = await res.json();
      setProjects(data.projectsList || []);
      if (selectedProjectId && selectedProjectId !== 'all') {
        setHolders(data.holders || []);
      } else {
        setHolders([]);
      }
    } catch (e: any) {
      toast.error('Failed to load project data');
    } finally {
      setIsLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role !== 'admin') {
      router.replace('/dashboard');
      return;
    }
    void loadData();
  }, [user, router, loadData]);

  // Find selected project details
  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const handleEditProject = () => {
    if (!selectedProject) return;
    setEditingProjectId(selectedProject.id);
    setEditProjectName(selectedProject.name);
    setEditProjectGenre((selectedProject as any).genre || '');
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProjectId || !editProjectName) return toast.error('Project name is required');
    setIsSavingProject(true);
    try {
      const res = await fetch(`/api/projects/${editingProjectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editProjectName, genre: editProjectGenre }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success('Project updated successfully');
      setEditingProjectId(null);
      await loadData();
    } catch (e: any) {
      toast.error(e.message || 'Error updating project');
    } finally {
      setIsSavingProject(false);
    }
  };

  const handleCancelEditProject = () => {
    setEditingProjectId(null);
  };

  const totalPct = holders.reduce((sum, h) => sum + Number(h.percentage || 0), 0);
  const is100Percent = Math.abs(totalPct - 100) < 0.01;

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName) return toast.error('Project name is required');
    setIsCreatingProject(true);
    try {
      const res = await fetch('/api/projects/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProjectName, genre: newProjectGenre }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const newProj = await res.json();
      toast.success('Project created successfully');
      setNewProjectName('');
      setNewProjectGenre('');
      setSelectedProjectId(newProj.id);
      await loadData();
    } catch (e: any) {
      toast.error(e.message || 'Error creating project');
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleAddHolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || selectedProjectId === 'all') return toast.error('Select a project first');
    if (!newName || !newWallet || !newPct) return toast.error('Fill out name, wallet, and percentage');

    setIsAdding(true);
    try {
      const res = await fetch('/api/rights/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: selectedProjectId,
          full_name: newName,
          role: newRole || 'Contributor',
          wallet_address: newWallet,
          percentage: Number(newPct)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error adding holder');
      toast.success('Rights holder added successfully');
      if (data.warning) {
        setTimeout(() => toast(data.warning, { icon: '⚠️', duration: 6000 }), 500);
      }
      setNewName(''); setNewWallet(''); setNewRole(''); setNewPct('');
      await loadData();
    } catch (e: any) {
      toast.error(e.message || 'Error adding holder');
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdateHolder = async (
    id: string,
    fullName: string,
    role: string,
    walletAddress: string,
    percentage: string
  ) => {
    if (!fullName || !role || !walletAddress || !percentage) {
      return toast.error('All fields must be filled out');
    }
    try {
      const res = await fetch('/api/rights/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          id,
          full_name: fullName,
          role,
          wallet_address: walletAddress,
          percentage: Number(percentage)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');
      toast.success('Rights holder updated successfully');
      if (data.warning) {
        setTimeout(() => toast(data.warning, { icon: '⚠️', duration: 6000 }), 500);
      }
      setEditingId(null);
      await loadData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to update rights holder');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this rights holder?')) return;
    try {
      const res = await fetch('/api/rights/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove');
      toast.success('Rights holder removed');
      if (data.warning) {
        setTimeout(() => toast(data.warning, { icon: '⚠️', duration: 6000 }), 500);
      }
      await loadData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to remove holder');
    }
  };

  const fetchUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setProfileUsers(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, role: newRole }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success(`User role updated to ${newRole}`);
      await fetchUsers();
    } catch (e: any) {
      toast.error(e.message || 'Failed to update role');
    }
  };

  const handleSaveUserWallet = async (userId: string) => {
    if (editedWalletAddress && !editedWalletAddress.startsWith('0x')) {
      return toast.error('Wallet address must start with 0x');
    }
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, wallet_address: editedWalletAddress || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update wallet');
      toast.success('User wallet updated successfully');
      setEditingWalletUserId(null);
      await fetchUsers();
    } catch (e: any) {
      toast.error(e.message || 'Failed to update wallet');
    }
  };

  if (isLoading || !user) return <div className="p-8 text-center text-white">Loading Admin Panel...</div>;

  return (
    <main className="p-8 pt-24 max-w-7xl mx-auto space-y-8 min-h-screen pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Admin Control Center</h1>
          <p className="text-gray-400 mt-2 font-medium">Manage your Web3 projects, rights holders, and revenue allocations.</p>
        </div>
        <div className="text-right">
          <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-2xl inline-block backdrop-blur-xl">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">Projects Active</p>
            <p className="text-2xl font-black text-white">{projects.length}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-1 bg-white/5 border border-white/10 rounded-2xl p-1 w-fit backdrop-blur-xl">
        <button
          onClick={() => setActiveTab('roster')}
          className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'roster' ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
        >
          Project Roster
        </button>
        <button
          onClick={() => { setActiveTab('users'); void fetchUsers(); }}
          className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
        >
          User Management
        </button>
      </div>

      {activeTab === 'roster' ? (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Sidebar: Project Creation & Selection */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Create New Project</h2>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Project Name</label>
                <input type="text" required value={newProjectName} onChange={e => setNewProjectName(e.target.value)} className="w-full bg-gray-900 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. HBO Original" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Genre</label>
                <input type="text" value={newProjectGenre} onChange={e => setNewProjectGenre(e.target.value)} className="w-full bg-gray-900 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Documentary" />
              </div>
              <button type="submit" disabled={isCreatingProject} className="w-full py-3 bg-white text-black font-black rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50 text-sm">
                {isCreatingProject ? 'Creating...' : '+ Create Project'}
              </button>
            </form>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Select Project</h2>
            {editingProjectId ? (
              <form onSubmit={handleSaveProject} className="space-y-3">
                <input
                  type="text"
                  value={editProjectName}
                  onChange={e => setEditProjectName(e.target.value)}
                  className="w-full bg-gray-900 border border-indigo-500/50 rounded-xl px-4 py-3 text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder="Project name"
                />
                <input
                  type="text"
                  value={editProjectGenre}
                  onChange={e => setEditProjectGenre(e.target.value)}
                  className="w-full bg-gray-900 border border-indigo-500/50 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder="Genre"
                />
                <div className="flex gap-2">
                  <button type="submit" disabled={isSavingProject}
                    className="flex-1 py-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl hover:bg-emerald-500/20 text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50"
                  >
                    {isSavingProject ? 'Saving...' : 'Save'}
                  </button>
                  <button type="button" onClick={handleCancelEditProject}
                    className="flex-1 py-2.5 bg-white/5 text-gray-400 rounded-xl hover:bg-white/10 text-xs font-black uppercase tracking-widest transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex gap-2">
                <select
                  value={selectedProjectId}
                  onChange={e => setSelectedProjectId(e.target.value)}
                  className="flex-1 bg-gray-900 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Choose Project --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {selectedProjectId && (
                  <button
                    onClick={handleEditProject}
                    className="px-3 py-3 bg-indigo-500/10 text-indigo-400 rounded-xl hover:bg-indigo-500/20 text-xs font-black uppercase tracking-widest transition-all border border-indigo-500/20"
                    title="Edit project"
                  >
                    Edit
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main Area: Roster Management */}
        <div className="lg:col-span-3 space-y-8">
          {selectedProjectId && selectedProjectId !== 'all' ? (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              
              {/* Roster Table */}
              <div className="xl:col-span-2 space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-xl font-black text-white">Project Roster</h2>
                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-black border uppercase tracking-widest ${is100Percent ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                    Allocation: {totalPct.toFixed(2)}% {is100Percent ? '✅' : '⚠️'}
                  </div>
                </div>

                {!is100Percent && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-5 rounded-2xl text-xs font-bold leading-relaxed shadow-lg shadow-rose-500/5">
                    ⚠️ CRITICAL: The total allocation must equal exactly 100.00% for the smart contract distribution logic to execute. Please adjust the percentages below to sync.
                  </div>
                )}

                <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
                  {holders.length === 0 ? (
                    <div className="text-center py-20 text-gray-500 font-bold">
                      <div className="text-4xl mb-4">👥</div>
                      No rights holders in this project yet.
                    </div>
                  ) : (
                    <table className="w-full text-left text-sm">
                      <thead className="bg-white/5 border-b border-white/10 text-[10px] uppercase tracking-widest text-gray-500">
                        <tr>
                          <th className="p-5 font-black">Holder</th>
                          <th className="p-5 font-black">Wallet Address</th>
                          <th className="p-5 font-black text-right">Share</th>
                          <th className="p-5 font-black text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-gray-200">
                        {holders.map(h => (
                          <tr key={h.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="p-5">
                              {editingId === h.id ? (
                                <div className="space-y-2 max-w-[180px]">
                                  <input
                                    type="text"
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    className="w-full bg-gray-900 border border-indigo-500/50 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none font-bold"
                                    placeholder="Name"
                                  />
                                  <input
                                    type="text"
                                    value={editRole}
                                    onChange={e => setEditRole(e.target.value)}
                                    className="w-full bg-gray-900 border border-indigo-500/50 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none font-bold"
                                    placeholder="Role"
                                  />
                                </div>
                              ) : (
                                <>
                                  <div className="font-black text-white">{h.full_name}</div>
                                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">{h.role}</div>
                                </>
                              )}
                            </td>
                            <td className="p-5">
                              {editingId === h.id ? (
                                <input
                                  type="text"
                                  value={editWallet}
                                  onChange={e => setEditWallet(e.target.value)}
                                  className="w-full bg-gray-900 border border-indigo-500/50 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono outline-none"
                                  placeholder="0x..."
                                />
                              ) : (
                                <span className="font-mono text-xs text-indigo-400 bg-indigo-500/5 px-2 py-1 rounded border border-indigo-500/10">
                                  {h.wallet_address.slice(0,10)}...{h.wallet_address.slice(-8)}
                                </span>
                              )}
                            </td>
                            <td className="p-5 text-right">
                              {editingId === h.id ? (
                                <div className="flex items-center justify-end">
                                  <input 
                                    type="number" step="0.01" value={editPct} onChange={e => setEditPct(e.target.value)}
                                    className="w-20 bg-gray-900 border border-indigo-500/50 rounded-lg px-2.5 py-1.5 text-right text-white font-mono font-bold outline-none"
                                  />
                                  <span className="text-xs text-gray-500 ml-1">%</span>
                                </div>
                              ) : (
                                <div className="font-mono font-black text-white text-base">
                                  {h.percentage}%
                                </div>
                              )}
                            </td>
                            <td className="p-5 text-center">
                              {editingId === h.id ? (
                                <div className="flex items-center justify-center gap-2">
                                  <button 
                                    onClick={() => handleUpdateHolder(h.id, editName, editRole, editWallet, editPct)} 
                                    className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20 text-xs font-black uppercase tracking-widest transition-all"
                                  >
                                    Save
                                  </button>
                                  <button 
                                    onClick={() => setEditingId(null)} 
                                    className="px-3 py-1.5 bg-white/5 text-gray-400 rounded-lg hover:bg-white/10 text-xs font-black uppercase tracking-widest transition-all"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-4">
                                  <button 
                                    onClick={() => { 
                                      setEditingId(h.id); 
                                      setEditName(h.full_name);
                                      setEditRole(h.role);
                                      setEditWallet(h.wallet_address);
                                      setEditPct(h.percentage.toString()); 
                                    }} 
                                    className="text-indigo-400 hover:text-indigo-300 text-[10px] font-black uppercase tracking-widest underline decoration-2 underline-offset-4"
                                  >
                                    Edit
                                  </button>
                                  <button onClick={() => handleDelete(h.id)} className="text-rose-400 hover:text-rose-300 text-[10px] font-black uppercase tracking-widest underline decoration-2 underline-offset-4">Remove</button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Add Holder Form */}
              <div className="xl:col-span-1">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl sticky top-[100px] shadow-2xl">
                  <h2 className="text-lg font-black text-white mb-6">Assign Rights Holder</h2>
                  <form onSubmit={handleAddHolder} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Full Name</label>
                      <input type="text" required value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-gray-900 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Christopher Nolan" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Role / Position</label>
                      <input type="text" value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full bg-gray-900 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Director" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Web3 Wallet</label>
                      <input type="text" required value={newWallet} onChange={e => setNewWallet(e.target.value)} className="w-full bg-gray-900 border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0x..." />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Percentage Allocation</label>
                      <div className="relative">
                        <input type="number" step="0.01" required value={newPct} onChange={e => setNewPct(e.target.value)} className="w-full bg-gray-900 border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-black font-mono outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0.00" />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-black">%</span>
                      </div>
                    </div>
                    <button type="submit" disabled={isAdding} className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black rounded-xl mt-4 hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all disabled:opacity-50 uppercase tracking-widest text-xs">
                      {isAdding ? 'Assigning...' : 'Assign to Project'}
                    </button>
                  </form>
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center py-32 bg-white/5 border border-dashed border-white/10 rounded-[40px] shadow-inner">
              <div className="text-7xl mb-6">🎬</div>
              <h3 className="text-2xl font-black text-white">Project Initialization</h3>
              <p className="text-gray-400 mt-3 max-w-sm mx-auto font-medium leading-relaxed">Select an existing project or create a new one to begin managing smart contract revenue distribution rosters.</p>
            </div>
          )}
        </div>

      </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-white">User Management</h2>
            <div className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {profileUsers.length} Users
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
            {isLoadingUsers ? (
              <div className="text-center py-20 text-gray-500 font-bold">Loading users...</div>
            ) : profileUsers.length === 0 ? (
              <div className="text-center py-20 text-gray-500 font-bold">No users found</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 border-b border-white/10 text-[10px] uppercase tracking-widest text-gray-500">
                  <tr>
                    <th className="p-5 font-black">Name</th>
                    <th className="p-5 font-black">Current Role</th>
                    <th className="p-5 font-black">Wallet</th>
                    <th className="p-5 font-black text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-gray-200">
                  {profileUsers.map(pu => (
                    <tr key={pu.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-5">
                        <div className="font-black text-white">{pu.display_name || 'Unnamed'}</div>
                      </td>
                      <td className="p-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          pu.role === 'ADMIN'
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {pu.role}
                        </span>
                      </td>
                      <td className="p-5">
                        {editingWalletUserId === pu.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editedWalletAddress}
                              onChange={(e) => setEditedWalletAddress(e.target.value)}
                              className="bg-gray-900 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white font-mono outline-none focus:ring-1 focus:ring-indigo-500 w-44"
                              placeholder="0x..."
                            />
                            <button
                              onClick={() => handleSaveUserWallet(pu.id)}
                              className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 transition-all"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingWalletUserId(null)}
                              className="px-2 py-1 bg-white/5 text-gray-400 rounded-lg hover:bg-white/10 text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            {pu.wallet_address ? (
                              <>
                                <span className="font-mono text-xs text-gray-400">
                                  {pu.wallet_address.slice(0, 10)}...{pu.wallet_address.slice(-6)}
                                </span>
                                <button
                                  onClick={() => {
                                    setEditingWalletUserId(pu.id);
                                    setEditedWalletAddress(pu.wallet_address || '');
                                  }}
                                  className="text-indigo-400 hover:text-indigo-300 text-[10px] font-black uppercase tracking-widest underline decoration-2 underline-offset-4 ml-2"
                                >
                                  Edit
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingWalletUserId(pu.id);
                                  setEditedWalletAddress('');
                                }}
                                className="px-3 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-500/20 hover:bg-indigo-500/20 transition-all"
                              >
                                + Add Wallet
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-5 text-right">
                        {pu.role === 'ADMIN' ? (
                          <button
                            onClick={() => handleRoleChange(pu.id, 'RIGHTS_HOLDER')}
                            className="px-4 py-2 bg-rose-500/10 text-rose-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-rose-500/20 hover:bg-rose-500/20 transition-all"
                          >
                            Demote to Rights Holder
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRoleChange(pu.id, 'ADMIN')}
                            className="px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-500/20 hover:bg-indigo-500/20 transition-all"
                          >
                            Promote to Admin
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

