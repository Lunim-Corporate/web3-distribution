'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getExplorerUrl } from '@/app/lib/constants';

export interface TxStep {
  id: string;
  title: string;
  description: string;
  status: 'idle' | 'running' | 'success' | 'error';
}

export interface RightsHolder {
  id: string;
  full_name: string;
  role: string;
  wallet_address: string;
  percentage: number;
}

interface TxModalProps {
  isOpen: boolean;
  onClose?: () => void;
  steps: TxStep[];
  txHash?: string;
  error?: string;
  holders?: RightsHolder[];
  amountUsd?: number;
  amountEth?: number;
}

export function TxModal({ isOpen, onClose, steps, txHash, error, holders, amountUsd, amountEth }: TxModalProps) {
  const [showDetails, setShowDetails] = React.useState(false);
  const [activeSubStage, setActiveSubStage] = React.useState(0);

  React.useEffect(() => {
    if (isOpen) {
      setShowDetails(false);
    }
  }, [isOpen, error]);

  React.useEffect(() => {
    const indexStep = steps.find(s => s.id === 'index');
    const totalHolders = holders ? holders.length : 4;
    if (indexStep?.status === 'running') {
      setActiveSubStage(0);
      const interval = setInterval(() => {
        setActiveSubStage(prev => {
          if (prev < totalHolders - 1) return prev + 1;
          clearInterval(interval);
          return prev;
        });
      }, 700);
      return () => clearInterval(interval);
    } else if (indexStep?.status === 'success') {
      setActiveSubStage(totalHolders);
    } else {
      setActiveSubStage(0);
    }
  }, [steps, holders]);

  if (!isOpen) return null;

  const getCleanErrorMessage = (err: string) => {
    if (!err) return '';
    const errLower = err.toLowerCase();
    
    if (errLower.includes('user rejected') || errLower.includes('user denied')) {
      return 'Transaction request was rejected in your Web3 wallet.';
    }
    if (errLower.includes('insufficient funds') || errLower.includes('exceeds balance')) {
      return 'Insufficient wallet balance to cover the distribution amount.';
    }
    if (errLower.includes('execution reverted') || errLower.includes('revert')) {
      if (errLower.includes('0x22545d27ee67972d5c7506fd035e2c50070d0c0f') || errLower.includes('verificationgaslimit') || errLower.includes('paymaster')) {
        return 'Execution reverted: Your Safe Smart Account has 0 ETH balance. Please fund your Smart Account (0x22545D27Ee67972d5C7506fd035e2c50070d0c0f) with Base Sepolia test ETH to execute the distribution.';
      }
      return 'On-chain smart contract execution reverted. Please verify allocations and balances.';
    }
    
    // Extract first sentence or line
    const firstLine = err.split('\n')[0];
    if (firstLine.length > 150) {
      return firstLine.substring(0, 150) + '...';
    }
    return firstLine;
  };

  const cleanError = getCleanErrorMessage(error || '');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
          onClick={error || txHash ? onClose : undefined}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative z-10 w-full max-w-xl bg-gradient-to-b from-white/10 to-white/5 border border-white/15 rounded-[36px] p-8 md:p-10 shadow-2xl backdrop-blur-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Subtle Glows */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-[80px]" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-[80px]" />

          <div className="relative z-10 space-y-8 overflow-y-auto flex-1 pr-2 custom-scrollbar">
            {/* Header */}
            <div className="text-center space-y-2">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.25em]">Transaction Protocol</span>
              <h3 className="text-2xl font-black text-white tracking-tight">Processing Distribution</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Executing secure ERC-4337 Revenue Distribution with real-time on-chain logs reconciliation.
              </p>
            </div>

            {/* Steps list */}
            <div className="space-y-6">
              {steps.map((step, idx) => {
                const isRunning = step.status === 'running';
                const isSuccess = step.status === 'success';
                const isError = step.status === 'error';

                return (
                  <div key={step.id} className="flex items-start gap-4 animate-fadeIn">
                    {/* Step indicator */}
                    <div className="relative flex-shrink-0 mt-0.5">
                      <motion.div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black transition-colors duration-300 border ${
                          isSuccess
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : isRunning
                            ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                            : isError
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                            : 'bg-white/5 border-white/10 text-gray-500'
                        }`}
                      >
                        {isSuccess ? (
                          <svg className="w-4 h-4 animate-scaleUp" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : isError ? (
                          <svg className="w-4 h-4 animate-shake" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        ) : isRunning ? (
                          <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          idx + 1
                        )}
                      </motion.div>
                    </div>

                    {/* Step text */}
                    <div className="space-y-1 flex-1 text-left">
                      <h4
                        className={`text-sm font-black transition-colors duration-300 ${
                          isRunning ? 'text-indigo-400' : isSuccess ? 'text-emerald-400' : isError ? 'text-rose-400' : 'text-gray-400'
                        }`}
                      >
                        {step.title}
                      </h4>
                      <p className="text-xs text-gray-500 font-medium leading-relaxed">
                        {step.id === 'index' && holders && holders.length > 0
                          ? `Syncing database splits & updating creator balances for ${holders.map(h => h.full_name).join(', ')}.`
                          : step.description}
                      </p>

                      {/* User Transfer Stages - Render inside Reconciling ledger (Step 4) for better UX during longer wait */}
                      {step.id === 'index' && (step.status === 'running' || step.status === 'success' || step.status === 'error') && holders && holders.length > 0 && (
                        <div className="mt-3 space-y-2 bg-black/20 rounded-2xl p-4 border border-white/5">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">On-Chain Transfer Stages</span>
                            <span className="text-[9px] text-gray-500 font-mono">Gasless Relayer Active</span>
                          </div>
                          {holders.map((h, idx) => {
                            let stageStatus: 'idle' | 'running' | 'success' | 'error' = 'idle';
                            if (step.status === 'success') {
                              stageStatus = 'success';
                            } else if (step.status === 'error') {
                              stageStatus = idx < activeSubStage ? 'success' : idx === activeSubStage ? 'error' : 'idle';
                            } else if (step.status === 'running') {
                              stageStatus = idx < activeSubStage ? 'success' : idx === activeSubStage ? 'running' : 'idle';
                            }

                            const shareUsd = (h.percentage / 100) * (amountUsd || 0);
                            const shareEth = (h.percentage / 100) * (amountEth || 0);

                            return (
                              <div key={h.id} className="flex items-center justify-between text-xs py-0.5">
                                <div className="flex items-center gap-2">
                                  {/* Spinning ring or status check */}
                                  <div className="flex-shrink-0">
                                    {stageStatus === 'running' ? (
                                      <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                                    ) : stageStatus === 'success' ? (
                                      <svg className="w-3.5 h-3.5 text-emerald-400 animate-scaleUp" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                      </svg>
                                    ) : stageStatus === 'error' ? (
                                      <svg className="w-3.5 h-3.5 text-rose-400 animate-shake" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    ) : (
                                      <div className="w-3.5 h-3.5 rounded-full border border-white/10" />
                                    )}
                                  </div>
                                  <div>
                                    <span className={`font-black ${stageStatus === 'running' ? 'text-indigo-400' : stageStatus === 'success' ? 'text-emerald-400' : 'text-gray-400'}`}>
                                      {h.full_name}
                                    </span>
                                    <span className="text-[9px] text-gray-500 ml-1.5 uppercase font-medium">{h.role}</span>
                                  </div>
                                </div>
                                <div className="text-right font-mono font-bold">
                                  <span className="text-white">${shareUsd.toFixed(2)}</span>
                                  <span className="text-gray-500 text-[10px] ml-2">({shareEth.toFixed(4)} Ξ)</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Error Display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 bg-rose-500/[0.03] border border-rose-500/20 rounded-[24px] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Transaction Reverted</p>
                  <button 
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-[10px] font-black text-rose-500 hover:text-rose-400 transition-colors uppercase tracking-widest flex items-center gap-1.5 underline decoration-2 underline-offset-2"
                  >
                    {showDetails ? 'Hide Parameters' : 'Inspect Parameters'}
                    <svg className={`w-3 h-3 transition-transform duration-200 ${showDetails ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                
                <p className="text-xs text-rose-200 font-medium leading-relaxed">{cleanError}</p>

                {showDetails && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="overflow-hidden pt-2 border-t border-rose-500/10"
                  >
                    <pre className="p-3 bg-black/45 rounded-xl text-[10px] font-mono text-rose-300 leading-normal text-left overflow-x-auto whitespace-pre-wrap max-h-48 scrollbar-thin">
                      {error}
                    </pre>
                  </motion.div>
                )}
              </motion.div>
            )}

            {txHash && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl text-center space-y-2"
              >
                <div>
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-wider">Distribution Finalized</p>
                  <p className="text-xs font-mono text-emerald-400 break-all select-all mt-1">{txHash}</p>
                </div>
                {txHash.startsWith('0x') && !txHash.includes('mock') && (
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

            {/* Close button if finished */}
            {(error || txHash) && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={onClose}
                className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl transition-colors border border-white/10 uppercase tracking-widest text-xs"
              >
                Dismiss Modal
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
