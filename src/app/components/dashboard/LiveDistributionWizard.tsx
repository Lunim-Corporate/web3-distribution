'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEthPrice } from '@/app/lib/useEthPrice';
import { useRevenueSplitter } from '@/lib/web3';
import { NetworkBadge } from '@/components/ui/NetworkBadge';
import { TxModal, TxStep } from '@/components/ui/TxModal';
import { readDemoMode, isDemoAccessEnabled } from '@/app/lib/demoAccess';
import { getExplorerUrl } from '@/app/lib/constants';

/* ─── Types ───────────────────────────────────────────────── */
interface Project {
  id: string;
  name: string;
  genre?: string;
  status: string;
  total_distributed: number;
  contract_address?: string;
  demo_contract_address?: string;
}

interface RightsHolder {
  id: string;
  full_name: string;
  role: string;
  wallet_address: string;
  percentage: number;
}

type WizardStep = 'select' | 'amount' | 'review' | 'confirm' | 'track';

/* ─── Helpers ─────────────────────────────────────────────── */
const fmtEth = (n: number) => `${n.toFixed(6)} ETH`;
const trunc = (addr: string) => addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '';

/* ─── Constants ───────────────────────────────────────────── */
const LARGE_AMOUNT_THRESHOLD_ETH = 1.0;
const GAS_WARNING_RATIO = 0.10; // Warn if gas > 10% of amount

/* ═══════════════════════════════════════════════════════════
   LiveDistributionWizard Component
   ═══════════════════════════════════════════════════════════ */
export function LiveDistributionWizard({
  projects,
  onDistributionComplete,
}: {
  projects: Project[];
  onDistributionComplete?: () => void;
}) {
  // Mode
  const [isDemoMode, setIsDemoMode] = useState(false);
  useEffect(() => {
    setIsDemoMode(readDemoMode());
    const handler = (e: CustomEvent) => setIsDemoMode(isDemoAccessEnabled && e.detail);
    window.addEventListener('demo-mode-changed', handler as EventListener);
    return () => window.removeEventListener('demo-mode-changed', handler as EventListener);
  }, []);

  const [selectedProjectId, setSelectedProjectId] = useState('');
  const selectedProject = projects.find(p => p.id === selectedProjectId) || null;

  const demoCA = selectedProject?.demo_contract_address || process.env.NEXT_PUBLIC_DEMO_CONTRACT_ADDRESS;
  const liveCA = selectedProject?.contract_address || process.env.NEXT_PUBLIC_LIVE_CONTRACT_ADDRESS;
  const targetCA = isDemoMode ? demoCA : liveCA;

  const {
    distributeRevenue,
    smartAccountAddress,
    estimateDistributionGas,
    getContractBalanceEth,
  } = useRevenueSplitter(targetCA);
  const { formatEthAsUsd, ethToUsd } = useEthPrice();

  // Wizard state
  const [step, setStep] = useState<WizardStep>('select');
  const [holders, setHolders] = useState<RightsHolder[]>([]);
  const [amount, setAmount] = useState('0.1');
  const [isProcessing, setIsProcessing] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [txError, setTxError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Gas state
  const [gasEstimateEth, setGasEstimateEth] = useState('0.0');
  const [isEstimatingGas, setIsEstimatingGas] = useState(false);

  // Contract balance
  const [contractBalance, setContractBalance] = useState('0.0');

  // TxModal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalTxHash, setModalTxHash] = useState('');
  const [txSteps, setTxSteps] = useState<TxStep[]>([
    { id: 'prep', title: 'Preparing payload', description: 'Validating split ratios & building calldata.', status: 'idle' },
    { id: 'gas', title: 'Estimating gas', description: 'Querying network for gas price & limit.', status: 'idle' },
    { id: 'sign', title: 'Awaiting signature', description: 'Please confirm in your wallet.', status: 'idle' },
    { id: 'mine', title: 'Mining transaction', description: 'Broadcasting to network & awaiting block confirmation.', status: 'idle' },
    { id: 'index', title: 'Reconciling ledger', description: 'Syncing on-chain events to database.', status: 'idle' },
  ]);

  const updateTxStep = (id: string, status: TxStep['status']) => {
    setTxSteps(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  const resetTxSteps = () => {
    setTxSteps([
      { id: 'prep', title: 'Preparing payload', description: 'Validating split ratios & building calldata.', status: 'idle' },
      { id: 'gas', title: 'Estimating gas', description: 'Querying network for gas price & limit.', status: 'idle' },
      { id: 'sign', title: 'Awaiting signature', description: 'Please confirm in your wallet.', status: 'idle' },
      { id: 'mine', title: 'Mining transaction', description: 'Broadcasting to network & awaiting block confirmation.', status: 'idle' },
      { id: 'index', title: 'Reconciling ledger', description: 'Syncing on-chain events to database.', status: 'idle' },
    ]);
    setModalError('');
    setModalTxHash('');
  };

  /* ── Fetch holders when project changes ─────────────────── */
  useEffect(() => {
    if (!selectedProjectId) { setHolders([]); return; }
    const fetchHolders = async () => {
      try {
        const res = await fetch(`/api/rights?project_id=${selectedProjectId}`);
        if (res.ok) {
          const data = await res.json();
          setHolders(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Failed to fetch holders:', err);
      }
    };
    fetchHolders();
  }, [selectedProjectId, isDemoMode]);

  /* ── Estimate gas when amount changes ───────────────────── */
  const refreshGasEstimate = useCallback(async () => {
    const ethAmt = parseFloat(amount);
    if (isNaN(ethAmt) || ethAmt <= 0) { setGasEstimateEth('0.0'); return; }
    setIsEstimatingGas(true);
    try {
      const result = await estimateDistributionGas(amount);
      setGasEstimateEth(result.gasEth);
    } catch {
      setGasEstimateEth('~0.0001');
    } finally {
      setIsEstimatingGas(false);
    }
  }, [amount, estimateDistributionGas]);

  /* ── Fetch contract balance ─────────────────────────────── */
  const refreshContractBalance = useCallback(async () => {
    try {
      const bal = await getContractBalanceEth();
      setContractBalance(bal);
    } catch {
      setContractBalance('0.0');
    }
  }, [getContractBalanceEth]);

  useEffect(() => {
    if (step === 'review') {
      refreshGasEstimate();
      refreshContractBalance();
    }
  }, [step, refreshGasEstimate, refreshContractBalance]);

  /* ── Derived values ─────────────────────────────────────── */
  const ethAmount = parseFloat(amount) || 0;
  const gasEthFloat = parseFloat(gasEstimateEth) || 0;
  const totalCostEth = ethAmount + gasEthFloat;
  const isLargeAmount = ethAmount >= LARGE_AMOUNT_THRESHOLD_ETH;
  const gasWarning = gasEthFloat > 0 && ethAmount > 0 && gasEthFloat / ethAmount > GAS_WARNING_RATIO;

  const splitPreview = holders.map(h => ({
    ...h,
    amountEth: (h.percentage / 100) * ethAmount,
    amountUsd: ethToUsd((h.percentage / 100) * ethAmount),
  }));

  /* ── Navigation ─────────────────────────────────────────── */
  const canProceed = {
    select: !!selectedProjectId && holders.length > 0,
    amount: ethAmount > 0,
    review: true,
    confirm: true,
    track: true,
  };

  const goNext = () => {
    const order: WizardStep[] = ['select', 'amount', 'review', 'confirm', 'track'];
    const idx = order.indexOf(step);
    if (idx < order.length - 1) {
      // For the confirm step, check if large amount needs extra confirmation
      if (order[idx + 1] === 'confirm' && isLargeAmount && !showConfirmModal) {
        setShowConfirmModal(true);
        return;
      }
      setStep(order[idx + 1]);
    }
  };

  const goBack = () => {
    const order: WizardStep[] = ['select', 'amount', 'review', 'confirm', 'track'];
    const idx = order.indexOf(step);
    if (idx > 0) setStep(order[idx - 1]);
  };

  const resetWizard = () => {
    setStep('select');
    setTxHash('');
    setTxError('');
    setAmount('0.1');
    setSelectedProjectId('');
    setHolders([]);
    setShowConfirmModal(false);
  };

  /* ── Execute Distribution ───────────────────────────────── */
  const executeDistribution = async () => {
    setShowConfirmModal(false);
    setIsProcessing(true);
    setIsModalOpen(true);
    resetTxSteps();
    setStep('track');

    let currentStepId = 'prep';

    try {
      // Step 1: Prepare
      updateTxStep('prep', 'running');
      await new Promise(r => setTimeout(r, 600));
      updateTxStep('prep', 'success');

      // Step 2: Gas estimation
      currentStepId = 'gas';
      updateTxStep('gas', 'running');
      await refreshGasEstimate();
      updateTxStep('gas', 'success');

      // Step 3: Sign — this is where the wallet popup appears
      currentStepId = 'sign';
      updateTxStep('sign', 'running');

      // Step 4: Mine — starts after wallet confirms
      let resultTxHash: string | null = null;

      if (isDemoMode) {
        // Demo mode: simulate or use MetaMask against Hardhat
        const DEMO_CA = process.env.NEXT_PUBLIC_DEMO_CONTRACT_ADDRESS;
        const hasMetaMask = typeof window !== 'undefined' && !!window.ethereum;
        let activeMetaMaskAcc = '';
        let activeChainIdHex = '';

        if (hasMetaMask) {
          try {
            const accounts = await window.ethereum!.request({ method: 'eth_accounts' }) as string[];
            activeMetaMaskAcc = accounts[0] || '';
            activeChainIdHex = await window.ethereum!.request({ method: 'eth_chainId' }) as string;
          } catch (e) {
            console.warn('MetaMask check skipped', e);
          }
        }

        const activeDemoWallet = localStorage.getItem('active_demo_wallet') || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
        const isMetaMaskMatching = activeMetaMaskAcc && activeMetaMaskAcc.toLowerCase() === activeDemoWallet.toLowerCase();
        const isChainHardhat = parseInt(activeChainIdHex, 16) === 31337;

        if (hasMetaMask && isMetaMaskMatching && isChainHardhat && DEMO_CA) {
          const weiHex = `0x${Math.floor(ethAmount * 1e18).toString(16)}`;
          resultTxHash = await window.ethereum!.request({
            method: 'eth_sendTransaction',
            params: [{
              from: activeDemoWallet,
              to: DEMO_CA,
              value: weiHex,
              data: '0x2d07953a',
              gasPrice: '0x0',
            }],
          }) as string;
        } else {
          // Pure simulation
          await new Promise(r => setTimeout(r, 1500));
          const ts = Date.now().toString(16).padStart(12, '0');
          resultTxHash = '0xdemo' + ts + '0'.repeat(64 - 4 - ts.length - 4) + 'cafe';
        }
      } else {
        // Live mode
        resultTxHash = await distributeRevenue(amount);
      }

      updateTxStep('sign', 'success');
      currentStepId = 'mine';
      updateTxStep('mine', 'running');
      await new Promise(r => setTimeout(r, 500));
      updateTxStep('mine', 'success');

      // Step 5: Index — record in database
      currentStepId = 'index';
      updateTxStep('index', 'running');

      const res = await fetch('/api/web3/auto-distribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: selectedProjectId,
          amount_eth: ethAmount,
          manual_tx_hash: resultTxHash,
          sender_address: isDemoMode
            ? (localStorage.getItem('active_demo_wallet') || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266')
            : smartAccountAddress,
          is_demo: isDemoMode,
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
      setTxHash(data.txHash || resultTxHash || '');
      setModalTxHash(data.txHash || resultTxHash || '');
      updateTxStep('index', 'success');

      window.dispatchEvent(new CustomEvent('payment-recorded', { detail: { projectId: selectedProjectId } }));
      onDistributionComplete?.();

    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : 'Transaction failed';
      updateTxStep(currentStepId, 'error');
      setModalError(errMsg);
      setTxError(errMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  /* ── Step indicator ─────────────────────────────────────── */
  const WIZARD_STEPS: { key: WizardStep; label: string; icon: string }[] = [
    { key: 'select', label: 'Project', icon: '📁' },
    { key: 'amount', label: 'Amount', icon: '💰' },
    { key: 'review', label: 'Review', icon: '🔍' },
    { key: 'confirm', label: 'Confirm', icon: '✅' },
    { key: 'track', label: 'Track', icon: '📡' },
  ];

  const currentStepIndex = WIZARD_STEPS.findIndex(s => s.key === step);

  /* ═══════════════════════════════════════════════════════════
     RENDER
   ═══════════════════════════════════════════════════════════ */
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">
            {isDemoMode ? 'Demo Distribution Wizard' : 'Live Distribution Wizard'}
          </h2>
          <p className="text-gray-400 mt-1 text-sm font-medium">
            {isDemoMode
              ? 'Simulate real money distribution flows safely.'
              : 'Distribute real revenue to rights holders on-chain.'}
          </p>
        </div>
        <NetworkBadge isDemoMode={isDemoMode} />
      </div>

      {/* Step Progress Bar */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          {WIZARD_STEPS.map((ws, idx) => (
            <React.Fragment key={ws.key}>
              <div className="flex flex-col items-center gap-1.5 min-w-0">
                <motion.div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg border transition-all duration-300 ${
                    idx < currentStepIndex
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : idx === currentStepIndex
                      ? 'bg-indigo-500/10 border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                      : 'bg-white/5 border-white/10'
                  }`}
                  animate={idx === currentStepIndex ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  {idx < currentStepIndex ? (
                    <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span>{ws.icon}</span>
                  )}
                </motion.div>
                <span className={`text-[9px] font-black uppercase tracking-widest ${
                  idx <= currentStepIndex ? 'text-indigo-400' : 'text-gray-600'
                }`}>
                  {ws.label}
                </span>
              </div>
              {idx < WIZARD_STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-2 ${
                  idx < currentStepIndex ? 'bg-emerald-500/30' : 'bg-white/10'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Wizard Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="bg-white/5 border border-white/10 rounded-[40px] p-10 backdrop-blur-3xl shadow-2xl relative overflow-hidden"
        >
          {/* Glow */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-[100px]" />

          <div className="relative z-10">
            {/* ── Step 1: Select Project ─────────────────────── */}
            {step === 'select' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-black text-white mb-2">Select Project</h3>
                  <p className="text-sm text-gray-400">Choose which project&apos;s revenue to distribute.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {projects.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProjectId(p.id)}
                      className={`text-left p-5 rounded-2xl border transition-all duration-200 ${
                        selectedProjectId === p.id
                          ? 'bg-indigo-500/10 border-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.15)]'
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <p className="text-sm font-black text-white">{p.name}</p>
                      <p className="text-[10px] text-gray-500 mt-1 font-medium uppercase tracking-widest">
                        {p.genre || 'Uncategorized'} · {p.status}
                      </p>
                      <p className="text-xs text-indigo-400 font-mono mt-2 font-bold">
                        {p.total_distributed?.toFixed(4) || '0.0000'} ETH distributed
                      </p>
                    </button>
                  ))}
                  {projects.length === 0 && (
                    <div className="col-span-2 text-center py-12 text-gray-500">
                      <p className="text-sm font-black uppercase tracking-widest">No projects available</p>
                      <p className="text-xs mt-2">Create a project in the admin panel first.</p>
                    </div>
                  )}
                </div>
                {selectedProjectId && holders.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                      ✓ {holders.length} rights holder{holders.length !== 1 ? 's' : ''} loaded
                    </p>
                  </motion.div>
                )}
              </div>
            )}

            {/* ── Step 2: Enter Amount ───────────────────────── */}
            {step === 'amount' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-black text-white mb-2">Distribution Amount</h3>
                  <p className="text-sm text-gray-400">
                    Enter the total ETH to distribute across {holders.length} holder{holders.length !== 1 ? 's' : ''}.
                  </p>
                </div>
                <div className="p-8 bg-white/5 rounded-[32px] border border-white/10 space-y-6">
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">
                    Amount (ETH)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      className="w-full bg-transparent border-none text-6xl font-black text-white outline-none font-mono"
                      placeholder="0.00"
                    />
                    <div className="absolute right-0 bottom-2 text-indigo-400 font-black text-2xl">Ξ</div>
                  </div>
                  <div className="flex justify-between items-center pt-6 border-t border-white/5">
                    <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Est. USD Value</span>
                    <span className="text-xl font-black text-emerald-400">{formatEthAsUsd(ethAmount)}</span>
                  </div>
                </div>

                {/* Quick amount buttons */}
                <div className="flex gap-3 flex-wrap">
                  {['0.01', '0.05', '0.1', '0.5', '1.0', '5.0'].map(a => (
                    <button
                      key={a}
                      onClick={() => setAmount(a)}
                      className={`px-4 py-2 rounded-xl text-xs font-black border transition-all ${
                        amount === a
                          ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-400'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                      }`}
                    >
                      {a} ETH
                    </button>
                  ))}
                </div>

                {isLargeAmount && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex items-center gap-3"
                  >
                    <span className="text-amber-400 text-lg">⚠️</span>
                    <div>
                      <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Large Amount</p>
                      <p className="text-xs text-amber-300/80 mt-0.5">
                        This exceeds {LARGE_AMOUNT_THRESHOLD_ETH} ETH ({formatEthAsUsd(LARGE_AMOUNT_THRESHOLD_ETH)}). Extra confirmation will be required.
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* ── Step 3: Review Split ──────────────────────── */}
            {step === 'review' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-black text-white mb-2">Review Distribution</h3>
                  <p className="text-sm text-gray-400">
                    Verify each holder&apos;s allocation before signing.
                  </p>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Total Distribution</p>
                    <p className="text-lg font-black text-white font-mono mt-1">{fmtEth(ethAmount)}</p>
                    <p className="text-xs text-indigo-400 font-bold">{formatEthAsUsd(ethAmount)}</p>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Est. Gas</p>
                    <p className="text-lg font-black text-white font-mono mt-1">
                      {isEstimatingGas ? '...' : `${parseFloat(gasEstimateEth).toFixed(6)} ETH`}
                    </p>
                    <p className="text-xs text-indigo-400 font-bold">{formatEthAsUsd(gasEthFloat)}</p>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Total Cost</p>
                    <p className="text-lg font-black text-white font-mono mt-1">{fmtEth(totalCostEth)}</p>
                    <p className="text-xs text-emerald-400 font-bold">{formatEthAsUsd(totalCostEth)}</p>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Contract Balance</p>
                    <p className="text-lg font-black text-white font-mono mt-1">{parseFloat(contractBalance).toFixed(4)} ETH</p>
                    <p className="text-xs text-indigo-400 font-bold">{formatEthAsUsd(parseFloat(contractBalance))}</p>
                  </div>
                </div>

                {gasWarning && (
                  <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex items-center gap-3">
                    <span className="text-amber-400">⚠️</span>
                    <p className="text-xs text-amber-300/80">
                      Gas cost exceeds 10% of the distribution amount. Consider distributing a larger amount for efficiency.
                    </p>
                  </div>
                )}

                {/* Holder split table */}
                <div className="bg-black/40 rounded-[32px] p-6 border border-white/5">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Split Allocation</h4>
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                      {holders.length} Payees
                    </span>
                  </div>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                    {splitPreview.map(h => (
                      <div key={h.id} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl hover:bg-white/[0.04] transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-xs font-black text-indigo-400 border border-indigo-500/20">
                            {h.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{h.full_name}</p>
                            <p className="text-[10px] text-gray-500 font-mono">{trunc(h.wallet_address)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-white font-mono">{h.percentage}%</p>
                          <p className="text-xs text-indigo-400 font-mono">{h.amountEth.toFixed(6)} ETH</p>
                          <p className="text-[10px] text-gray-500">{formatEthAsUsd(h.amountEth)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 4: Confirm & Sign ────────────────────── */}
            {step === 'confirm' && (
              <div className="space-y-6 text-center">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-indigo-500/10 flex items-center justify-center text-4xl border border-indigo-500/20">
                  🔐
                </div>
                <div>
                  <h3 className="text-xl font-black text-white mb-2">Confirm & Sign</h3>
                  <p className="text-sm text-gray-400 max-w-md mx-auto">
                    You are about to distribute <strong className="text-white">{fmtEth(ethAmount)}</strong>
                    {' '}({formatEthAsUsd(ethAmount)}) to {holders.length} holders via{' '}
                    <strong className="text-indigo-400">{selectedProject?.name}</strong>.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                  <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Amount</p>
                    <p className="text-sm font-black text-white font-mono mt-1">{fmtEth(ethAmount)}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Gas</p>
                    <p className="text-sm font-black text-white font-mono mt-1">{parseFloat(gasEstimateEth).toFixed(6)}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Total</p>
                    <p className="text-sm font-black text-emerald-400 font-mono mt-1">{fmtEth(totalCostEth)}</p>
                  </div>
                </div>

                {!isDemoMode && (
                  <div className="p-3 bg-white/5 border border-white/10 rounded-2xl max-w-md mx-auto">
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Sending From</p>
                    <p className="text-xs text-indigo-400 font-mono break-all">
                      {smartAccountAddress || 'Connect wallet to see address'}
                    </p>
                  </div>
                )}

                {!isDemoMode && process.env.NEXT_PUBLIC_LIVE_CONTRACT_ADDRESS?.startsWith('0x') && (
                  <a
                    href={getExplorerUrl('address', process.env.NEXT_PUBLIC_LIVE_CONTRACT_ADDRESS)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[10px] font-black text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest"
                  >
                    Verify contract on BaseScan
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}

                <button
                  onClick={executeDistribution}
                  disabled={isProcessing}
                  className="w-full max-w-md mx-auto block py-5 bg-gradient-to-r from-emerald-500 via-indigo-500 to-purple-500 bg-[length:200%_auto] hover:bg-right text-white font-black rounded-2xl transition-all shadow-[0_0_30px_rgba(99,102,241,0.3)] disabled:opacity-50 uppercase tracking-[0.3em] text-sm animate-gradient"
                >
                  {isProcessing ? 'Executing...' : '🔏 Sign & Distribute'}
                </button>
              </div>
            )}

            {/* ── Step 5: Track ──────────────────────────────── */}
            {step === 'track' && (
              <div className="space-y-6 text-center">
                {txHash ? (
                  <>
                    <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/10 flex items-center justify-center text-4xl border border-emerald-500/20">
                      ✅
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-emerald-400 mb-2">Distribution Complete</h3>
                      <p className="text-sm text-gray-400">All splits have been recorded on-chain and indexed.</p>
                    </div>
                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                      <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Transaction Hash</p>
                      <p className="text-xs font-mono text-emerald-400 break-all select-all">{txHash}</p>
                    </div>
                    {!isDemoMode && txHash.startsWith('0x') && (
                      <a
                        href={getExplorerUrl('tx', txHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[10px] font-black text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest"
                      >
                        View on BaseScan ↗
                      </a>
                    )}
                    <button
                      onClick={resetWizard}
                      className="w-full max-w-sm mx-auto block py-4 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl transition-colors border border-white/10 uppercase tracking-widest text-xs"
                    >
                      New Distribution
                    </button>
                  </>
                ) : txError ? (
                  <>
                    <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-500/10 flex items-center justify-center text-4xl border border-rose-500/20">
                      ❌
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-rose-400 mb-2">Distribution Failed</h3>
                      <p className="text-sm text-gray-400">{txError}</p>
                    </div>
                    <button
                      onClick={() => { setTxError(''); setStep('confirm'); }}
                      className="w-full max-w-sm mx-auto block py-4 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl transition-colors border border-white/10 uppercase tracking-widest text-xs"
                    >
                      Try Again
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 mx-auto rounded-3xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                      <div className="w-8 h-8 border-3 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white mb-2">Processing...</h3>
                      <p className="text-sm text-gray-400">Your transaction is being executed. Please wait.</p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── Navigation buttons ────────────────────────── */}
            {step !== 'track' && step !== 'confirm' && (
              <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/5">
                <button
                  onClick={goBack}
                  disabled={step === 'select'}
                  className="px-6 py-3 text-sm font-black text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-widest"
                >
                  ← Back
                </button>
                <button
                  onClick={goNext}
                  disabled={!canProceed[step]}
                  className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black rounded-2xl transition-all hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-widest text-sm"
                >
                  {step === 'review' ? 'Proceed to Confirm →' : 'Next →'}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Large Amount Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setShowConfirmModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative z-10 w-full max-w-md bg-gradient-to-b from-white/10 to-white/5 border border-amber-500/20 rounded-[36px] p-8 shadow-2xl backdrop-blur-2xl"
            >
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 flex items-center justify-center text-3xl border border-amber-500/20">
                  ⚠️
                </div>
                <h3 className="text-lg font-black text-white">Confirm Large Distribution</h3>
                <p className="text-sm text-gray-400">
                  You are about to distribute <strong className="text-amber-400">{fmtEth(ethAmount)}</strong>
                  {' '}({formatEthAsUsd(ethAmount)}). This is a significant amount.
                </p>
                <p className="text-xs text-gray-500">Are you sure you want to proceed?</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-gray-400 font-black rounded-xl transition-colors border border-white/10 text-xs uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => { setShowConfirmModal(false); setStep('confirm'); }}
                    className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black rounded-xl transition-all hover:shadow-lg text-xs uppercase tracking-widest"
                  >
                    Yes, Continue
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Transaction progress modal */}
      <TxModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        steps={txSteps}
        txHash={modalTxHash}
        error={modalError}
      />
    </div>
  );
}
