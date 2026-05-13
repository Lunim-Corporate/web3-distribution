'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';
import { useRevenueContract } from '@/hooks/useRevenueContract';
import { useWallet } from '@/lib/wallet';

// Dashboard Components
import { ChartsPanel } from '@/components/dashboard/ChartsPanel';
import { RevenueSnapshot } from '@/components/dashboard/RevenueSnapshot';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { ReportGenerator } from '@/components/dashboard/ReportGenerator';
import DistributeRevenuePanel from '@/components/DistributeRevenuePanel';
import RightsHolderCard from '@/components/RightsHolderCard';
import TransactionHistory from '@/components/TransactionHistory';
import { RosterTable } from '@/components/dashboard/RosterTable';
import { AddMemberModal } from '@/components/dashboard/AddMemberModal';
import { RevenueTab } from '@/components/dashboard/RevenueTab';
import { RightsHolderRow } from '@/components/dashboard/RightsHolderProfile';

const formatUSD = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

const TABS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'revenue', label: 'Revenue', icon: '💰' },
  { id: 'rights-holders', label: 'Rights Holders', icon: '👥' },
  { id: 'reports', label: 'Reports', icon: '📄' },
  { id: 'distribute', label: 'Distribute', icon: '💎' },
] as const;

type TabId = typeof TABS[number]['id'];

// ── Color palette for project icons ─────────────────────────────
const PROJECT_COLORS = [
  'from-violet-500 to-purple-600',
  'from-cyan-500 to-blue-600',
  'from-emerald-500 to-green-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-indigo-500 to-blue-600',
];

export default function UnifiedDashboard() {
  const { isAuthHydrated, user } = useAuth();
  const router = useRouter();
  const { account: walletAddress, isConnected: walletConnected } = useWallet();

  // Project state
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectsList, setProjectsList] = useState<Array<{id: string, name: string}>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const projectRef = useRef<HTMLDivElement>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [distributeAmount, setDistributeAmount] = useState('');

  // Rights Holders modal
  const [showAddMember, setShowAddMember] = useState(false);

  // Auth guard
  useEffect(() => {
    if (isAuthHydrated && !user) {
      router.push('/login');
    }
  }, [isAuthHydrated, user, router]);

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('id, name')
          .or('status.eq.active,status.eq.Active,status.is.null')
          .order('created_at', { ascending: false });

        if (data && data.length > 0) {
          setProjectsList(data);
          setProjectId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch projects:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, []);

  // Listen for navbar project-selector-changed events
  useEffect(() => {
    const onProjectChanged = (e: any) => {
      const id = e.detail;
      if (id) {
        setProjectId(id);
      } else if (projectsList.length > 0) {
        setProjectId(null); // null = All Projects
      }
    };
    window.addEventListener('project-selector-changed', onProjectChanged);
    return () => window.removeEventListener('project-selector-changed', onProjectChanged);
  }, [projectsList]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (projectRef.current && !projectRef.current.contains(e.target as Node)) {
        setProjectDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // URL-based tab routing
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    const project = params.get('project');
    if (tab && TABS.some(t => t.id === tab)) {
      setActiveTab(tab as TabId);
    }
    if (project === 'all') {
      setProjectId(null);
    } else if (project) {
      setProjectId(project);
    }
  }, []);

  // Update URL when tab or project changes
  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    const params = new URLSearchParams();
    params.set('tab', tab);
    if (!projectId) params.set('project', 'all');
    else params.set('project', projectId);
    window.history.replaceState({}, '', `/dashboard?${params.toString()}`);
  };

  const handleProjectChange = (id: string | null) => {
    setProjectId(id);
    setProjectDropdownOpen(false);
    // Notify other components (Navbar, etc.)
    window.dispatchEvent(new CustomEvent('project-selector-changed', { detail: id || '' }));
    // Update URL
    const params = new URLSearchParams(window.location.search);
    if (!id) params.set('project', 'all');
    else params.set('project', id);
    window.history.replaceState({}, '', `/dashboard?${params.toString()}`);
  };

  // Contract hook
  const {
    project,
    rightsHolders,
    transactions,
    isConnected,
    walletAddress: contractWallet,
    connectWallet,
    sendRevenue,
    txStatus,
    lastTxHash,
    errorMessage,
    isDemoMode,
    refreshDashboardData,
    allProjects,
  } = useRevenueContract(projectId);

  // Synchronize projectsList with allProjects from hook
  useEffect(() => {
    if (allProjects && allProjects.length > 0) {
      setProjectsList(allProjects);
    }
  }, [allProjects]);

  // Compute display stats — prefer the hook's pre-computed value
  const totalRevenue = (project as any)?.total_distributed
    ?? (allProjects.reduce((sum: number, p: any) => sum + (Number(p.total_revenue) || 0), 0) / 100);

  const totalETH = totalRevenue / 3500;
  
  const holderCount = rightsHolders.length;

  const txCount = transactions.length;

  const projectName = projectId
    ? (project as any)?.name || projectsList.find(p => p.id === projectId)?.name || 'Unknown'
    : 'All Projects';
    
  const projectColorIndex = projectId
    ? projectsList.findIndex(p => p.id === projectId) % PROJECT_COLORS.length
    : 0;

  // Loading states
  if (!isAuthHydrated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-purple-500/40">
            <span className="text-3xl">💎</span>
          </div>
          <h2 className="text-2xl font-black text-white">Initializing Dashboard</h2>
          <div className="flex items-center justify-center gap-2 mt-3">
            {[0, 150, 300].map((delay) => (
              <div key={delay} className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20 min-h-screen">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">

      {/* ── Project Header & Stats Bar ───────────────────────────── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">

        {/* Project Selector */}
        <div className="flex items-center gap-4">
          <div className="relative" ref={projectRef}>
            <button
              onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
              className="flex items-center gap-3 group"
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${PROJECT_COLORS[projectColorIndex]} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}>
                <span className="text-white font-black text-lg">
                  {projectId ? projectName.charAt(0) : '🌐'}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-white tracking-tight">{projectName}</h1>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${projectDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    LIVE SYNC · {user.name || user.email?.split('@')[0]} ({user.role})
                  </span>
                </div>
              </div>
            </button>

            {/* Project Dropdown */}
            {projectDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 rounded-2xl shadow-2xl border border-white/10 bg-[#0B0C10]/95 backdrop-blur-xl overflow-hidden z-50" style={{ animation: 'dropdownFadeIn 0.2s ease-out' }}>
                <div className="p-3 border-b border-white/5">
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Switch Project</p>
                </div>
                <div className="p-1 max-h-[300px] overflow-y-auto">
                  <button
                    onClick={() => handleProjectChange(null)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${!projectId ? 'bg-indigo-500/10 text-indigo-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                  >
                    <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-sm">🌐</span>
                    All Projects
                  </button>
                  {projectsList.map((p, i) => (
                    <button
                      key={p.id}
                      onClick={() => handleProjectChange(p.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${projectId === p.id ? 'bg-indigo-500/10 text-indigo-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                    >
                      <span className={`w-8 h-8 rounded-lg bg-gradient-to-br ${PROJECT_COLORS[i % PROJECT_COLORS.length]} flex items-center justify-center text-white text-xs font-black`}>
                        {p.name.charAt(0)}
                      </span>
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 min-w-[140px]">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Total Distributed</p>
            <p className="text-lg font-black text-emerald-400 mt-0.5">{formatUSD(totalRevenue)}</p>
            <p className="text-[10px] font-mono text-gray-600">{totalETH.toFixed(4)} ETH</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 min-w-[130px]">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Rights Holders</p>
            <p className="text-lg font-black text-white mt-0.5">{holderCount}</p>
            <p className="text-[10px] text-gray-600">active contributors</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 min-w-[130px]">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Transactions</p>
            <p className="text-lg font-black text-white mt-0.5">{txCount}</p>
            <p className="text-[10px] text-gray-600">on-chain</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 min-w-[130px]">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Project Status</p>
            <p className="text-lg font-black text-emerald-400 mt-0.5">active</p>
            <p className="text-[10px] text-gray-600">{projectId ? (project as any)?.type || 'Project' : 'Platform'}</p>
          </div>
        </div>
      </div>

      {/* ── Tab Navigation ───────────────────────────────────────── */}
      <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/5 w-fit overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-white/10 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ──────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {/* ─── OVERVIEW TAB ──────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <ChartsPanel projectId={projectId} walletAddress={walletAddress || undefined} />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <RecentActivity />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest">Top Rights Holders</h2>
                    <button
                      onClick={() => setShowAddMember(true)}
                      className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded-lg hover:bg-indigo-500/10 transition-all"
                    >
                      + Add Holder
                    </button>
                  </div>
                  {rightsHolders.slice(0, 4).map((holder: any, idx: number) => (
                    <RightsHolderCard key={holder.id || idx} holder={holder} distributeAmount={distributeAmount} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── REVENUE TAB ───────────────────────────────────── */}
          {activeTab === 'revenue' && (
            <div className="space-y-6">
              <RevenueTab
                transactions={transactions}
                totalRevenue={totalRevenue}
                totalPaid={totalRevenue}
                projectsList={projectsList}
              />
            </div>
          )}

          {/* ─── RIGHTS HOLDERS TAB ────────────────────────────── */}
          {activeTab === 'rights-holders' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Rights Holders</h2>
                <button
                  onClick={() => setShowAddMember(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-500 hover:bg-indigo-400 text-white transition-all shadow-lg shadow-indigo-500/20"
                >
                  + Add Member
                </button>
              </div>

              {/* Split Configuration */}
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Split Configuration</h3>
                <div className="space-y-3">
                  {rightsHolders.map((holder: any, idx: number) => (
                    <RightsHolderRow key={holder.id || idx} holder={holder} transactions={transactions} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── REPORTS TAB ───────────────────────────────────── */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <ReportGenerator />
            </div>
          )}

          {/* ─── DISTRIBUTE TAB ────────────────────────────────── */}
          {activeTab === 'distribute' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-5">
                <div className="mb-4">
                  <h2 className="text-xl font-black text-white">Revenue Distribution Hub</h2>
                  <p className="text-sm text-gray-500 mt-1">Showcase how smart contracts automate revenue splits in real-time.</p>
                </div>
                <DistributeRevenuePanel
                  isConnected={isConnected}
                  walletAddress={contractWallet || ''}
                  connectWallet={connectWallet}
                  sendRevenue={sendRevenue}
                  txStatus={txStatus}
                  lastTxHash={lastTxHash}
                  errorMessage={errorMessage}
                  rightsHolders={rightsHolders}
                  distributeAmount={distributeAmount}
                  setDistributeAmount={setDistributeAmount}
                  isDemoMode={isDemoMode}
                  project={(project as any)}
                  projectsList={projectsList}
                  onProjectChange={(id) => handleProjectChange(id)}
                />
              </div>
              <div className="lg:col-span-7">
                <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Recipient Allocation</h3>
                    <span className="text-xs font-bold text-indigo-400">{rightsHolders.length} PAYEES</span>
                  </div>
                  <div className="space-y-3">
                    {rightsHolders.map((holder: any, idx: number) => {
                      const ethShare = distributeAmount
                        ? (Number(distributeAmount) * Number(holder.percentage) / 100)
                        : 0;
                      return (
                        <div key={holder.id || idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400">
                              {holder.name?.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white">{holder.name}</p>
                              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{holder.role}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold text-white">{holder.percentage}%</span>
                            {ethShare > 0 && (
                              <p className="text-[10px] font-mono text-gray-400">{ethShare.toFixed(4)} Ξ</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Add Member Modal */}
      {showAddMember && projectId && (
        <AddMemberModal
          projectId={projectId}
          onClose={() => setShowAddMember(false)}
          onSuccess={() => {
            setShowAddMember(false);
            refreshDashboardData?.();
          }}
        />
      )}

      {/* CSS */}
      <style jsx global>{`
        @keyframes dropdownFadeIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
