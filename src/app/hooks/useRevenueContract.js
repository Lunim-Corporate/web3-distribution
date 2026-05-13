/*
 MOONSTONE DATA FLOW — READ THIS BEFORE EDITING
 ================================================
 The hook supports TWO modes:

 MODE 1: LIVE (MetaMask + Hardhat + Express backend)
 ──────────────────────────────────────────────────
 USER CLICKS "DISTRIBUTE REVENUE"
         |
         v
 [1] ethers.js → contract.distributeRevenue({ value })
         | gets tx.hash immediately
         v
 [2] POST /api/transactions/initiate
         | saves status: 'pending' to Supabase
         v
 [3] await tx.wait() — waits for on-chain confirmation
         | returns receipt + event logs
         v
 [4] Parse HolderPaid events from receipt logs
         |
         v
 [5] POST /api/transactions/confirm
         | - updates tx status: 'confirmed'
         | - inserts transaction_splits rows
         | - increments rights_holder.total_received
         | - increments project.total_distributed
         v
 [6] GET /api/projects/:id → refresh all dashboard state from DB
         |
         v
 [7] Supabase Realtime pushes INSERT event → Dashboard auto-refreshes

 MODE 2: DEMO (No MetaMask / No Hardhat / No Express)
 ──────────────────────────────────────────────────────
 Simulates the entire blockchain flow using direct Supabase writes.
 - Generates a fake tx hash
 - Writes payment rows per rights holder based on their share %
 - Updates project.total_revenue
 - Triggers Supabase Realtime → all dashboard tabs update automatically
 - Shows realistic pending → confirmed animation with confetti
*/

import { useState, useCallback, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { getSplitsClient } from '@/lib/web3/client';
import { useWallet } from '@/lib/wallet';
import { BrowserProvider, Contract, parseEther, formatEther, Interface } from 'ethers';

// ------------------------------------------------------------------
// Supabase client for direct writes in Demo Mode
// ------------------------------------------------------------------
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseDirect = createClient(supabaseUrl, supabaseAnonKey);


let RevenueRightsABI = null;

try {
  RevenueRightsABI = require('../contracts/RevenueRights.json');
} catch (e) {
  console.warn('RevenueRights ABI not found — Demo Mode only');
}

const LIVE_API_BASE = 'http://localhost:4000/api';
const ETH_USD_RATE = 3500; // 1 ETH = $3,500

// ------------------------------------------------------------------
// Generate a realistic-looking tx hash
// ------------------------------------------------------------------
function generateTxHash() {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * 16)];
  }
  return hash;
}

// ------------------------------------------------------------------
// Check if Live Mode infrastructure is available
// ------------------------------------------------------------------
async function isLiveModeAvailable() {
  // Check 1: MetaMask present?
  if (typeof window === 'undefined' || !window.ethereum) return false;

  // Check 2: Express backend reachable?
  try {
    const res = await fetch(LIVE_API_BASE.replace('/api', '/'), {
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) return false;
  } catch {
    return false;
  }

  // Check 3: Hardhat node reachable?
  try {
    const res = await fetch('http://127.0.0.1:8545', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'net_version', params: [], id: 1 }),
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) return false;
  } catch {
    return false;
  }

  return true;
}

// ==================================================================
// MAIN HOOK
// ==================================================================
export function useRevenueContract(projectId) {
  const { 
    account: walletAddress, 
    isConnected, 
    connectWallet: connectWalletUnified, 
    chainId 
  } = useWallet();

  const [project, setProject] = useState(null);
  const [rightsHolders, setRightsHolders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [allProjectsState, setAllProjectsState] = useState([]);
  const [txStatus, setTxStatus] = useState('idle'); // 'idle'|'pending'|'confirmed'|'error'
  const [lastTxHash, setLastTxHash] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(true); // Start in demo, upgrade to live if possible

  const modeChecked = useRef(false);

  // ────────────────────────────────────────────────────────────────
  // Detect mode on mount — and auto-connect in Demo Mode
  // ────────────────────────────────────────────────────────────────
  // ────────────────────────────────────────────────────────────────
  // Sync demo mode with the global LIVE/DEMO toggle in the Navbar
  // ────────────────────────────────────────────────────────────────
  useEffect(() => {
    // Read initial value from localStorage (set by Navbar toggle)
    const stored = localStorage.getItem('demo_mode');
    if (stored !== null) {
      setIsDemoMode(stored === 'true');
    }

    const onDemoChanged = (e) => setIsDemoMode(e.detail);
    window.addEventListener('demo-mode-changed', onDemoChanged);
    return () => window.removeEventListener('demo-mode-changed', onDemoChanged);
  }, []);

  // Also do the live-infrastructure check on first mount
  useEffect(() => {
    if (modeChecked.current) return;
    modeChecked.current = true;
    isLiveModeAvailable().then((live) => {
      if (live) {
        console.log('🟢 Moonstone: Live infrastructure detected');
      } else {
        console.log('🟡 Moonstone: Demo Mode — wallet managed by WalletProvider');
      }
    });
  }, []);

  // ────────────────────────────────────────────────────────────────
  // Data refresh — works for BOTH modes
  // ────────────────────────────────────────────────────────────────
  const refreshDashboardData = useCallback(async () => {
    try {
      const mode = isDemoMode ? 'demo' : 'live';
      const url = `/api/dashboard/data?projectId=${projectId || 'all'}&mode=${mode}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch dashboard data');
      const { projects, contributors, payments } = await res.json();

      const activeProj = projectId && projectId !== 'all' 
        ? projects.find(p => p.id === projectId) 
        : (projects.length > 0 ? projects[0] : null);

      // Map to the shape the dashboard expects
      const userToRhMap = {};
      const rights_holders = contributors.map((c) => {
        const rh = {
          id: c.id,
          user_id: c.user_id,
          name: c.name || 'Unknown',
          role: c.role,
          wallet_address: c.wallet_address || '',
          percentage: c.revenue_share || 0,
          total_received: 0,
          project_id: c.project_id,
          projectName: projects.find(p => p.id === c.project_id)?.name || 'Project'
        };
        if (c.user_id) userToRhMap[c.user_id] = rh;
        return rh;
      });

      // Deduplicate for global view
      const uniqueRightsHoldersMap = new Map();
      rights_holders.forEach(rh => {
        const key = rh.user_id || rh.name;
        if (!uniqueRightsHoldersMap.has(key)) {
          uniqueRightsHoldersMap.set(key, rh);
        }
      });
      const finalRightsHolders = Array.from(uniqueRightsHoldersMap.values());

      // Group into transactions
      const txMap = {};
      (payments || []).forEach((p) => {
        const hash = p.tx_hash || `mock-${p.id}`;
        if (!txMap[hash]) {
          txMap[hash] = {
            id: hash,
            tx_hash: hash,
            created_at: p.created_at,
            status: p.status || 'confirmed',
            source: p.source || 'Client Payment',
            project_id: p.project_id,
            total_amount: 0,
            transaction_splits: [],
          };
        }
        const paymentAmountUSD = (Number(p.amount) || 0) / 100;
        txMap[hash].total_amount += paymentAmountUSD;

        const rh = userToRhMap[p.user_id] || {};
        txMap[hash].transaction_splits.push({
          id: p.id,
          name: rh.name || 'Unknown',
          role: rh.role || 'Contributor',
          percentage: rh.percentage || 0,
          amount_eth: paymentAmountUSD,
        });

        if (rh.id) {
          rh.total_received = (rh.total_received || 0) + paymentAmountUSD;
        }
      });

      const total_revenue = projectId && projectId !== 'all' 
        ? (Number(activeProj?.total_revenue) || 0) / 100
        : projects.reduce((sum, p) => sum + (Number(p.total_revenue) || 0), 0) / 100;

      const dashboardData = {
        ...(activeProj || {}),
        total_distributed: total_revenue,
        rights_holders: finalRightsHolders,
        transactions: Object.values(txMap),
      };

      setProject(dashboardData);
      setRightsHolders(finalRightsHolders);
      setTransactions(Object.values(txMap));
      setAllProjectsState(projects);

    } catch (err) {
      console.error('Data refresh error:', err);
    }
  }, [projectId, isDemoMode]);

  // Initial load
  useEffect(() => {
    refreshDashboardData();
  }, [refreshDashboardData]);

  // ────────────────────────────────────────────────────────────────
  // CONNECT WALLET
  // ────────────────────────────────────────────────────────────────
  const connectWallet = async () => {
    setTxStatus('idle');
    setErrorMessage('');

    if (isDemoMode) {
      // Demo Mode: simulate a wallet address via the unified provider if possible
      // or just stay as is. Actually, we'll use the unified connect.
      await connectWalletUnified();
      return;
    }

    // Live Mode: Use unified connector
    try {
      await connectWalletUnified();
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to connect wallet');
      setTxStatus('error');
    }
  };

  // ────────────────────────────────────────────────────────────────
  // SEND REVENUE
  // ────────────────────────────────────────────────────────────────
  const sendRevenue = async (amountEth) => {
    if (!isConnected || !projectId) return;

    if (isDemoMode) {
      await sendRevenueDemoMode(amountEth);
    } else {
      await sendRevenueLiveMode(amountEth);
    }
  };

  // ── DEMO MODE TRANSACTION ──────────────────────────────────────
  const sendRevenueDemoMode = async (amountEth) => {
    const txHash = generateTxHash();
    try {
      setTxStatus('pending');
      setErrorMessage('');
      setLastTxHash(txHash);

      // Simulate blockchain processing delay (1.8 seconds)
      await new Promise((resolve) => setTimeout(resolve, 1800));

      const totalUSD = Number(amountEth) * ETH_USD_RATE;

      const recordRes = await fetch('/api/payments/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          amountEth,
          totalUSD,
          txHash,
          source: 'Demo Mode'
        })
      });

      if (!recordRes.ok) {
        const errData = await recordRes.json();
        throw new Error(errData.error || 'Failed to record payment');
      }

      setTxStatus('confirmed');

      window.dispatchEvent(new CustomEvent('payment-recorded', {
        detail: { projectId, txHash, totalUSD, timestamp: Date.now() }
      }));

      await refreshDashboardData();
    } catch (err) {
      console.error('Demo transaction failed:', err);
      setTxStatus('error');
      setErrorMessage(err.message || 'Demo transaction failed');
    }
  };

  // ── LIVE MODE TRANSACTION ──────────────────────────────────────
  const sendRevenueLiveMode = async (amountEth) => {
    let currentTxHash = '';

    try {
      setTxStatus('pending');
      setErrorMessage('');
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const contract = new Contract(RevenueRightsABI.address, RevenueRightsABI.abi, signer);
      const value = parseEther(amountEth.toString());

      // STEP 1 — Call contract.distributeRevenue
      const tx = await contract.distributeRevenue({ value });
      currentTxHash = tx.hash;
      setLastTxHash(tx.hash);

      // STEP 2 — Call POST /api/transactions/initiate
      const initiateRes = await fetch(`${LIVE_API_BASE}/transactions/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          senderAddress: walletAddress,
          totalAmountEth: amountEth,
          txHash: tx.hash,
        }),
      });

      if (!initiateRes.ok) {
        console.warn('Backend initiate failed, continuing but fallback listener will be needed.');
      }

      // STEP 3 — Await tx.wait()
      const receipt = await tx.wait();

      // STEP 4 — Parse HolderPaid events
      const iface = new Interface(RevenueRightsABI.abi);
      const holderPaidTopic = iface.getEvent('HolderPaid').topicHash;

      const splits = receipt.logs
        .filter((log) => log.topics[0] === holderPaidTopic)
        .map((log) => {
          const decoded = iface.decodeEventLog('HolderPaid', log.data, log.topics);
          return {
            walletAddress: decoded.recipient,
            name: decoded.name,
            role: decoded.role,
            percentage: Number(decoded.basisPoints) / 100,
            amountEth: Number(formatEther(decoded.amount)),
          };
        });

      // STEP 5 — Call POST /api/transactions/confirm
      const confirmRes = await fetch(`${LIVE_API_BASE}/transactions/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txHash: tx.hash,
          projectId,
          blockNumber: receipt.blockNumber,
          splits,
        }),
      });

      if (!confirmRes.ok) {
        const errData = await confirmRes.json();
        throw new Error(errData.error || 'Failed to confirm transaction in database');
      }

      setTxStatus('confirmed');

      // STEP 6 — Refresh Dashboard Data
      await refreshDashboardData();
    } catch (err) {
      console.error(err);
      setTxStatus('error');

      if (err.code === 'ACTION_REJECTED') {
        setErrorMessage('Transaction cancelled by user');
      } else if (err.message?.includes('insufficient funds')) {
        setErrorMessage('Insufficient funds in connected wallet');
      } else {
        setErrorMessage(err.message || 'An unexpected error occurred');
      }

      // STEP 7 — Call POST /api/transactions/fail
      if (currentTxHash) {
        try {
          await fetch(`${LIVE_API_BASE}/transactions/fail`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ txHash: currentTxHash }),
          });
        } catch (failErr) {
          console.error('Failed to mark tx as failed:', failErr);
        }
      }
    }
  };

  // ── UPDATE SPLIT (ROSTER CHANGE) ──────────────────────────────
  const updateSplitOnChain = async (newRoster) => {
    if (!isConnected || !projectId) return;

    if (isDemoMode) {
      setTxStatus('pending');
      await new Promise(resolve => setTimeout(resolve, 1500));
      // In demo mode, we just update Supabase shares
      for (const member of newRoster) {
        await supabaseDirect
          .from('project_contributors')
          .update({ revenue_share: member.revenue_share })
          .eq('id', member.id);
      }
      setTxStatus('confirmed');
      await refreshDashboardData();
      return;
    }

    // Live Mode logic using Splits SDK
    try {
      setTxStatus('pending');
      const splitsClient = await getSplitsClient(window.ethereum);
      
      const recipients = newRoster.map(r => ({
        address: r.users?.wallet_address,
        percentAllocation: r.revenue_share
      }));

      // NOTE: 0xSplits updateSplit expects basis points or specific format
      // We use the SDK's higher-level methods
      const splitAddress = project?.contract_address;
      if (!splitAddress) throw new Error("No split address found for this project");

      const response = await splitsClient.updateSplit({
        splitAddress,
        recipients,
        distributorFeePercent: 0, // Default for now
      });

      setLastTxHash(response.event.transactionHash);
      setTxStatus('confirmed');
      
      // Update DB to reflect confirmed on-chain state
      for (const member of newRoster) {
        await supabaseDirect
          .from('project_contributors')
          .update({ revenue_share: member.revenue_share })
          .eq('id', member.id);
      }
      
      await refreshDashboardData();
    } catch (err) {
      console.error('Split update failed:', err);
      setTxStatus('error');
      setErrorMessage(err.message || 'Split update failed');
    }
  };

  return {
    project,
    rightsHolders,
    transactions,
    isConnected,
    walletAddress,
    connectWallet,
    sendRevenue,
    updateSplitOnChain,
    txStatus,
    lastTxHash,
    errorMessage,
    isDemoMode,
    refreshDashboardData,
    allProjects: allProjectsState,
  };
}
