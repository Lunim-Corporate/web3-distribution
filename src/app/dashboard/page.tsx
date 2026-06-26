'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';
import { ChartsPanel } from '@/components/dashboard/ChartsPanel';
import { RevenueSnapshot } from '@/components/dashboard/RevenueSnapshot';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { ReportGenerator } from '@/components/dashboard/ReportGenerator';
import { DistributePanel } from '@/components/dashboard/DistributePanel';
import { AddRightsHolderModal } from '@/components/dashboard/AddRightsHolderModal';
import { MyEarnings } from '@/components/dashboard/MyEarnings';
import { isDemoAccessEnabled, readDemoMode } from '@/app/lib/demoAccess';

import { useEthPrice } from '@/app/lib/useEthPrice';
import { formatUSD as fmtUSD, formatETH as fmtETH } from '@/app/lib/constants';

/* ─── Types ──────────────────────────────────────────────── */
interface Project { id: string; name: string; genre?: string; status: string; total_distributed: number; }
interface RightsHolder { id: string; full_name: string; role: string; wallet_address: string; percentage: number; avatar_initials?: string; total_received: number; project_id?: string; }
interface TxSplit { id: string; rights_holder_id: string; full_name: string; role: string; percentage: number; amount_eth: number; wallet_address: string; }
interface Transaction { id: string; tx_hash: string; sender_address: string; total_amount_eth: number; status: string; created_at: string; transaction_splits?: TxSplit[]; }

/* ─── Formatters ─────────────────────────────────────────── */


/* ─── Loading / Error screens ────────────────────────────── */
const Spinner = ({ text }: { text: string }) => (
  <div className="min-h-screen bg-[#070B14] flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-gray-400 font-medium">{text}</p>
    </div>
  </div>
);

const ErrorView = ({ msg, onRetry }: { msg: string; onRetry: () => void }) => (
  <div className="min-h-screen bg-[#070B14] flex items-center justify-center p-6">
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 text-center max-w-md shadow-2xl">
      <div className="text-5xl mb-4">⚠️</div>
      <h2 className="text-2xl font-black text-white mb-3">No Projects Found</h2>
      <p className="text-gray-400 mb-6 text-sm leading-relaxed">{msg}</p>
      <button onClick={onRetry} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-indigo-500/20">
        Retry
      </button>
    </motion.div>
  </div>
);

/* ─── Tab definitions ────────────────────────────────────── */
/* ─── Tab definitions ────────────────────────────────────── */
const TABS_BASE = [
  { id: 'overview',  label: 'Overview',       icon: '📊' },
  { id: 'revenue',   label: 'Revenue',         icon: '💰' },
  { id: 'earnings',  label: 'My Earnings',     icon: '💸' },
  { id: 'holders',   label: 'Rights Holders',  icon: '👥' },
  { id: 'reports',   label: 'Reports',          icon: '📄' },
] as const;
type TabId = typeof TABS_BASE[number]['id'] | 'distribute';

/* ═══════════════════════════════════════════════════════════
   Main Dashboard
═══════════════════════════════════════════════════════════ */
export default function Dashboard() {
  return (
    <Suspense fallback={<Spinner text="Loading dashboard..." />}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const { isAuthHydrated, user } = useAuth();
  const searchParams = useSearchParams();
  const { ethPrice } = useEthPrice();


  /* Auth / init */
  const [stage, setStage] = useState('Checking authentication…');
  const [isError, setIsError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  /* Project */
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);

  /* Rights-holder data */
  const [holders, setHolders] = useState<RightsHolder[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const tabParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('tab') : null;
    return (tabParam && ['overview', 'revenue', 'holders', 'reports', 'distribute'].includes(tabParam)) ? tabParam as TabId : 'overview';
  });
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isAddHolderModalOpen, setIsAddHolderModalOpen] = useState(false);

  const [selectedHolder, setSelectedHolder] = useState<RightsHolder | null>(null);

  /* ── Read ?tab= query param on navigation ────────────────── */
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'revenue', 'holders', 'reports', 'distribute'].includes(tabParam)) {
      setActiveTab(tabParam as TabId);
    }

    const projectParam = searchParams.get('project');
    if (projectParam === 'all') {
      setProjectId(null);
    } else if (projectParam && projectsList.some(p => p.id === projectParam)) {
      setProjectId(projectParam);
    }
  }, [searchParams, projectsList]);

  useEffect(() => {
    setIsDemoMode(readDemoMode());
    const onDemoChanged = (e: any) => {
      const enabled = isDemoAccessEnabled && e.detail;
      setIsDemoMode(enabled);
      if (!enabled && activeTab === 'distribute') {
        setActiveTab('overview');
      }
    };
    window.addEventListener('demo-mode-changed', onDemoChanged);
    return () => window.removeEventListener('demo-mode-changed', onDemoChanged);
  }, [activeTab]);


  /* ── Auth guard ──────────────────────────────────────────── */
  useEffect(() => {
    if (!isAuthHydrated) { setStage('Checking authentication…'); return; }
    if (!user) { setStage('Redirecting to login…'); window.location.href = '/login'; return; }

    const load = async () => {
      setStage('Loading projects…');
      try {
        const demoParam = readDemoMode();
        const res = await fetch(`/api/dashboard?pid=all&demo=${demoParam}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        
        if (!data.projectsList || data.projectsList.length === 0) {
          setIsError(true);
          setErrorMsg('No active projects found. Make sure the database is seeded.');
          return;
        }
        setProjectsList(data.projectsList);
        // Use defaultProjectId if provided (admin's own project), otherwise first project
        const initialId = data.defaultProjectId || data.projectsList[0].id;
        setProjectId(initialId);
      } catch (err) {
        setIsError(true);
        setErrorMsg('Error loading projects.');
      }
    };
    void load();
  }, [isAuthHydrated, user]);

  /* ── Load project data whenever projectId changes ─────────── */
  /* ── Load project data whenever projectId changes ─────────── */
  const loadProjectData = useCallback(async (pid: string | null) => {
    if (!user) return;
    
    try {
      const res = await fetch(`/api/dashboard?pid=${pid || 'all'}&demo=${isDemoMode}`, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      
      const data = await res.json();
      
      if (!pid) {
        setProject(data.project);
        setHolders(data.holders || []);
        setTransactions(data.transactions || []);
      } else {
        setProject(data.project);
        setHolders(data.holders || []);
        setTransactions(data.transactions || []);
      }
    } catch (err: any) {
      console.error(err);
      if (!pid) {
        setIsError(true);
        setErrorMsg('Failed to load project data. Please try again.');
      }
    }
  }, [user, isDemoMode]);

  useEffect(() => {
    if (isError) return;
    void loadProjectData(projectId);
  }, [projectId, loadProjectData, isError]);

  /* ── Realtime: refresh when a new transaction lands ─────────── */
  useEffect(() => {
    const onPayment = () => void loadProjectData(projectId);
    window.addEventListener('payment-recorded', onPayment);
    
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('lunim-realtime');
      bc.onmessage = (ev) => {
        if (ev.data?.type === 'payment-recorded') {
          onPayment();
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported');
    }
    
    return () => {
      window.removeEventListener('payment-recorded', onPayment);
      if (bc) bc.close();
    };
  }, [projectId, loadProjectData]);

  useEffect(() => {
    const channel = supabase.channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => void loadProjectData(projectId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transaction_splits' }, () => void loadProjectData(projectId))
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [projectId, loadProjectData]);

  /* ─── Render guards ──────────────────────────────────────── */
  if (!isAuthHydrated || (!projectId && !isError && projectsList.length === 0)) return <Spinner text={stage} />;
  if (isError) return <ErrorView msg={errorMsg} onRetry={() => window.location.reload()} />;

  const isAdmin = user?.role === 'admin';
  const canDistribute = isAdmin || isDemoMode;
  const tabs = [...TABS_BASE] as { id: TabId; label: string; icon: string }[];
  if (canDistribute) {
    tabs.push({ id: 'distribute', label: 'Distribute', icon: '🔀' });
  }

  const totalDistributed = Number(project?.total_distributed || 0);
  const totalUSD = totalDistributed * ethPrice;

  const statCards = [
    { label: 'Total Distributed', value: fmtUSD(totalUSD), sub: fmtETH(totalDistributed), color: 'indigo' },
    { label: 'Rights Holders', value: String(holders.length), sub: 'active contributors', color: 'purple' },
    { label: 'Transactions', value: String(transactions.length), sub: 'on-chain', color: 'blue' },
    { label: 'Project Status', value: project?.status || 'active', sub: project?.genre || '', color: 'emerald' },
  ];

  return (
    <div className="min-h-screen pb-16 pt-16">
      {/* ── Page Header ───────────────────────────────────────── */}
      <header className="bg-[#070B14]/80 backdrop-blur-3xl border-b border-white/5 sticky top-[60px] z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {/* Project switcher */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-emerald-400 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-xl">💎</span>
              </div>
              <div>
                <select
                  value={projectId || 'all'}
                  onChange={e => setProjectId(e.target.value === 'all' ? null : e.target.value)}
                  className="text-xl font-black bg-transparent border-none outline-none text-white cursor-pointer appearance-none pr-6 truncate"
                >
                  <option value="all" className="bg-gray-900">All Projects</option>
                  {projectsList.map(p => (
                    <option key={p.id} value={p.id} className="bg-gray-900">{p.name}</option>
                  ))}
                </select>
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-500 mt-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isDemoMode ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]' : 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'}`} />
                  <span className="uppercase tracking-widest">{isDemoMode ? 'Demo Sync' : 'Live Sync'}</span>
                  {user && <span>• {user.name || user.email?.split('@')[0]} ({user.role})</span>}
                </div>
              </div>
            </div>

            {/* Stat pills only — Web3 Demo button is in the Navbar */}
            <div className="flex flex-wrap items-center gap-3">
              {statCards.map(s => (
                <div key={s.label} className="px-4 py-2.5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-lg">
                  <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{s.label}</div>
                  <div className={`text-base font-black text-transparent bg-clip-text bg-gradient-to-r ${
                    s.color === 'indigo' ? 'from-indigo-400 to-cyan-400' :
                    s.color === 'purple' ? 'from-purple-400 to-fuchsia-400' :
                    s.color === 'blue' ? 'from-blue-400 to-indigo-400' : 'from-emerald-400 to-teal-400'
                  } font-mono`}>{s.value}</div>
                  {s.sub && <div className="text-[9px] text-gray-500 mt-0.5 truncate max-w-[100px]">{s.sub}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Tab Bar */}
          <div className="flex gap-1.5 mt-6 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-white border border-indigo-500/30 shadow-[inset_0_0_20px_rgba(99,102,241,0.15)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <span className={activeTab === tab.id ? 'opacity-100' : 'opacity-70'}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Tab Content ────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15 }}>

            {/* ── OVERVIEW ─────────────────────────────────────── */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <ChartsPanel projectId={projectId} isDemoMode={isDemoMode} />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <RecentActivity isDemoMode={isDemoMode} />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Top Rights Holders</h2>
                      {(isAdmin || isDemoMode) && project?.id !== 'all' && (
                        <button 
                          onClick={() => setIsAddHolderModalOpen(true)}
                          className="text-xs font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg transition-colors border border-indigo-500/20"
                        >
                          + Add Holder
                        </button>
                      )}
                    </div>
                    {holders.length === 0 ? (
                      <p className="text-xs text-gray-500">No rights holders visible.</p>
                    ) : holders.slice(0, 3).map((h) => (
                      <div key={h.id} onClick={() => setSelectedHolder(h)} className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl hover:border-indigo-500/40 cursor-pointer transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-indigo-300 font-black text-sm border border-indigo-500/10">
                            {(h.avatar_initials || h.full_name?.charAt(0) || '?')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-white text-sm truncate">{h.full_name}</p>
                            <p className="text-xs text-gray-400">{h.role}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-black text-indigo-400 font-mono">{h.percentage}%</p>
                            <p className="text-xs text-gray-500">{fmtETH(h.total_received)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {holders.length === 0 && (
                      <div className="bg-white/5 border border-dashed border-white/10 rounded-2xl p-8 text-center">
                        <div className="text-3xl mb-2">👥</div>
                        <p className="text-gray-400 text-sm">No rights holders yet</p>
                      </div>
                    )}
                    {holders.length > 3 && (
                      <button onClick={() => setActiveTab('holders')} className="w-full text-center text-indigo-400 text-sm font-bold hover:text-indigo-300 transition-colors py-2">
                        View all {holders.length} holders →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── REVENUE ──────────────────────────────────────── */}
            {activeTab === 'revenue' && (
              <div className="space-y-8">
                <RevenueSnapshot activeProjectId={projectId} projectsList={projectsList.map(p => ({ id: p.id, name: p.name }))} transactions={transactions} isDemoMode={isDemoMode} />
              </div>
            )}

            {/* ── MY EARNINGS ───────────────────────────────────── */}
            {activeTab === 'earnings' && (
              <div className="space-y-8">
                <MyEarnings 
                  user={user}
                  projectId={projectId}
                  holders={holders}
                  isDemoMode={isDemoMode}
                />
              </div>
            )}

            {/* ── RIGHTS HOLDERS ────────────────────────────────── */}
            {activeTab === 'holders' && (
              <div className="space-y-8">
                {/* Summary stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Holders', value: String(holders.length), grad: 'from-indigo-400 to-cyan-400' },
                    { label: 'Total Distributed', value: fmtETH(totalDistributed), grad: 'from-purple-400 to-fuchsia-400' },
                    { label: 'Avg. per Holder', value: holders.length ? fmtETH(totalDistributed / holders.length) : '0 ETH', grad: 'from-emerald-400 to-teal-400' },
                    { label: 'Total Allocation', value: `${holders.reduce((s, h) => s + Number(h.percentage), 0).toFixed(1)}%`, grad: 'from-amber-400 to-orange-400' },
                  ].map(s => (
                    <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xl">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{s.label}</p>
                      <p className={`text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r ${s.grad} mt-1 font-mono tracking-tight`}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Holders grid */}
                {holders.length === 0 ? (
                  <div className="bg-white/5 border border-dashed border-white/10 rounded-3xl p-16 text-center">
                    <div className="text-6xl mb-4">👥</div>
                    <h3 className="font-black text-white text-xl">No rights holders yet</h3>
                    <p className="text-gray-400 text-sm mt-2">Rights holders will appear here once configured.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence>
                      {holders.map((h, idx) => (
                        <motion.div key={h.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                          onClick={() => setSelectedHolder(h)}
                          className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xl hover:border-indigo-500/40 cursor-pointer transition-all group">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-indigo-300 font-black text-base border border-indigo-500/10">
                              {h.avatar_initials || h.full_name?.charAt(0) || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-white text-sm truncate">{h.full_name}</p>
                              <p className="text-xs text-gray-400">{h.role}</p>
                            </div>
                            <div className="shrink-0">
                              <span className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-black rounded-lg font-mono">
                                {h.percentage}%
                              </span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Total Received</span>
                              <span className="text-white font-bold font-mono">{fmtETH(h.total_received)}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">USD Value</span>
                              <span className="text-emerald-400 font-bold">{fmtUSD(h.total_received * ethPrice)}</span>
                            </div>
                            <div className="mt-3 pt-3 border-t border-white/5">
                              <p className="text-[10px] text-gray-500 mb-1">Wallet</p>
                              <p className="text-xs font-mono text-gray-300 truncate">{h.wallet_address}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}

              </div>
            )}

            {/* ── REPORTS ──────────────────────────────────────── */}
            {activeTab === 'reports' && (
              <div className="space-y-8">
                <ReportGenerator isDemoMode={isDemoMode} activeProjectId={projectId} />
              </div>
            )}

            {/* ── DISTRIBUTE (Admin or Demo Mode Only) ──────────────────────── */}
            {activeTab === 'distribute' && (isAdmin || isDemoMode) && (
              <div className="space-y-8">
                {!projectId ? (
                  <div className="border border-white/10 rounded-3xl p-16 text-center">
                    <div className="text-6xl mb-4">📂</div>
                    <h3 className="font-black text-white text-xl">Select a Project</h3>
                    <p className="text-gray-400 text-sm mt-2 max-w-md mx-auto">
                      You need to select a specific project from the dropdown above before distributing revenue. &ldquo;All Projects&rdquo; is not supported for distributions.
                    </p>
                    <button
                      onClick={() => {
                        const sel = document.querySelector('header select') as HTMLSelectElement | null;
                        sel?.focus();
                      }}
                      className="mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-indigo-500/20"
                    >
                      Choose Project
                    </button>
                  </div>
                ) : (
                  <DistributePanel project={project} holders={holders} />
                )}
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </main>

      {/* Modals */}
      <AddRightsHolderModal 
        isOpen={isAddHolderModalOpen}
        onClose={() => setIsAddHolderModalOpen(false)}
        projectId={project?.id || ''}
        onSuccess={() => void loadProjectData(projectId)}
      />

      {/* Holder Profile Modal */}
      <AnimatePresence>
        {selectedHolder && (
          <HolderProfileModal
            holder={selectedHolder}
            onClose={() => setSelectedHolder(null)}
            projectsList={projectsList}
            transactions={transactions}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function HolderProfileModal({ 
  holder, 
  onClose, 
  projectsList, 
  transactions 
}: { 
  holder: RightsHolder; 
  onClose: () => void;
  projectsList: Project[];
  transactions: Transaction[];
}) {
  const project = projectsList.find(p => p.id === holder.project_id);
  const { ethPrice } = useEthPrice();
  
  // All transactions for this holder with split details
  const holderTxs = transactions.filter(tx => 
    tx.transaction_splits?.some(s => s.rights_holder_id === holder.id || s.full_name === holder.full_name)
  ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Compute total received from splits
  const totalReceivedEth = holderTxs.reduce((acc, tx) => {
    const split = tx.transaction_splits?.find(s => s.rights_holder_id === holder.id || s.full_name === holder.full_name);
    return acc + (split?.amount_eth || 0);
  }, 0);
  const totalReceivedUsd = totalReceivedEth * ethPrice;

  // Role descriptions for flavour text
  const roleDescriptions: Record<string, string> = {
    'Director': 'Leads the creative vision and oversees all aspects of production from concept to final delivery.',
    'Producer': 'Manages production logistics, budgets, and coordinates between creative and business teams.',
    'Actor': 'Brings characters to life through performance, contributing to the storytelling and audience engagement.',
    'Writer': 'Crafts the narrative, dialogue, and story structure that forms the foundation of the project.',
    'Composer': 'Creates original music and scores that enhance the emotional impact of the production.',
    'Editor': 'Shapes the final product through post-production, assembling footage into a cohesive story.',
    'Cinematographer': 'Designs the visual language of the project through lighting, framing, and camera work.',
  };
  const description = roleDescriptions[holder.role] || `Contributes to the project as ${holder.role}, playing a key role in the creative and production process.`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0c1020] border border-white/10 rounded-3xl w-full max-w-2xl shadow-2xl shadow-black/40 overflow-hidden relative flex flex-col max-h-[90vh]"
      >
        {/* ── Header gradient accent ── */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-transparent pointer-events-none" />

        {/* ── Close button ── */}
        <div className="absolute top-4 right-4 z-10">
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-200 backdrop-blur-sm border border-white/5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* ── Profile header section ── */}
        <div className="relative px-8 pt-8 pb-6">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="w-20 h-20 shrink-0 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center text-indigo-300 font-black text-3xl border border-indigo-500/20 shadow-lg shadow-indigo-500/10">
              {holder.avatar_initials || holder.full_name?.charAt(0) || '?'}
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0 pt-1">
              <h2 className="text-2xl font-black text-white leading-tight">{holder.full_name}</h2>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="px-2.5 py-0.5 bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 text-[11px] font-bold uppercase tracking-wider rounded-lg">{holder.role}</span>
                <span className="text-gray-500 text-xs">•</span>
                <span className="text-gray-400 text-xs font-medium">{project?.name || 'Multiple Projects'}</span>
              </div>
              <p className="text-gray-500 text-xs leading-relaxed mt-2.5 max-w-md">{description}</p>
            </div>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="px-8 pb-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-4 text-center">
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total Received</p>
              <p className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 font-mono">{fmtUSD(totalReceivedUsd)}</p>
              <p className="text-[10px] text-gray-500 font-mono mt-0.5">{fmtETH(totalReceivedEth)}</p>
            </div>
            <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-4 text-center">
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Revenue Share</p>
              <p className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 font-mono">{holder.percentage}%</p>
              <p className="text-[10px] text-gray-500 mt-0.5">of total revenue</p>
            </div>
            <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-4 text-center">
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Transactions</p>
              <p className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 font-mono">{holderTxs.length}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">payments received</p>
            </div>
          </div>
        </div>

        {/* ── Wallet address bar ── */}
        <div className="px-8 pb-4">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl">
            <div className="w-5 h-5 rounded-md bg-purple-500/15 flex items-center justify-center shrink-0">
              <svg className="w-3 h-3 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" /></svg>
            </div>
            <span className="text-[11px] font-mono text-gray-400 truncate">{holder.wallet_address}</span>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="px-8"><div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" /></div>

        {/* ── Transaction list (scrollable) ── */}
        <div className="px-8 pt-5 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-indigo-500 rounded-full" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">All Transactions</h3>
          </div>
          <span className="text-[10px] text-gray-500 font-bold">{holderTxs.length} total</span>
        </div>

        <div className="flex-1 overflow-y-auto px-8 pb-6 min-h-0" style={{ maxHeight: '320px' }}>
          {holderTxs.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-3xl mb-2 opacity-50">📭</div>
              <p className="text-gray-500 text-sm font-medium">No transactions yet</p>
              <p className="text-gray-600 text-xs mt-1">Payments will appear here once distributed</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Column headers */}
              <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[9px] font-bold text-gray-500 uppercase tracking-widest border-b border-white/5">
                <div className="col-span-3">Date</div>
                <div className="col-span-3">Project</div>
                <div className="col-span-2 text-right">Source</div>
                <div className="col-span-2 text-right">Share</div>
                <div className="col-span-2 text-right">Received</div>
              </div>
              {holderTxs.map((tx) => {
                const split = tx.transaction_splits?.find(s => s.rights_holder_id === holder.id || s.full_name === holder.full_name);
                const projName = projectsList.find(p => p.id === (tx as any).project_id)?.name || 'Unknown';
                if (!split) return null;
                return (
                  <div key={tx.id} className="grid grid-cols-12 gap-2 items-center px-3 py-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-transparent hover:border-white/[0.06] transition-all duration-200 group">
                    <div className="col-span-3 flex flex-col">
                      <span className="text-xs text-gray-300 font-medium">{new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      <span className="text-[10px] text-gray-600">{new Date(tx.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="col-span-3">
                      <span className="text-xs text-gray-300 font-medium truncate block">{projName}</span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${
                        tx.status === 'confirmed' ? 'text-emerald-500' : tx.status === 'pending' ? 'text-amber-500' : 'text-rose-500'
                      }`}>{tx.status}</span>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="text-xs text-gray-300 font-mono font-medium">{fmtUSD(tx.total_amount_eth * ethPrice)}</span>
                      <p className="text-[10px] text-gray-600 font-mono">{tx.total_amount_eth.toFixed(4)}</p>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="text-xs text-indigo-400 font-black font-mono">{split.percentage}%</span>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="text-xs text-emerald-400 font-black font-mono">{fmtUSD(split.amount_eth * ethPrice)}</span>
                      <p className="text-[10px] text-gray-600 font-mono">{split.amount_eth.toFixed(4)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
