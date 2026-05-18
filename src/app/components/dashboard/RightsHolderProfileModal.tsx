'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, History, Briefcase, Music } from 'lucide-react';

type HolderDistribution = {
  id?: string;
  source?: string;
  amount?: number;
  date: string;
};

type RightsHolderProfile = {
  name: string;
  role?: string;
  wallet_address?: string;
  total_received?: number;
  percentage?: number;
  global_share?: number;
  projectName?: string;
  distributions?: HolderDistribution[];
};

interface RightsHolderProfileModalProps {
  holder: RightsHolderProfile | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RightsHolderProfileModal: React.FC<RightsHolderProfileModalProps> = ({ holder, isOpen, onClose }) => {
  if (!holder || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000]">
          {/* Complete Blur Background - Aggressive for Premium Feel */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/72 backdrop-blur-[22px]"
          />

          <div className="absolute inset-[2cm] flex items-center justify-center">
          
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 26, stiffness: 260 }}
              className="relative z-10 h-fit max-h-[calc(100vh-4cm)] w-full max-w-[min(680px,calc(100vw-4cm))] overflow-hidden rounded-[2rem] border border-white/12 bg-[#171c29]/96 shadow-[0_30px_120px_rgba(0,0,0,0.6)] backdrop-blur-3xl"
            >
            {/* PERSISTENT IDENTITY SECTION (IMAGE ALWAYS VISIBLE) */}
            <div className="relative flex flex-col items-center bg-gradient-to-b from-white/5 to-transparent px-5 pb-5 pt-8 sm:px-8 sm:pb-6 sm:pt-10">
              {/* Top Accent */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full -z-10" />
              
              {/* Close Button */}
              <button 
                onClick={onClose}
                className="absolute right-4 top-4 z-30 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-all hover:bg-white/10 active:scale-95 sm:right-6 sm:top-6 sm:h-10 sm:w-10"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>

              {/* Profile Image (Persistent) */}
              <div className="relative group mb-3 sm:mb-4">
                <div className="absolute -inset-1 bg-gradient-to-tr from-[#FF3BFF] via-[#ECBF4D] to-[#5AC8FA] rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative h-20 w-20 rounded-[1.5rem] border border-white/10 bg-[#0B0C10] p-1.5 sm:h-24 sm:w-24 sm:rounded-[1.8rem]">
                  <div className="w-full h-full rounded-[1.8rem] overflow-hidden bg-gradient-to-br from-white/10 to-transparent">
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${holder.name}`}
                      alt={holder.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              <div className="z-20 w-full px-3 text-center sm:px-8">
                <div className="mb-2 flex flex-wrap items-center justify-center gap-2">
                  <span className="px-2 py-0.5 bg-indigo-500/20 border border-indigo-500/30 rounded text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                    {holder.role || 'Contributor'}
                  </span>
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                    <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                    Verified
                  </div>
                </div>
                <h2 className="mb-2 text-xl font-black tracking-tight text-white sm:text-2xl">{holder.name}</h2>
                <div className="group flex items-center justify-center gap-2 text-white/30 transition-colors hover:text-white/60">
                  <p className="max-w-full truncate text-[11px] font-mono tracking-tight sm:text-xs">{holder.wallet_address || 'No wallet linked'}</p>
                  <Copy className="w-3 h-3" />
                </div>
              </div>
            </div>

            <div className="space-y-4 px-5 pb-5 sm:space-y-5 sm:px-8 sm:pb-6">
              <div className="mb-3 h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent sm:mb-4" />

              {/* Core Stats */}
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3">
                <div className="rounded-2xl border border-white/5 bg-white/5 p-4 text-center">
                   <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Earned</p>
                   <p className="font-mono text-base font-black text-emerald-400 sm:text-lg">${(holder.total_received || 0).toLocaleString()}</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/5 p-4 text-center">
                   <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Allocation</p>
                   <p className="font-mono text-base font-black text-white sm:text-lg">{holder.percentage}%</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/5 p-4 text-center">
                   <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Impact</p>
                   <p className="font-mono text-base font-black text-indigo-400 sm:text-lg">{holder.global_share?.toFixed(1) || '0.0'}%</p>
                </div>
              </div>

              {/* Project Context */}
              <div>
                <h4 className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 sm:mb-4">
                  <Briefcase className="w-3 h-3 text-purple-500" />
                  Associated Project
                </h4>
                <div className="flex items-center gap-3 rounded-[1.5rem] border border-white/5 bg-white/5 p-4 sm:gap-4">
                   <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg sm:h-14 sm:w-14">
                      <Music className="h-5 w-5 text-white sm:h-6 sm:w-6" />
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-black text-white">{holder.projectName || 'Active Project'}</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Revenue Stream Live</p>
                   </div>
                </div>
              </div>

              {/* Distribution History */}
              <div>
                <h4 className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 sm:mb-4">
                  <History className="w-3 h-3 text-blue-500" />
                  Recent Payouts
                </h4>
                <div className="space-y-3">
                  {(holder.distributions || []).length > 0 ? (
                    holder.distributions.slice(0, 1).map((tx, idx: number) => (
                      <div key={idx} className="flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-white/5 p-4">
                        <div className="flex items-center gap-3 min-w-0">
                           <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5">
                              <History className="w-4 h-4 text-gray-500" />
                           </div>
                           <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-white">{tx.source || 'Payment'}</p>
                              <p className="mt-0.5 truncate text-[10px] font-mono text-gray-500">{tx.id?.slice(0, 10)}...</p>
                           </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-black text-emerald-400">+${Number(tx.amount || 0).toFixed(2)}</p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">{new Date(tx.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[1.5rem] border border-dashed border-white/5 bg-white/[0.02] py-6 text-center sm:py-8">
                      <p className="text-gray-600 text-sm font-bold uppercase tracking-widest">No history recorded</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Action */}
            <div className="bg-gradient-to-t from-[#171c29] to-transparent px-5 pb-5 pt-1 sm:px-8 sm:pb-6">
               <button 
                 onClick={onClose}
                 className="w-full rounded-2xl border border-white/10 bg-white/5 py-3.5 text-xs font-black uppercase tracking-widest transition-all hover:bg-white/10"
               >
                 Close Profile
               </button>
            </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
    ,
    document.body
  );
};
