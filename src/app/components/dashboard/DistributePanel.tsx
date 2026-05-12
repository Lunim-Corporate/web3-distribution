'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { ETH_PRICE_USD, formatUSD as fmtUSD } from '@/app/lib/constants';
import { useAuth } from '@/app/lib/auth';
import { useRevenueSplitter } from '@/lib/web3';

interface Project { id: string; name: string; total_distributed: number; }
interface RightsHolder { id: string; full_name: string; role: string; wallet_address: string; percentage: number; }


export function DistributePanel({ project, holders }: { project: Project | null; holders: RightsHolder[] }) {
  const { user } = useAuth();
  const { distributeRevenue, smartAccountAddress, isInitializing } = useRevenueSplitter();
  const [amount, setAmount] = useState<string>('0.1');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  useEffect(() => {
    setIsDemoMode(localStorage.getItem('demo_mode') === 'true');
    const onDemoChanged = (e: any) => setIsDemoMode(e.detail);
    window.addEventListener('demo-mode-changed', onDemoChanged);
    return () => window.removeEventListener('demo-mode-changed', onDemoChanged);
  }, []);
  const [txHash, setTxHash] = useState('');
  
  const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_REVENUE_SPLITTER_ADDRESS || '';

  const handleDistribute = async () => {
    if (!project || holders.length === 0) return toast.error('No project or holders found');
    if (!user || !smartAccountAddress) return toast.error('Please login and wait for smart account initialization');
    const ethAmount = parseFloat(amount);
    if (isNaN(ethAmount) || ethAmount <= 0) return toast.error('Enter a valid amount');

    setIsProcessing(true);
    setTxHash('');

    try {
      const tid = toast.loading('Executing distribution on Hardhat...');

      let manualTxHash: string | null = null;

      if (CONTRACT_ADDRESS) {
        toast.loading('Sending on-chain transaction...', { id: tid });
        manualTxHash = await distributeRevenue(amount);
        toast.loading('Confirmed! Syncing to database...', { id: tid });
      }

      const res = await fetch('/api/web3/auto-distribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: project.id,
          amount_eth: ethAmount,
          manual_tx_hash: manualTxHash,
          sender_address: smartAccountAddress,
          holders: holders.map(h => ({
            rights_holder_id: h.id,
            wallet_address: h.wallet_address,
            full_name: h.full_name,
            role: h.role,
            percentage: h.percentage,
            amount_eth: (h.percentage / 100) * ethAmount,
          })),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to record transaction');
      }

      const data = await res.json();
      setTxHash(data.txHash);
      toast.success('Revenue distributed successfully!', { id: tid });
      window.dispatchEvent(new CustomEvent('payment-recorded', { detail: { projectId: project.id } }));

    } catch (e: any) {
      toast.error(e.message || 'Distribution failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="bg-white/5 border border-white/10 rounded-[40px] p-10 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-[100px]" />
        
        <div className="relative z-10 space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight">Revenue Distribution Hub</h2>
              <p className="text-gray-400 mt-2 font-medium">
                {isDemoMode 
                  ? "Showcase how smart contracts automate revenue splits in real-time."
                  : "Distribute project revenue seamlessly and transparently across the blockchain."}
              </p>
            </div>
            
            
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-6">
              <div className="p-8 bg-white/5 rounded-[32px] border border-white/10 space-y-6">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Amount to Distribute (ETH)</label>
                <div className="relative">
                  <input 
                    type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)}
                    className="w-full bg-transparent border-none text-6xl font-black text-white outline-none font-mono"
                    placeholder="0.00"
                  />
                  <div className="absolute right-0 bottom-2 text-indigo-400 font-black text-2xl">Ξ</div>
                </div>
                <div className="flex justify-between items-center pt-6 border-t border-white/5">
                  <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Est. USD Value</span>
                  <span className="text-xl font-black text-emerald-400">{fmtUSD(parseFloat(amount || '0') * ETH_PRICE_USD)}</span>
                </div>
              </div>

              

              <button 
                onClick={handleDistribute}
                disabled={isProcessing}
                className="w-full py-6 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 bg-[length:200%_auto] hover:bg-right text-white font-black rounded-[32px] transition-all shadow-[0_0_30px_rgba(99,102,241,0.3)] disabled:opacity-50 uppercase tracking-[0.3em] text-sm animate-gradient"
              >
                {isProcessing ? 'Executing Contract...' : 'Initiate Distribution'}
              </button>

              {txHash && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                  <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Success: Transaction Confirmed</p>
                  <p className="text-[10px] font-mono text-emerald-400 break-all">{txHash}</p>
                </motion.div>
              )}
            </div>

            <div className="bg-black/40 rounded-[40px] p-8 border border-white/5 space-y-6 flex flex-col h-full">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recipient Allocation</h3>
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{holders.length} Payees</span>
              </div>
              
              <div className="space-y-5 flex-1 overflow-y-auto pr-2 scrollbar-thin max-h-[350px]">
                {holders.map((h, i) => (
                  <div key={h.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xs font-black text-gray-400 group-hover:bg-indigo-500/10 group-hover:text-indigo-400 transition-colors border border-white/5">
                        {h.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-white">{h.full_name}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mt-0.5">{h.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-white font-mono">{h.percentage}%</p>
                      <p className="text-[10px] text-indigo-400 font-mono font-black">{( (h.percentage/100) * parseFloat(amount || '0') ).toFixed(4)} Ξ</p>
                    </div>
                  </div>
                ))}
                {holders.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4 opacity-20">👥</div>
                    <p className="text-xs text-gray-600 font-black uppercase tracking-widest">No holders assigned in Admin</p>
                  </div>
                )}
              </div>
              
              <div className="pt-6 border-t border-white/5 space-y-3">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-gray-500">
                  <span>Smart Contract Protocol</span>
                  <span className="text-emerald-400">Verifiable On-Chain</span>
                </div>
                <div className="px-4 py-3 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 font-mono text-[10px] text-indigo-300 truncate">
                  {CONTRACT_ADDRESS}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Simulation Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Blockchain Network', value: isDemoMode ? 'Hardhat (Demo)' : 'Ethereum Mainnet', icon: '⛓️', color: 'indigo' },
          { label: 'Distribution Logic', value: 'Immutable Splitter', icon: '📝', color: 'emerald' },
          { label: 'Transaction Status', value: isProcessing ? 'Syncing...' : (txHash ? 'Confirmed' : 'Standby'), icon: '⚡', color: 'purple' },
        ].map(item => (
          <div key={item.label} className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl flex items-center gap-5">
            <div className="text-3xl">{item.icon}</div>
            <div>
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{item.label}</p>
              <p className={`text-xs font-black text-white mt-0.5`}>{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
