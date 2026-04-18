'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'react-hot-toast';
import { useRevenueContract } from '@/hooks/useRevenueContract';
import { useAuth } from '@/lib/auth';

interface RosterTableProps {
  contributors: any[];
  onRefresh: () => void;
}

export const RosterTable: React.FC<RosterTableProps> = ({ contributors, onRefresh }) => {
  const { updateSplitOnChain, txStatus } = useRevenueContract(contributors[0]?.project_id);
  const [draftRoster, setDraftRoster] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  React.useEffect(() => {
    setDraftRoster(contributors.map(c => ({ ...c })));
  }, [contributors]);

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    try {
      const { error } = await supabase
        .from('project_contributors')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) throw error;
      toast.success(`Member marked as ${newStatus}`);
      onRefresh();
    } catch (err) {
      toast.error('Failed to update status');
      console.error(err);
    }
  };

  const updateShare = (id: string, newShare: string) => {
    const val = parseInt(newShare) || 0;
    setDraftRoster(prev => prev.map(c => c.id === id ? { ...c, revenue_share: val } : c));
    setIsEditing(true);
  };

  const totalPercentage = draftRoster.reduce((sum, c) => sum + (c.status === 'Active' ? c.revenue_share : 0), 0);
  const hasChanges = JSON.stringify(draftRoster) !== JSON.stringify(contributors);

  const handleSave = async () => {
    if (totalPercentage !== 100) {
      toast.error(`Total percentage must be 100% (Current: ${totalPercentage}%)`);
      return;
    }
    await updateSplitOnChain(draftRoster);
    setIsEditing(false);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/5">
              <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Contributor</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Wallet</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Share</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Status</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {draftRoster.map((c, idx) => (
              <motion.tr 
                key={c.id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${c.status === 'Inactive' ? 'opacity-30' : ''}`}
              >
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                      c.status === 'Active' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {(c.users?.name || 'U').charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white leading-tight">{c.users?.name || 'Unknown'}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{c.role}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <code className="text-[11px] text-indigo-300 font-mono bg-indigo-500/5 px-2 py-1 rounded">
                    {c.users?.wallet_address ? `${c.users.wallet_address.substring(0, 8)}...${c.users.wallet_address.substring(34)}` : 'N/A'}
                  </code>
                </td>
                <td className="px-6 py-5 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <input 
                      type="number"
                      value={c.revenue_share}
                      disabled={c.status === 'Inactive'}
                      onChange={(e) => updateShare(c.id, e.target.value)}
                      className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-center font-mono font-bold text-indigo-400 text-sm focus:ring-1 focus:ring-indigo-500 outline-none disabled:opacity-30"
                    />
                    <span className="text-[10px] font-bold text-gray-600">%</span>
                  </div>
                </td>
                <td className="px-6 py-5 text-center">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide ${
                    c.status === 'Active' 
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-gray-500/15 text-gray-400 border border-gray-500/20'
                  }`}>
                    {c.status || 'Active'}
                  </span>
                </td>
                <td className="px-6 py-5 text-right flex items-center justify-end gap-3">
                   <button 
                    onClick={() => toggleStatus(c.id, c.status || 'Active')}
                    className={`text-xs font-bold transition-all px-3 py-1.5 rounded-lg ${
                      c.status === 'Active' ? 'text-gray-500 hover:text-rose-400 hover:bg-rose-500/5' : 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/5'
                    }`}
                  >
                    {c.status === 'Active' ? 'Remove' : 'Reactivate'}
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {hasChanges && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="p-6 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col sm:flex-row justify-between items-center gap-6"
          >
            <div className="flex items-center gap-6">
              <div>
                <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Total Allocation</p>
                <p className={`text-2xl font-black ${totalPercentage === 100 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {totalPercentage}%
                </p>
              </div>
              <div className="w-px h-10 bg-indigo-500/20" />
              <div className="text-gray-400 text-xs font-medium max-w-[280px]">
                {totalPercentage === 100 
                  ? "Perfect! The roster shares add up to 100%. Ready to commit to the protocol."
                  : `Roster shares must total exactly 100% to update the Split. (Remaining: ${100 - totalPercentage}%)`}
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setDraftRoster(contributors.map(c => ({ ...c })))}
                className="px-6 py-3 rounded-xl text-xs font-bold text-gray-500 hover:text-white transition-all uppercase tracking-widest"
              >
                Discard
              </button>
              <button 
                onClick={handleSave}
                disabled={totalPercentage !== 100 || txStatus === 'pending'}
                className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/30 disabled:opacity-30"
              >
                {txStatus === 'pending' ? 'Processing...' : 'Save to Blockchain'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
