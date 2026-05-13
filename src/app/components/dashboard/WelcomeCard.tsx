'use client';

import React from 'react';
import { motion } from 'framer-motion';

export const WelcomeCard = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-indigo-600 to-purple-700 p-10 rounded-[2rem] shadow-2xl relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-12 text-9xl opacity-10 pointer-events-none">✨</div>
      <div className="relative z-10 max-w-2xl">
        <h2 className="text-4xl font-black text-white mb-6 tracking-tight leading-tight">
          Welcome to the Future of Creative Rights
        </h2>
        <p className="text-indigo-100 text-lg mb-8 leading-relaxed opacity-90">
          Your project uses the 0xSplits protocol to ensure transparent, on-chain revenue distribution. 
          As values are generated, they flow directly to your wallet based on the agreed split percentages.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">How it works</p>
            <p className="text-sm text-white font-medium">Revenue is collected in a central Split contract and can be distributed with a single transaction.</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">Your Earnings</p>
            <p className="text-sm text-white font-medium">Once distributed, your share moves from the Split contract to your individual earnings balance.</p>
          </div>
        </div>

        <button className="mt-10 px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-gray-100 transition-all shadow-xl">
          View Your Analytics
        </button>
      </div>
    </motion.div>
  );
};
