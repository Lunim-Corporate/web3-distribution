'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';
import { useSplits } from '@/hooks/useSplits';
import { RevenueSnapshot } from '@/components/dashboard/RevenueSnapshot';
import { WelcomeCard } from '@/components/dashboard/WelcomeCard';
import { ChartsPanel } from '@/components/dashboard/ChartsPanel';
import { ReportGenerator } from '@/components/dashboard/ReportGenerator';
import { toast } from 'react-hot-toast';
import { TransactionIndicator } from '@/components/dashboard/TransactionIndicator';
import { AnimatePresence } from 'framer-motion';

const formatUSD = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

export default function CreatorDashboard() {
  const { user } = useAuth();
  const { earnings, loading: protocolLoading, withdraw, withdrawalStatus } = useSplits(user?.wallet_address);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectsList, setProjectsList] = useState<Array<{id: string, name: string}>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'reports'>('overview');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data } = await supabase
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

  useEffect(() => {
    const onProjectChanged = (e: any) => {
      const id = e.detail;
      setProjectId(id || (projectsList.length > 0 ? projectsList[0].id : null));
    };
    window.addEventListener('project-selector-changed', onProjectChanged);
    return () => window.removeEventListener('project-selector-changed', onProjectChanged);
  }, [projectsList]);

  if (isLoading || protocolLoading) return <div className="flex items-center justify-center p-20 min-h-screen"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  const ethBalance = earnings?.activeBalances['0x0000000000000000000000000000000000000000'] || 0n;
  const claimable = Number(ethBalance) / 1e18; // Convert Wei to ETH
  const totalDistributed = earnings?.distributed || 0;

  const handleWithdraw = async () => {
    try {
      await withdraw();
      toast.success('Funds successfully withdrawn to your wallet!');
    } catch (err) {
      toast.error('Withdrawal failed. Please try again.');
    }
  };

  const hasEarnings = claimable > 0 || totalDistributed > 0;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
      {/* Welcome Section */}
      {!hasEarnings ? (
        <WelcomeCard />
      ) : (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-white tracking-tight">Your Earnings</h1>
            <p className="text-gray-500 font-medium">Transparent tracking of your creative rights and revenue splits.</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex items-center gap-10 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full -mr-16 -mt-16" />
             <div className="relative z-10">
               <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Earned</p>
               <p className="text-3xl font-black text-white">{formatUSD(totalDistributed)}</p>
             </div>
             <div className="w-px h-12 bg-white/10 relative z-10" />
             <div className="relative z-10">
               <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Claimable Balance</p>
               <p className="text-3xl font-black text-emerald-400 font-mono tracking-tighter">Ξ {claimable.toFixed(4)}</p>
             </div>
             <button 
                onClick={handleWithdraw}
                disabled={claimable <= 0 || withdrawalStatus === 'pending'}
                className="px-8 py-3.5 rounded-2xl bg-indigo-500 text-white text-sm font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-400 transition-all active:scale-[0.98] disabled:opacity-30 relative z-10"
             >
               {withdrawalStatus === 'pending' ? 'Withdrawing...' : 'Claim Earnings'}
             </button>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-4 bg-white/5 p-1 rounded-2xl border border-white/5 w-fit">
        {[
          { id: 'overview', label: 'Overview', icon: '📊' },
          { id: 'history', label: 'Payment History', icon: '🔁' },
          { id: 'reports', label: 'Tax Reports', icon: '📄' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
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

      {/* Main Content Areas */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-12"
        >
          {activeTab === 'overview' && (
            <div className="space-y-12">
              <ChartsPanel walletAddress={user?.wallet_address} />
              <section>
                <div className="flex items-center justify-between mb-8 px-1">
                  <h3 className="text-xl font-bold text-white tracking-tight">Recent Earnings</h3>
                </div>
                <RevenueSnapshot activeProjectId={projectId} projectsList={projectsList} walletAddress={user?.wallet_address} />
              </section>
            </div>
          )}

          {activeTab === 'history' && (
            <section>
              <div className="flex items-center justify-between mb-8 px-1">
                <h3 className="text-xl font-bold text-white tracking-tight">Full Payment History</h3>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Protocol Sync Active</span>
                </div>
              </div>
              <RevenueSnapshot activeProjectId={projectId} projectsList={projectsList} walletAddress={user?.wallet_address} />
            </section>
          )}

          {activeTab === 'reports' && (
            <section className="max-w-3xl">
              <div className="mb-8 px-1">
                <h3 className="text-xl font-bold text-white tracking-tight">Report Generator</h3>
                <p className="text-sm text-gray-500 mt-1">Export your revenue and tax data for external accounting.</p>
              </div>
              <ReportGenerator walletAddress={user?.wallet_address} />
            </section>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Info Panel */}
      <footer className="pt-20 border-t border-white/5 text-center">
        <p className="text-sm text-gray-600 font-medium">
          Payments are handled by the <a href="https://0xsplits.xyz" target="_blank" className="text-indigo-400 hover:underline">0xSplits Protocol</a> on Sepolia Testnet.
        </p>
      </footer>

      <TransactionIndicator 
        status={withdrawalStatus as any} 
        type="Earnings Withdrawal"
      />
    </div>
  );
}
