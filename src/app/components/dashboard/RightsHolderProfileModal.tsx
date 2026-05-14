'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, TrendingUp, History, Briefcase, Music } from 'lucide-react';

interface RightsHolderProfileModalProps {
  holder: any;
  isOpen: boolean;
  onClose: () => void;
}

export const RightsHolderProfileModal: React.FC<RightsHolderProfileModalProps> = ({ holder, isOpen, onClose }) => {
  if (!holder) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8">
          {/* Complete Blur Background - Aggressive for Premium Feel */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-[60px]"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-2xl bg-gray-900/40 border border-white/10 rounded-[3.5rem] shadow-[0_0_150px_rgba(0,0,0,0.7)] flex flex-col h-[750px] max-h-[90vh] overflow-hidden backdrop-blur-3xl"
          >
            {/* PERSISTENT IDENTITY SECTION (IMAGE ALWAYS VISIBLE) */}
            <div className="relative shrink-0 pt-14 pb-10 flex flex-col items-center bg-gradient-to-b from-white/5 to-transparent">
              {/* Top Accent */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full -z-10" />
              
              {/* Close Button */}
              <button 
                onClick={onClose}
                className="absolute top-8 right-8 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all active:scale-95 z-30"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>

              {/* Profile Image (Persistent) */}
              <div className="relative group mb-6">
                <div className="absolute -inset-1 bg-gradient-to-tr from-[#FF3BFF] via-[#ECBF4D] to-[#5AC8FA] rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative w-32 h-32 rounded-[2.2rem] bg-[#0B0C10] p-1.5 border border-white/10">
                  <div className="w-full h-full rounded-[1.8rem] overflow-hidden bg-gradient-to-br from-white/10 to-transparent">
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${holder.name}`}
                      alt={holder.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              <div className="text-center px-8 w-full z-20">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-indigo-500/20 border border-indigo-500/30 rounded text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                    {holder.role || 'Contributor'}
                  </span>
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                    <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                    Verified
                  </div>
                </div>
                <h2 className="text-4xl font-black tracking-tighter text-white mb-2">{holder.name}</h2>
                <div className="flex items-center justify-center gap-2 text-white/30 hover:text-white/60 transition-colors cursor-pointer group">
                  <p className="text-xs font-mono tracking-tight">{holder.wallet_address || 'No wallet linked'}</p>
                  <Copy className="w-3 h-3" />
                </div>
              </div>
            </div>

            {/* INTERNAL SCROLLABLE CONTENT (Metrics & History) */}
            <div className="flex-1 overflow-y-auto px-10 pb-12 custom-scrollbar space-y-12">
              <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8" />

              {/* Core Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/5 border border-white/5 rounded-3xl p-5 text-center">
                   <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Earned</p>
                   <p className="text-xl font-black text-emerald-400 font-mono">${(holder.total_received || 0).toLocaleString()}</p>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-3xl p-5 text-center">
                   <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Allocation</p>
                   <p className="text-xl font-black text-white font-mono">{holder.percentage}%</p>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-3xl p-5 text-center">
                   <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Impact</p>
                   <p className="text-xl font-black text-indigo-400 font-mono">{holder.global_share?.toFixed(1) || '0.0'}%</p>
                </div>
              </div>

              {/* Project Context */}
              <div>
                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                  <Briefcase className="w-3 h-3 text-purple-500" />
                  Associated Project
                </h4>
                <div className="flex items-center gap-5 bg-white/5 border border-white/5 p-6 rounded-[2rem]">
                   <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                      <Music className="w-6 h-6 text-white" />
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="text-base font-black text-white truncate">{holder.projectName || 'Active Project'}</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Revenue Stream Live</p>
                   </div>
                </div>
              </div>

              {/* Distribution History */}
              <div>
                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                  <History className="w-3 h-3 text-blue-500" />
                  Recent Payouts
                </h4>
                <div className="space-y-3">
                  {(holder.distributions || []).length > 0 ? (
                    holder.distributions.map((tx: any, idx: number) => (
                      <div key={idx} className="bg-white/5 p-5 rounded-2xl border border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                              <History className="w-4 h-4 text-gray-500" />
                           </div>
                           <div>
                              <p className="text-sm font-bold text-white">{tx.source || 'Payment'}</p>
                              <p className="text-[10px] text-gray-500 font-mono mt-0.5">{tx.id?.slice(0, 10)}...</p>
                           </div>
                        </div>
                        <div className="text-right">
                          <p className="text-emerald-400 font-black text-base">+${Number(tx.amount || 0).toFixed(2)}</p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">{new Date(tx.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 bg-white/[0.02] rounded-[2rem] border border-white/5 border-dashed">
                      <p className="text-gray-600 text-sm font-bold uppercase tracking-widest">No history recorded</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Action */}
            <div className="p-8 pt-4 shrink-0 bg-gradient-to-t from-[#0B0C10] to-transparent z-20">
               <button 
                 onClick={onClose}
                 className="w-full py-5 bg-white/5 border border-white/10 rounded-3xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all"
               >
                 Close Profile
               </button>
            </div>
          </motion.div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 0px;
        }
      `}</style>
    </AnimatePresence>
  );
};
