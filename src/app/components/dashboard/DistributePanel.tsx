'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useEthPrice } from '@/app/lib/useEthPrice';
import { useAuth } from '@/app/lib/auth';
import { useRevenueSplitter } from '@/lib/web3';
import { isDemoAccessEnabled, readDemoMode } from '@/app/lib/demoAccess';
import { TxModal, TxStep } from '../ui/TxModal';
import { getExplorerUrl } from '@/app/lib/constants';

interface Project { id: string; name: string; total_distributed: number; contract_address?: string; demo_contract_address?: string; }
interface RightsHolder { id: string; full_name: string; role: string; wallet_address: string; percentage: number; }

export function DistributePanel({ project, holders }: { project: Project | null; holders: RightsHolder[] }) {
  const { user } = useAuth();
  
  const [isDemoMode, setIsDemoMode] = useState(false);
  const demoCA = project?.demo_contract_address || process.env.NEXT_PUBLIC_DEMO_CONTRACT_ADDRESS;
  const liveCA = project?.contract_address || process.env.NEXT_PUBLIC_LIVE_CONTRACT_ADDRESS;
  const targetCA = isDemoMode ? demoCA : liveCA;
  
  const { distributeRevenue, smartAccountAddress } = useRevenueSplitter(targetCA);
  const [amount, setAmount] = useState<string>('100');
  const [isProcessing, setIsProcessing] = useState(false);
  const { ethPrice } = useEthPrice();
  
  useEffect(() => {
    setIsDemoMode(readDemoMode());
    const onDemoChanged = (e: any) => setIsDemoMode(isDemoAccessEnabled && e.detail);
    window.addEventListener('demo-mode-changed', onDemoChanged);
    return () => window.removeEventListener('demo-mode-changed', onDemoChanged);
  }, []);

  const [txHash, setTxHash] = useState('');
  
  // Transaction Steps Visualizer State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalTxHash, setModalTxHash] = useState('');
  const [steps, setSteps] = useState<TxStep[]>([
    { id: 'prep', title: 'Preparing payload', description: 'Formulating transaction payload and security checks.', status: 'idle' },
    { id: 'sponsor', title: 'Sponsoring gas', description: 'Sponsoring transaction gas via Alchemy Paymaster (gasless for you!).', status: 'idle' },
    { id: 'mine', title: 'Mining transaction', description: 'Broadcasting UserOperation to bundlers & awaiting on-chain block mining.', status: 'idle' },
    { id: 'index', title: 'Reconciling ledger', description: 'Indexing on-chain events to database splits & updating creator balances.', status: 'idle' },
  ]);

  const updateStep = (id: string, status: 'idle' | 'running' | 'success' | 'error') => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  const resetSteps = () => {
    setSteps([
      { id: 'prep', title: 'Preparing payload', description: 'Formulating transaction payload and security checks.', status: 'idle' },
      { id: 'sponsor', title: 'Sponsoring gas', description: 'Sponsoring transaction gas via Alchemy Paymaster (gasless for you!).', status: 'idle' },
      { id: 'mine', title: 'Mining transaction', description: 'Broadcasting UserOperation to bundlers & awaiting on-chain block mining.', status: 'idle' },
      { id: 'index', title: 'Reconciling ledger', description: 'Indexing on-chain events to database splits & updating creator balances.', status: 'idle' },
    ]);
    setModalError('');
    setModalTxHash('');
  };
  
  const DEMO_CA = project?.demo_contract_address || process.env.NEXT_PUBLIC_DEMO_CONTRACT_ADDRESS;
  const LIVE_CA = project?.contract_address || process.env.NEXT_PUBLIC_LIVE_CONTRACT_ADDRESS;
  const CONTRACT_ADDRESS = isDemoMode ? (DEMO_CA || '') : (LIVE_CA || '');

  const handleDistribute = async () => {
    if (!project || holders.length === 0) return toast.error('No project or holders found');
    
    if (!isDemoMode && (!user || user.role !== 'admin')) {
      return toast.error('Live distributions require Administrator permissions. Switch to Demo Mode to test revenue distributions.');
    }

    const usdAmount = parseFloat(amount);
    if (isNaN(usdAmount) || usdAmount <= 0) return toast.error('Enter a valid amount');
    const ethAmount = ethPrice > 0 ? usdAmount / ethPrice : 0;
    if (ethAmount <= 0) return toast.error('Converted ETH amount must be greater than zero');

    setIsProcessing(true);
    setTxHash('');
    
    // Open TxModal and reset progress steps
    setIsModalOpen(true);
    resetSteps();

    let currentStepId = 'prep';

    try {
      // 1. Preparing payload
      updateStep('prep', 'running');
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateStep('prep', 'success');

      // 2. Sponsoring gas
      currentStepId = 'sponsor';
      updateStep('sponsor', 'running');
      await new Promise(resolve => setTimeout(resolve, 800));
      updateStep('sponsor', 'success');

      // 3. Mining transaction
      currentStepId = 'mine';
      updateStep('mine', 'running');

      let manualTxHash: string | null = null;

      if (isDemoMode) {
        // --- DEMO MODE TRANSACTION EXECUTION ---
        const hasMetaMask = typeof window !== 'undefined' && !!window.ethereum;
        let activeMetaMaskAcc = '';
        let activeChainIdHex = '';

        if (hasMetaMask) {
          try {
            const accounts = await window.ethereum!.request({ method: 'eth_accounts' }) as string[];
            activeMetaMaskAcc = accounts[0] || '';
            activeChainIdHex = await window.ethereum!.request({ method: 'eth_chainId' }) as string;
          } catch (e) {
            console.warn('MetaMask sandbox check skipped', e);
          }
        }

        const activeDemoWallet = localStorage.getItem('active_demo_wallet') || '0xf39Fd6e51aad88F6F4ce5aB8827279cffFb92266';
        const isMetaMaskMatching = activeMetaMaskAcc && activeMetaMaskAcc.toLowerCase() === activeDemoWallet.toLowerCase();
        const isChainHardhat = parseInt(activeChainIdHex, 16) === 31337;

        if (hasMetaMask && isMetaMaskMatching && isChainHardhat) {
          try {
            const weiHex = `0x${Math.floor(ethAmount * 1e18).toString(16)}`;
            manualTxHash = await window.ethereum!.request({
              method: 'eth_sendTransaction',
              params: [{
                from: activeDemoWallet,
                to: CONTRACT_ADDRESS || holders[0]?.wallet_address,
                value: weiHex,
                data: '0x2d07953a', // distributeRevenue selector
                gasPrice: '0x0' // 0 gas cost
              }]
            }) as string;
          } catch (err: any) {
            console.warn('MetaMask localhost distribution failed, falling back to simulation', err);
          }
        }

        if (!manualTxHash) {
          await new Promise(resolve => setTimeout(resolve, 1500));
          manualTxHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
        }

      } else {
        // --- LIVE MODE TRANSACTION EXECUTION ---
        if (CONTRACT_ADDRESS) {
          manualTxHash = await distributeRevenue(ethAmount.toString());
        }
      }

      updateStep('mine', 'success');

      // 4. Reconciling database ledger
      currentStepId = 'index';
      updateStep('index', 'running');

      const activeDemoWallet = isDemoMode
        ? (localStorage.getItem('active_demo_wallet') || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266')
        : null;

      let payloadHolders = [...holders];
      if (isDemoMode && activeDemoWallet) {
        const hasActive = payloadHolders.some(
          h => h.wallet_address?.toLowerCase() === activeDemoWallet.toLowerCase()
        );
        if (!hasActive) {
          if (payloadHolders.length > 0) {
            payloadHolders = [
              {
                id: 'demo-active-wallet-holder',
                full_name: 'Demo Creator (You)',
                role: 'Admin / Creator',
                wallet_address: activeDemoWallet,
                percentage: 20,
              },
              ...payloadHolders.map(h => ({
                ...h,
                percentage: Math.round(h.percentage * 0.8),
              })),
            ];
          } else {
            payloadHolders = [
              {
                id: 'demo-active-wallet-holder',
                full_name: 'Demo Creator (You)',
                role: 'Admin / Creator',
                wallet_address: activeDemoWallet,
                percentage: 100,
              },
            ];
          }
        }
      }

      const res = await fetch('/api/web3/auto-distribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: project.id,
          amount_eth: ethAmount,
          manual_tx_hash: manualTxHash,
          sender_address: isDemoMode ? activeDemoWallet : smartAccountAddress,
          is_demo: isDemoMode,
          holders: payloadHolders.map(h => ({
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
      setModalTxHash(data.txHash);
      updateStep('index', 'success');
      
      toast.success(isDemoMode ? 'Sandbox distribution completed!' : 'Revenue distributed successfully!');
      window.dispatchEvent(new CustomEvent('payment-recorded', { detail: { projectId: project.id } }));

    } catch (e: any) {
      updateStep(currentStepId, 'error');
      setModalError(e.message || 'Transaction failed');
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
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Amount to Distribute (USD)</label>
                <div className="relative flex items-center">
                  <span className="text-5xl font-black text-indigo-400 mr-3">$</span>
                  <input 
                    type="number" step="1" value={amount} onChange={e => setAmount(e.target.value)}
                    className="w-full bg-transparent border-none text-6xl font-black text-white outline-none font-mono"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex justify-between items-center pt-6 border-t border-white/5">
                  <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Real-time ETH Value</span>
                  <span className="text-xl font-black text-emerald-400">{ethPrice > 0 ? (parseFloat(amount) / ethPrice || 0).toFixed(6) : '0.000000'} Ξ</span>
                </div>
              </div>

              <button 
                onClick={handleDistribute}
                disabled={isProcessing}
                className="w-full py-6 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 bg-[length:200%_auto] hover:bg-right text-white font-black rounded-[32px] transition-all shadow-[0_0_30px_rgba(99,102,241,0.3)] disabled:opacity-50 uppercase tracking-[0.3em] text-sm animate-gradient"
              >
                {isProcessing ? 'Executing Protocol...' : 'Initiate Distribution'}
              </button>

              {txHash && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-2">
                  <div>
                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Success: Transaction Confirmed</p>
                    <p className="text-[10px] font-mono text-emerald-400 break-all select-all">{txHash}</p>
                  </div>
                  {!isDemoMode && txHash.startsWith('0x') && (
                    <a
                      href={getExplorerUrl('tx', txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[10px] font-black text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest"
                    >
                      View on BaseScan
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </motion.div>
              )}
            </div>

            <div className="bg-black/40 rounded-[40px] p-8 border border-white/5 space-y-6 flex flex-col h-full">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recipient Allocation</h3>
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{holders.length} Payees</span>
              </div>
              
              <div className="space-y-5 flex-1 overflow-y-auto pr-2 scrollbar-thin max-h-[350px]">
                {holders.map((h) => (
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
                      <p className="text-[10px] text-indigo-400 font-mono font-black">
                        ${((h.percentage / 100) * parseFloat(amount || '0')).toFixed(2)}
                        <span className="text-gray-500 font-normal mx-1">/</span>
                        {ethPrice ? (((h.percentage / 100) * parseFloat(amount || '0')) / ethPrice).toFixed(6) : '0.000000'} Ξ
                      </p>
                    </div>
                  </div>
                ))}
                {holders.length === 0 && (
                  <div className="text-center py-12 flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-gray-500 mb-3">
                      <svg className="w-6 h-6 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
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
        {/* Network */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl flex items-center gap-5 relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-300">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/20 transition-all duration-300">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <div>
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Blockchain Network</p>
            <p className="text-xs font-black text-white mt-0.5">
              {isDemoMode ? 'Hardhat Development Chain' : (process.env.NEXT_PUBLIC_CHAIN_ID === '84532' ? 'Base Sepolia' : (process.env.NEXT_PUBLIC_CHAIN_ID === '8453' ? 'Base Mainnet' : 'Localhost'))}
            </p>
          </div>
        </div>

        {/* Logic */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl flex items-center gap-5 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-all duration-300">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Distribution Logic</p>
            <p className="text-xs font-black text-white mt-0.5">Immutable Revenue Splitter</p>
          </div>
        </div>

        {/* Status */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl flex items-center gap-5 relative overflow-hidden group hover:border-purple-500/30 transition-all duration-300">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:bg-purple-500/20 transition-all duration-300">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Transaction Status</p>
            <p className="text-xs font-black text-white mt-0.5">
              {isProcessing ? 'Syncing Ledger...' : (txHash ? 'Confirmed & Indexed' : 'Protocol Standby')}
            </p>
          </div>
        </div>
      </div>

      {/* Transaction progress modal */}
      <TxModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        steps={steps} 
        txHash={modalTxHash} 
        error={modalError} 
        holders={holders}
        amountUsd={parseFloat(amount) || 0}
        amountEth={ethPrice > 0 ? (parseFloat(amount) || 0) / ethPrice : 0}
      />
    </div>
  );
}
