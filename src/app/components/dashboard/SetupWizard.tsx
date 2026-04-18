'use client';

import React from 'react';
import { motion } from 'framer-motion';

const STEPS = [
  { id: 1, title: 'Connect Your Wallet', description: 'Link your MetaMask to interact with the 0xSplits protocol.', icon: '🔌' },
  { id: 2, title: 'Import or Create Project', description: 'Configure the project metadata in the roster.', icon: '📁' },
  { id: 3, title: 'Add Your First Creator', description: 'Define the split percentages for your roster.', icon: '👥' },
];

export const SetupWizard = () => {
  return (
    <div className="max-w-4xl mx-auto py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-black text-white mb-4 tracking-tight">Welcome, Admin</h1>
        <p className="text-gray-400 text-lg">Let's get your project revenue streams set up in 0xSplits.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {STEPS.map((step, idx) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl relative overflow-hidden group hover:border-indigo-500/50 transition-colors"
          >
            <div className="absolute top-4 right-6 text-4xl font-black text-white/5 group-hover:text-indigo-500/10 transition-colors">
              0{step.id}
            </div>
            <div className="text-4xl mb-6">{step.icon}</div>
            <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{step.description}</p>
            
            <div className="mt-8">
              <button className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-widest transition-all">
                Complete Step
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-16 p-8 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 text-center"
      >
        <p className="text-indigo-300 font-medium italic">"Trustless revenue distribution starts with a single split."</p>
      </motion.div>
    </div>
  );
};
