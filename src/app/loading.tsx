'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col items-center justify-center p-6 font-sans">
      <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[70%] h-[70%] bg-purple-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Diamond Logo Spin/Pulse */}
        <div className="relative mb-8">
          <motion.div 
            animate={{ scale: [1, 1.1, 1], rotate: [0, 180, 360] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-xl shadow-blue-500/30"
          >
            <span className="text-2xl text-white">💎</span>
          </motion.div>
          <div className="absolute inset-0 w-16 h-16 rounded-2xl border border-white/20 animate-ping opacity-75" />
        </div>

        {/* Loading Indicator Text */}
        <h3 className="text-lg font-bold text-white tracking-wide">Syncing Decent Registry</h3>
        <p className="text-xs text-slate-400 mt-2 font-mono uppercase tracking-[0.2em] animate-pulse">
          Fetching on-chain distribution events...
        </p>

        {/* Loading bar */}
        <div className="w-48 bg-slate-900/60 border border-slate-800/80 rounded-full h-1.5 overflow-hidden mt-6">
          <motion.div 
            initial={{ left: '-100%' }}
            animate={{ left: '100%' }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="relative bg-gradient-to-r from-blue-500 to-cyan-500 h-1.5 w-1/2 rounded-full"
          />
        </div>
      </div>
    </div>
  );
}
