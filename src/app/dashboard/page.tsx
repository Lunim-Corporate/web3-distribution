'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';

// Smart contract hook
import { useRevenueContract } from '../../hooks/useRevenueContract';

// Rich existing dashboard components
import { ChartsPanel } from '@/components/dashboard/ChartsPanel';
import { RevenueSnapshot } from '@/components/dashboard/RevenueSnapshot';
import { PaymentSplitter } from '@/components/dashboard/PaymentSplitter';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { ReportGenerator } from '@/components/dashboard/ReportGenerator';

// Simple components
import RightsHolderCard from '../../components/RightsHolderCard';
import TransactionHistory from '../../components/TransactionHistory';
import DistributeRevenuePanel from '../../components/DistributeRevenuePanel';

const formatUSD = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

// ─── Loading / Error Screen ────────────────────────────────────────────────
const LoadingScreen = ({ stage }: { stage: string }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center p-6">
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-purple-500/40">
        <span className="text-3xl">💎</span>
      </div>
      <h2 className="text-2xl font-black text-white">Initializing Moonstone</h2>
      <div className="flex items-center justify-center gap-2 mt-3">
        {[0, 150, 300].map((delay) => (
          <div key={delay} className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
        ))}
      </div>
      <p className="text-purple-300 mt-4 font-medium">{stage}</p>
    </motion.div>
  </div>
);

const ErrorScreen = ({ onRetry }: { onRetry: () => void }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center p-6">
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="bg-white/10 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-white/20 text-center max-w-md">
      <div className="text-5xl mb-4">⚠️</div>
      <h2 className="text-2xl font-black text-white mb-3">No Projects Found</h2>
      <p className="text-purple-200 mb-8 leading-relaxed">
        We couldn't find any active projects. Please run <code className="bg-white/10 px-2 py-0.5 rounded text-xs">node scripts/manual_seed.js</code> to seed demo data.
      </p>
      <button onClick={onRetry}
        className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-purple-500/30">
        Retry
      </button>
    </motion.div>
  </div>
);

// ─── Tab definition ─────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'revenue', label: 'Revenue', icon: '💰' },
  { id: 'holders', label: 'Rights Holders', icon: '👥' },
  { id: 'distribute', label: 'Distribute', icon: '⚡' },
  { id: 'reports', label: 'Reports', icon: '📄' },
] as const;
type TabId = typeof TABS[number]['id'];

// ─── Main Dashboard Component ────────────────────────────────────────────────
const Dashboard = () => {
  const { isAuthHydrated, user } = useAuth();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectsList, setProjectsList] = useState<Array<{id: string, name: string}>>([]);
  const [isError, setIsError] = useState(false);
  const [initStage, setInitStage] = useState('Checking authentication...');
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [distributeAmount, setDistributeAmount] = useState('');

  // FIXED: dependency array includes isAuthHydrated + user so this re-runs after auth settles
  useEffect(() => {
    if (!isAuthHydrated) {
      setInitStage('Checking authentication...');
      return;
    }
    if (!user) {
      setInitStage('Redirecting to login...');
      window.location.href = '/login';
      return;
    }

    const fetchInitialProject = async () => {
      setInitStage('Connecting to database...');
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('id, name')
          .eq('status', 'Active') // Filter to only show the fresh HBO projects
          .order('created_at', { ascending: false });
        if (error) { setIsError(true); return; }
        if (data && data.length > 0) { 
          setProjectsList(data);
          setProjectId(data[0].id); 
          setIsError(false); 
        }
        else setIsError(true);
      } catch { setIsError(true); }
    };
    fetchInitialProject();
  }, [isAuthHydrated, user]);

  // Smart-contract-backed data for the Distribute tab
  const { project, rightsHolders, transactions, isConnected, walletAddress, connectWallet, sendRevenue, txStatus, lastTxHash, errorMessage, isDemoMode, refreshDashboardData } = useRevenueContract(projectId);

  // Realtime subscription
  useEffect(() => {
    if (!projectId) return;
    const channel = supabase.channel('moonstone-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'payments', filter: `project_id=eq.${projectId}` }, () => refreshDashboardData()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [projectId, refreshDashboardData]);

  // ── Render guards ─────────────────────────────────────────────────────────
  if (!isAuthHydrated || (!projectId && !isError)) return <LoadingScreen stage={initStage} />;
  if (isError) return <ErrorScreen onRetry={() => window.location.reload()} />;

  const totalRevenue = Number((project as any)?.total_revenue || 0) / 100;

  // ── Header summary stats ──────────────────────────────────────────────────
  const statCards = [
    { label: 'Total Distributed', value: formatUSD(totalRevenue), icon: '💵', color: 'indigo' },
    { label: 'Rights Holders', value: String(rightsHolders.length), icon: '👥', color: 'purple' },
    { label: 'Transactions', value: String(transactions.length), icon: '🔁', color: 'blue' },
    { label: 'Status', value: (project as any)?.status || 'Active', icon: '✅', color: 'green' },
  ];

  return (
    <div className="min-h-screen pb-16">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <header className="bg-[#0B0C10]/60 backdrop-blur-3xl border-b border-white/5 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {/* Title */}
            <div className="flex items-start md:items-center gap-3 sm:gap-4 w-full md:w-auto min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-emerald-400 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                <span className="text-xl sm:text-2xl drop-shadow-md">💎</span>
              </div>
              <div className="min-w-0 flex-1">
                {projectsList.length > 0 ? (
                  <div className="relative isolate group max-w-full">
                    <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <select 
                      value={projectId || ''} 
                      onChange={(e) => setProjectId(e.target.value)}
                      className="relative text-lg sm:text-xl md:text-2xl font-black bg-[#1A1B23] border border-white/10 rounded-xl px-3 sm:px-4 py-2 pr-8 sm:pr-10 text-white shadow-xl outline-none cursor-pointer appearance-none w-full md:min-w-[280px] max-w-full hover:border-indigo-500/50 transition-colors focus:ring-2 focus:ring-indigo-500 focus:border-transparent truncate leading-tight"
                      style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23818cf8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem top 50%', backgroundSize: '0.65rem auto' }}
                    >
                      {projectsList.map(p => (
                        <option key={p.id} value={p.id} className="bg-gray-900 text-white font-medium">{p.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <h1 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight truncate">
                    {(project as any)?.name || 'Moonstone Elements'}
                  </h1>
                )}
                <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-semibold text-gray-500 mt-1 sm:mt-0.5 truncate">
                  <div className="w-1.5 h-1.5 shrink-0 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  <span className="tracking-widest uppercase shrink-0">Live Sync</span>
                  {user && <span className="truncate">• {user.name || user.email?.split('@')[0]} ({user.role})</span>}
                </div>
              </div>
            </div>

            {/* Stat pills */}
            <div className="grid grid-cols-2 md:flex md:flex-wrap gap-3 mt-6 md:mt-0 w-full md:w-auto">
              {statCards.map((s) => (
                <div key={s.label} className="px-5 py-3 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-lg relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/[0.05] to-white/0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{s.label}</div>
                  <div className={`text-lg font-black text-transparent bg-clip-text bg-gradient-to-r ${
                    s.color === 'indigo' ? 'from-indigo-400 to-cyan-400' :
                    s.color === 'purple' ? 'from-purple-400 to-fuchsia-400' :
                    s.color === 'blue' ? 'from-blue-400 to-indigo-400' :
                    'from-emerald-400 to-teal-400'
                  } font-mono tracking-tight shadow-sm`}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Tab Bar ─────────────────────────────────────────────────── */}
          <div className="flex gap-1.5 mt-8 overflow-x-auto scrollbar-none pb-2 -mx-1 px-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-white shadow-[inset_0_0_20px_rgba(99,102,241,0.2)] border border-indigo-500/30'
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

      {/* ── Tab Content ─────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
          >

            {/* ── OVERVIEW TAB ──────────────────────────────────────────── */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Charts */}
                <ChartsPanel />

                {/* Two-column: activity + recent holders */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <RecentActivity />
                  </div>
                  <div className="space-y-4">
                    <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">Top Rights Holders</h2>
                    {rightsHolders.slice(0, 3).map((holder: any, idx: number) => (
                      <RightsHolderCard key={holder.id || idx} holder={holder} distributeAmount={distributeAmount} />
                    ))}
                    {rightsHolders.length === 0 && (
                      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-dashed border-white/10 p-8 text-center shadow-lg relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 z-0"/>
                        <div className="text-3xl mb-2 relative z-10">👥</div>
                        <p className="text-gray-400 text-sm relative z-10">No rights holders yet</p>
                      </div>
                    )}
                    {rightsHolders.length > 3 && (
                      <button onClick={() => setActiveTab('holders')} className="w-full text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 text-sm font-bold hover:opacity-80 py-2 transition-all">
                        View all {rightsHolders.length} holders →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── REVENUE TAB ───────────────────────────────────────────── */}
            {activeTab === 'revenue' && (
              <div className="space-y-8">
                {/* Revenue Snapshot with filterable table */}
                <RevenueSnapshot activeProjectId={projectId} projectsList={projectsList} />

                {/* Payment Splitter */}
                <PaymentSplitter />

                {/* On-chain transaction history */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-xl">
                  <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-6 font-mono tracking-tight">On-Chain Transaction History</h2>
                  <TransactionHistory transactions={transactions} />
                </div>
              </div>
            )}

            {/* ── RIGHTS HOLDERS TAB ──────────────────────────────────── */}
            {activeTab === 'holders' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight">Rights Holders</h2>
                    <p className="text-sm font-medium text-gray-500 mt-1">All contributors and their revenue splits for this project</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                    LIVE SYNC
                  </div>
                </div>

                {rightsHolders.length === 0 ? (
                  <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-dashed border-white/10 p-16 text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 group-hover:scale-105 transition-transform duration-700"/>
                    <div className="text-6xl mb-4 relative z-10 drop-shadow-2xl">👥</div>
                    <h3 className="font-black text-white text-xl relative z-10 tracking-tight">No rights holders yet</h3>
                    <p className="text-gray-400 text-sm mt-2 relative z-10 font-medium">Add contributors via the API or seed script to see them here.</p>
                  </div>
                ) : (
                  <>
                    {/* Summary bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-lg relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total Holders</p>
                        <p className="text-3xl font-black text-white tracking-tighter">{rightsHolders.length}</p>
                      </div>
                      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-lg relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total Distributed</p>
                        <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-purple-400 to-fuchsia-400 tracking-tighter">{formatUSD(totalRevenue)}</p>
                      </div>
                      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-lg relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Avg. per Holder</p>
                        <p className="text-3xl font-black text-white tracking-tighter">
                          {rightsHolders.length > 0 ? formatUSD(totalRevenue / rightsHolders.length) : '$0'}
                        </p>
                      </div>
                      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-lg relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total Allocation</p>
                        <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-blue-400 tracking-tighter">
                          {(rightsHolders as any[]).reduce((s, h) => s + Number(h.percentage || 0), 0)}%
                        </p>
                      </div>
                    </div>

                    {/* Cards grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <AnimatePresence>
                        {(rightsHolders as any[]).map((holder, idx) => (
                          <motion.div key={holder.id || idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}>
                            <RightsHolderCard holder={holder} distributeAmount={distributeAmount} />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── DISTRIBUTE TAB ────────────────────────────────────────── */}
            {activeTab === 'distribute' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Visual context of the project + Main distribute panel */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-xl relative overflow-hidden group">
                     <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                     <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 relative z-10">Active Series Distribution</h3>
                     <h2 className="text-3xl font-black text-white relative z-10 tracking-tight">{(project as any)?.name}</h2>
                     <p className="text-gray-400 mt-2 text-sm relative z-10 line-clamp-2">{(project as any)?.description}</p>
                     <div className="mt-6 flex flex-wrap gap-2 relative z-10">
                       <span className="px-3 py-1 bg-indigo-500/20 rounded-full text-[9px] font-bold text-indigo-400 border border-indigo-500/20 uppercase tracking-widest">HBO Original</span>
                       <span className="px-3 py-1 bg-purple-500/20 rounded-full text-[9px] font-bold text-purple-400 border border-purple-500/20 uppercase tracking-widest">Web3 Rights Enabled</span>
                       <span className="px-3 py-1 bg-emerald-500/20 rounded-full text-[9px] font-bold text-emerald-400 border border-emerald-500/20 uppercase tracking-widest">Active Sync</span>
                     </div>
                  </div>

                  <DistributeRevenuePanel
                    isConnected={isConnected}
                    walletAddress={walletAddress}
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
                    onProjectChange={setProjectId}
                  />
                </div>

                {/* Right: holders + transaction history */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Rights holders scrollable/grid */}
                  <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4">
                      <div className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 animate-pulse">20 PROFILE(S) LOADED</div>
                    </div>
                    <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-6 font-mono tracking-tight leading-none">
                      Series Cast & Crew
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[850px] overflow-y-auto pr-2 custom-scrollbar">
                      {(rightsHolders as any[]).map((holder, idx) => (
                        <RightsHolderCard key={holder.id || idx} holder={holder} distributeAmount={distributeAmount} />
                      ))}
                    </div>
                  </div>

                  {/* On-chain transaction history */}
                  <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-xl">
                    <h2 className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-4 font-mono">Series Transaction Log</h2>
                    <TransactionHistory transactions={transactions} />
                  </div>
                </div>
              </div>
            )}

            {/* ── REPORTS TAB ───────────────────────────────────────────── */}
            {activeTab === 'reports' && (
              <div className="space-y-8">
                <ReportGenerator />
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Dashboard;
