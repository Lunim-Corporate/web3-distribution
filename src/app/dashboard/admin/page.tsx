'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';
import { useRevenueContract } from '@/hooks/useRevenueContract';

// Components
import { ChartsPanel } from '@/components/dashboard/ChartsPanel';
import { RevenueSnapshot } from '@/components/dashboard/RevenueSnapshot';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { ReportGenerator } from '@/components/dashboard/ReportGenerator';
import { SetupWizard } from '@/components/dashboard/SetupWizard';
import DistributeRevenuePanel from '@/components/DistributeRevenuePanel';
import RightsHolderCard from '@/components/RightsHolderCard';
import TransactionHistory from '@/components/TransactionHistory';
import { TransactionIndicator } from '@/components/dashboard/TransactionIndicator';

const formatUSD = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

const TABS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'management', label: 'Management', icon: '⚙️' },
  { id: 'transactions', label: 'Transactions', icon: '🔁' },
  { id: 'reports', label: 'Reports', icon: '📄' },
] as const;

type TabId = typeof TABS[number]['id'];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectsList, setProjectsList] = useState<Array<{id: string, name: string}>>([]);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [distributeAmount, setDistributeAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('id, name')
          .eq('status', 'Active')
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

  const { project, rightsHolders, transactions, isConnected, walletAddress, connectWallet, sendRevenue, txStatus, lastTxHash, errorMessage, isDemoMode } = useRevenueContract(projectId);

  if (isLoading) return <div className="flex items-center justify-center p-20"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  if (projectsList.length === 0) {
    return <SetupWizard />;
  }

  const totalRevenue = Number((project as any)?.total_revenue || 0) / 100;

  return (
    <div className="space-y-10">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Project Management</h1>
          <p className="text-gray-500 font-medium mt-1">Global oversight and revenue control for {(project as any)?.name || 'Select Project'}</p>
        </div>

        <div className="flex items-center gap-4 bg-white/5 p-1 rounded-2xl border border-white/5">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
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
      </div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <ChartsPanel />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <RecentActivity />
                </div>
                <div className="space-y-6">
                  <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest px-1">Top Roster Members</h2>
                  {rightsHolders.slice(0, 3).map((holder: any, idx: number) => (
                    <RightsHolderCard key={holder.id || idx} holder={holder} distributeAmount={distributeAmount} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'management' && (
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
               <div className="lg:col-span-5">
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
               <div className="lg:col-span-7 space-y-8">
                  <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8">
                    <h3 className="text-lg font-bold text-white mb-6">Split Configuration</h3>
                    <div className="space-y-4">
                       {rightsHolders.map((holder: any, idx: number) => (
                         <div key={holder.id || idx} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400">
                                {holder.name?.charAt(0)}
                              </div>
                              <span className="text-sm font-bold text-white">{holder.name}</span>
                            </div>
                            <span className="font-mono text-indigo-400 font-bold">{holder.percentage}%</span>
                         </div>
                       ))}
                    </div>
                  </div>
                  <TransactionHistory transactions={transactions} />
               </div>
             </div>
          )}

          {activeTab === 'transactions' && (
            <RevenueSnapshot activeProjectId={projectId} projectsList={projectsList} />
          )}

          {activeTab === 'reports' && (
            <ReportGenerator />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Transaction Feedack */}
      <TransactionIndicator 
        status={txStatus as any} 
        txHash={lastTxHash} 
        type={activeTab === 'management' ? 'Revenue Distribution' : 'Split Configuration Sync'}
      />
    </div>
  );
}
