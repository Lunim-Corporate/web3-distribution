'use client';
import React, { useState } from 'react';

const formatUSD = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(amount || 0));

import { RightsHolderProfileModal } from './RightsHolderProfileModal';

export const RightsHolderRow = ({ holder, transactions }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div 
        className="bg-white/5 rounded-2xl border border-white/5 p-5 cursor-pointer hover:bg-white/10 hover:border-white/10 transition-all duration-300 group shadow-lg"
        onClick={() => setShowModal(true)}
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-lg font-black text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)] group-hover:scale-105 transition-transform">
            {holder.name?.charAt(0)}
          </div>
          <div className="flex flex-col flex-1 overflow-hidden">
            <span className="text-base font-black text-white truncate">{holder.name}</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest bg-black/20 px-2 py-0.5 rounded-md">
                {holder.role}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div>
            <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-1">Allocation</p>
            <span className="font-mono text-indigo-400 font-black text-lg">{holder.percentage}%</span>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-1">Total Payout</p>
            <span className="text-sm font-black text-emerald-400">{formatUSD(holder.total_received)}</span>
          </div>
        </div>
      </div>

      <RightsHolderProfileModal 
        holder={holder} 
        isOpen={showModal}
        onClose={() => setShowModal(false)} 
      />
    </>
  );
};
