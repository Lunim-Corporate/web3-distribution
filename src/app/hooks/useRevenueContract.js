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
import { BrowserProvider, Contract, JsonRpcProvider, parseEther, formatEther, Interface } from 'ethers';

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
const LOCAL_HARDHAT_RPC = process.env.NEXT_PUBLIC_HARDHAT_RPC_URL || 'http://127.0.0.1:8545';

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
  const [isDemoMode, setIsDemoMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('demo_mode') === 'true';
    }
    return false;
  });
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

      const globalTotalRevenue = projects.reduce((sum, p) => sum + (Number(p.total_revenue) || 0), 0);

      const activeProj = projectId && projectId !== 'all' 
        ? projects.find(p => p.id === projectId) 
        : { id: 'all', name: 'All Projects', total_revenue: globalTotalRevenue };

      // Group and Aggregate for rights holders
      const uniqueRightsHoldersMap = new Map();

      // First pass: create mapping of contributors
      contributors.forEach((c) => {
        const key = `${c.project_id}_${c.user_id || c.name}`;
        const proj = projects.find(p => p.id === c.project_id);
        if (!uniqueRightsHoldersMap.has(key)) {
          uniqueRightsHoldersMap.set(key, {
            id: c.id,
            user_id: c.user_id,
            project_id: c.project_id,
            projectName: proj ? proj.name : 'Unknown Project',
            name: c.name || 'Unknown',
            role: c.role || 'Contributor',
            wallet_address: c.wallet_address || '',
            percentage: c.revenue_share || 0,
            total_received: 0,
            projectCount: 0,
            global_share: 0,
            distributions: []
          });
        }
        const existing = uniqueRightsHoldersMap.get(key);
        existing.projectCount += 1;
      });

      // Second pass: add transaction data
      const txMap = {};
      (payments || []).forEach((p) => {
        const hash = p.tx_hash || `mock-${p.id}`;
        if (!txMap[hash]) {
          txMap[hash] = {
            id: hash,
            tx_hash: hash,
            created_at: p.created_at || p.payment_date,
            status: p.status || 'confirmed',
            source: p.source || 'Client Payment',
            project_id: p.project_id,
            projectName: p.projectName,
            total_amount: 0,
            transaction_splits: [],
          };
        }
        const paymentAmountUSD = (Number(p.amount) || 0) / 100;
        txMap[hash].total_amount += paymentAmountUSD;

        const rh = uniqueRightsHoldersMap.get(`${p.project_id}_${p.user_id || p.user_name}`);
        if (rh) {
          txMap[hash].transaction_splits.push({
            id: p.id,
            name: rh.name,
            role: rh.role,
            percentage: p.split_percentage || rh.percentage || 0,
            amount_eth: paymentAmountUSD, // Named amount_eth for UI compatibility
          });

          rh.total_received += paymentAmountUSD;
          rh.distributions.push({
            id: hash,
            amount: paymentAmountUSD,
            date: p.created_at || p.payment_date,
            source: p.source
          });
        }
      });

      // Calculate Global Share (%) for each contributor (internal use only)
      const totalRevenueUSD = globalTotalRevenue / 100;
      uniqueRightsHoldersMap.forEach(rh => {
        if (totalRevenueUSD > 0) {
          rh.global_share = (rh.total_received / totalRevenueUSD) * 100;
        }
      });

      const finalRightsHolders = Array.from(uniqueRightsHoldersMap.values())
        .sort((a, b) => Number(b.total_received || 0) - Number(a.total_received || 0));

      const total_revenue = projectId && projectId !== 'all' 
        ? (Number(activeProj?.total_revenue) || 0) / 100
        : totalRevenueUSD;

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

    } catch (error) {
      console.error('refreshDashboardData error:', error);
    }
  }, [projectId, isDemoMode]);

  // Initial load
  useEffect(() => {
    refreshDashboardData();
  }, [refreshDashboardData]);

  // Sync mode and wallet changes
  useEffect(() => {
    const onDemoChanged = () => {
      setIsDemoMode(localStorage.getItem('demo_mode') === 'true');
    };
    window.addEventListener('demo-mode-changed', onDemoChanged);
    
    const onWalletChanged = () => refreshDashboardData();
    window.addEventListener('wallet-changed', onWalletChanged);

    return () => {
      window.removeEventListener('demo-mode-changed', onDemoChanged);
      window.removeEventListener('wallet-changed', onWalletChanged);
    };
  }, [refreshDashboardData]);

  // ────────────────────────────────────────────────────────────────
  // ACTIONS
  // ────────────────────────────────────────────────────────────────

  const connectWallet = async () => {
    setTxStatus('idle');
    setErrorMessage('');
    try {
      await connectWalletUnified();
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to connect wallet');
      setTxStatus('error');
    }
  };

  const sendRevenue = async (amountEth) => {
    if (!isConnected || !projectId || projectId === 'all') {
      setTxStatus('error');
      setErrorMessage(!isConnected ? 'Wallet not connected' : 'Select a specific project before distributing revenue');
      return;
    }

    if (isDemoMode) {
      await sendRevenueDemoMode(amountEth);
    } else {
      await sendRevenueLiveMode(amountEth);
    }
  };

  const sendRevenueDemoMode = async (amountEth) => {
    let txHash = '';
    try {
      setTxStatus('pending');
      setErrorMessage('');
      if (!walletAddress) {
        throw new Error('Select a Hardhat demo wallet before distributing revenue');
      }

      const contractAddress = project?.contract_address || RevenueRightsABI?.address;
      if (!contractAddress || !RevenueRightsABI?.abi) {
        throw new Error('No local contract address found. Run npm run chain and npm run deploy:local first.');
      }

      const provider = new JsonRpcProvider(LOCAL_HARDHAT_RPC);
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== 31337) {
        throw new Error('Connected local RPC is not Hardhat chain 31337');
      }

      const signer = await provider.getSigner(walletAddress);
      const contract = new Contract(contractAddress, RevenueRightsABI.abi, signer);
      const tx = await contract.distributeRevenue({ value: parseEther(amountEth.toString()) });
      txHash = tx.hash;
      setLastTxHash(txHash);
      window.dispatchEvent(new CustomEvent('payment-pending', {
        detail: { projectId, txHash, amountEth, timestamp: Date.now() }
      }));

      await tx.wait();

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
      const message = err.message || 'Demo transaction failed';
      setErrorMessage(
        message.includes('ECONNREFUSED') || message.includes('connect') || message.includes('network')
          ? 'Local Hardhat node is not reachable. Start it with npm run chain, deploy with npm run deploy:local, then try again.'
          : message
      );
    }
  };

  const sendRevenueLiveMode = async (amountEth) => {
    let currentTxHash = '';
    try {
      setTxStatus('pending');
      setErrorMessage('');
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('No injected wallet provider found. Install or unlock MetaMask.');
      }

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const contractAddress = project?.contract_address || process.env.NEXT_PUBLIC_REVENUE_SPLITTER_ADDRESS || RevenueRightsABI.address;
      if (!contractAddress) {
        throw new Error('No contract address is configured for this project.');
      }

      const contract = new Contract(contractAddress, RevenueRightsABI.abi, signer);
      const value = parseEther(amountEth.toString());

      const tx = await contract.distributeRevenue({ value });
      currentTxHash = tx.hash;
      setLastTxHash(tx.hash);
      window.dispatchEvent(new CustomEvent('payment-pending', {
        detail: { projectId, txHash: tx.hash, amountEth, timestamp: Date.now() }
      }));

      // Initiate on backend
      await fetch(`${LIVE_API_BASE}/transactions/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          senderAddress: walletAddress,
          totalAmountEth: amountEth,
          txHash: tx.hash,
        }),
      });

      const receipt = await tx.wait();

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
      window.dispatchEvent(new CustomEvent('payment-recorded', {
        detail: { projectId, txHash: tx.hash, amountEth, timestamp: Date.now() }
      }));
      await refreshDashboardData();
    } catch (err) {
      console.error(err);
      setTxStatus('error');
      setErrorMessage(err.code === 'ACTION_REJECTED' ? 'Transaction cancelled' : err.message || 'Error occurred');
    }
  };

  const updateSplitOnChain = async (newRoster) => {
    if (!isConnected || !projectId) return;

    try {
      setTxStatus('pending');
      if (isDemoMode) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        for (const member of newRoster) {
          await supabaseDirect
            .from('project_contributors')
            .update({ revenue_share: member.revenue_share })
            .eq('id', member.id);
        }
      } else {
        const splitsClient = await getSplitsClient(window.ethereum);
        const recipients = newRoster.map(r => ({
          address: r.users?.wallet_address,
          percentAllocation: r.revenue_share
        }));
        const splitAddress = project?.contract_address;
        if (!splitAddress) throw new Error("No split address found");

        const response = await splitsClient.updateSplit({
          splitAddress,
          recipients,
          distributorFeePercent: 0,
        });
        setLastTxHash(response.event.transactionHash);

        for (const member of newRoster) {
          await supabaseDirect
            .from('project_contributors')
            .update({ revenue_share: member.revenue_share })
            .eq('id', member.id);
        }
      }
      setTxStatus('confirmed');
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
