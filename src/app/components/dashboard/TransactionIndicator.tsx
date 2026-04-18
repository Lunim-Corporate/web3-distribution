'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TransactionIndicatorProps {
  status: 'idle' | 'pending' | 'confirmed' | 'error';
  txHash?: string;
  type?: string;
}

export const TransactionIndicator: React.FC<TransactionIndicatorProps> = ({ status, txHash, type = 'Transaction' }) => {
  if (status === 'idle') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        className="fixed bottom-10 right-10 z-[200]"
      >
        <div className="bg-[#0B0C10]/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] flex items-center gap-5 min-w-[320px]">
          {/* Status Icon */}
          <div className="relative">
             <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-inner ${
               status === 'pending' ? 'bg-indigo-500/10 text-indigo-400' :
               status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400' :
               'bg-rose-500/10 text-rose-400'
             }`}>
               {status === 'pending' && <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>⏳</motion.span>}
               {status === 'confirmed' && <span>✅</span>}
               {status === 'error' && <span>❌</span>}
             </div>
             {status === 'pending' && (
               <motion.div 
                 initial={{ scale: 1, opacity: 0.5 }}
                 animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                 transition={{ repeat: Infinity, duration: 2 }}
                 className="absolute inset-0 bg-indigo-500/20 rounded-xl z-[-1]"
               />
             )}
          </div>

          <div className="flex-1">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">
              {status === 'pending' ? 'Processing' : status === 'confirmed' ? 'Success' : 'Failed'}
            </p>
            <h4 className="text-sm font-black text-white tracking-tight">{type}</h4>
            {txHash && (
              <a 
                href={`https://sepolia.etherscan.io/tx/${txHash}`} 
                target="_blank" 
                className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-1 transition-colors"
              >
                {txHash.substring(0, 10)}...{txHash.substring(txHash.length - 8)}
                <span>↗</span>
              </a>
            )}
          </div>

          {status === 'confirmed' && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-2 h-2 bg-emerald-500 rounded-full"
            />
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
