'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'react-hot-toast';

interface AddMemberModalProps {
  projectId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({ projectId, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [wallet, setWallet] = useState('');
  const [role, setRole] = useState('');
  const [share, setShare] = useState('10');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;

    if (!wallet.startsWith('0x') || wallet.length !== 42) {
      toast.error('Invalid Ethereum wallet address format');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Ensure user exists (Upsert logic or check)
      // For this implementation, we'll try to find user by wallet or create a shell user
      let { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', wallet)
        .single();
      
      let userId;
      if (existingUser) {
        userId = existingUser.id;
      } else {
        const { data: newUser, error: uErr } = await supabase
          .from('users')
          .insert({ name, wallet_address: wallet, role: 'creator' })
          .select('id')
          .single();
        if (uErr) throw uErr;
        userId = newUser.id;
      }

      // 2. Add to project_contributors
      const { error: cErr } = await supabase
        .from('project_contributors')
        .insert({
          project_id: projectId,
          user_id: userId,
          role: role,
          revenue_share: parseInt(share),
          status: 'Active'
        });
      
      if (cErr) throw cErr;

      toast.success('Member added successfully!');
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add member');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-lg bg-[#0B0C10] border border-white/10 rounded-3xl p-8 relative z-10 shadow-3xl"
      >
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Add New Member</h2>
            <p className="text-gray-500 text-sm mt-1">Onboard a new creator to this project roster.</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Display Name</label>
              <input 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Andrej Karpathy"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Wallet Address (0x...)</label>
              <input 
                required
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
                placeholder="0x..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Role</label>
                <input 
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Lead Engineer"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Initial Share (%)</label>
                <input 
                  type="number"
                  min="0"
                  max="100"
                  value={share}
                  onChange={(e) => setShare(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-3 font-bold text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button 
              disabled={isSubmitting}
              className="flex-3 px-10 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
            >
              {isSubmitting ? 'Processing...' : 'Add to Roster'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
