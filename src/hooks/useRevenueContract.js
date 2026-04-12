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

// ------------------------------------------------------------------
// Supabase client for direct writes in Demo Mode
// ------------------------------------------------------------------
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseDirect = createClient(supabaseUrl, supabaseAnonKey);

// ------------------------------------------------------------------
// Optional: Live mode imports (won't crash if unavailable)
// ------------------------------------------------------------------
let BrowserProvider, Contract, parseEther, formatEther, Interface;
let RevenueRightsABI = null;

try {
  const ethers = require('ethers');
  BrowserProvider = ethers.BrowserProvider;
  Contract = ethers.Contract;
  parseEther = ethers.parseEther;
  formatEther = ethers.formatEther;
  Interface = ethers.Interface;
} catch (e) {
  console.warn('ethers.js not available — Demo Mode only');
}

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
  const [project, setProject] = useState(null);
  const [rightsHolders, setRightsHolders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [txStatus, setTxStatus] = useState('idle'); // 'idle'|'pending'|'confirmed'|'error'
  const [lastTxHash, setLastTxHash] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(true); // Start in demo, upgrade to live if possible

  const modeChecked = useRef(false);

  // ────────────────────────────────────────────────────────────────
  // Detect mode on mount — and auto-connect in Demo Mode
  // ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (modeChecked.current) return;
    modeChecked.current = true;
    isLiveModeAvailable().then((live) => {
      setIsDemoMode(!live);
      if (live) {
        console.log('🟢 Moonstone: Live Mode (MetaMask + Hardhat)');
      } else {
        console.log('🟡 Moonstone: Demo Mode — auto-connecting simulated wallet');
        // AUTO-CONNECT: generate a demo wallet address immediately
        // so the user can distribute without clicking "Connect"
        const demoAddr = '0x' + Array.from({ length: 40 }, () =>
          '0123456789abcdef'[Math.floor(Math.random() * 16)]
        ).join('');
        setWalletAddress(demoAddr);
        setIsConnected(true);
      }
    });
  }, []);

  // ────────────────────────────────────────────────────────────────
  // Data refresh — works for BOTH modes
  // ────────────────────────────────────────────────────────────────
  const refreshDashboardData = useCallback(async () => {
    if (!projectId) return;

    // Always try Express first (Live Mode), fall back to direct Supabase
    let data = null;

    if (!isDemoMode) {
      try {
        const res = await fetch(`${LIVE_API_BASE}/projects/${projectId}`);
        if (res.ok) {
          data = await res.json();
        }
      } catch {
        // Fall through to Supabase
      }
    }

    if (!data) {
      // Direct Supabase fetch (Demo Mode or Express unavailable)
      try {
        const { data: proj, error: pErr } = await supabaseDirect
          .from('projects')
          .select('*, project_contributors(id, user_id, role, revenue_share, users(name, wallet_address))')
          .eq('id', projectId)
          .single();

        if (pErr) throw pErr;

        // Map to the shape the dashboard expects
        const userToRhMap = {};
        const rights_holders = (proj.project_contributors || []).map((c) => {
          const rh = {
            id: c.id,
            user_id: c.user_id,
            name: c.users?.name || 'Unknown',
            role: c.role,
            wallet_address: c.users?.wallet_address || '',
            percentage: c.revenue_share,
            total_received: 0,
          };
          if (c.user_id) userToRhMap[c.user_id] = rh;
          return rh;
        });

        // Fetch payments
        const { data: payments } = await supabaseDirect
          .from('payments')
          .select('id, user_id, amount, tx_hash, status, created_at')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false });

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
              total_amount: 0,
              transaction_splits: [],
            };
          }
          // DB stores cents — convert to USD for display
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

        data = {
          ...proj,
          total_distributed: proj.total_revenue,
          rights_holders,
          transactions: Object.values(txMap),
        };
      } catch (err) {
        console.error('Data refresh error:', err);
        return;
      }
    }

    if (data) {
      setProject(data);
      setRightsHolders(data.rights_holders || []);
      setTransactions(data.transactions || []);
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
      // Demo Mode: simulate a wallet address
      const demoAddr = '0x' + Array.from({ length: 40 }, () =>
        '0123456789abcdef'[Math.floor(Math.random() * 16)]
      ).join('');
      setWalletAddress(demoAddr);
      setIsConnected(true);
      return;
    }

    // Live Mode: MetaMask
    if (typeof window.ethereum === 'undefined') {
      setErrorMessage('Please install MetaMask to continue');
      setTxStatus('error');
      return;
    }

    try {
      const provider = new BrowserProvider(window.ethereum);

      // Check network
      const network = await provider.getNetwork();
      if (network.chainId !== 31337n) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x7A69' }],
          });
        } catch {
          setErrorMessage('Please switch to Hardhat Network (Chain ID 31337)');
          setTxStatus('error');
          return;
        }
      }

      const accounts = await provider.send('eth_requestAccounts', []);
      setWalletAddress(accounts[0]);
      setIsConnected(true);
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

      // Calculate USD value
      const totalUSD = Number(amountEth) * ETH_USD_RATE;

      // Fetch current rights holders from Supabase
      const { data: contributors, error: cErr } = await supabaseDirect
        .from('project_contributors')
        .select('id, user_id, role, revenue_share, users(name)')
        .eq('project_id', projectId);

      if (cErr) throw new Error(`Failed to load contributors: ${cErr.message}`);
      if (!contributors || contributors.length === 0) throw new Error('No rights holders found for this project');

      // Insert a payment row per rights holder
      // IMPORTANT: Store amount in CENTS so /api/revenue and /api/activities
      // can divide by 100 consistently to get the correct USD display.
      const paymentRows = contributors.map((c) => {
        const shareUSD = (Number(c.revenue_share) / 100) * totalUSD;
        const shareInCents = Math.round(shareUSD * 100);
        return {
          project_id: projectId,
          user_id: c.user_id,
          amount: shareInCents,
          tx_hash: txHash,
          status: 'completed',
          source: 'Smart Contract',
          split_percentage: c.revenue_share,
        };
      });

      const { error: insertErr } = await supabaseDirect.from('payments').insert(paymentRows);
      if (insertErr) throw new Error(`Payment insert failed: ${insertErr.message}`);

      // Update project total_revenue (also in cents for consistency)
      const { data: currentProject } = await supabaseDirect
        .from('projects')
        .select('total_revenue')
        .eq('id', projectId)
        .single();

      const totalCents = Math.round(totalUSD * 100);
      const newTotal = Number(currentProject?.total_revenue || 0) + totalCents;
      await supabaseDirect
        .from('projects')
        .update({ total_revenue: newTotal })
        .eq('id', projectId);

      // Mark confirmed
      setTxStatus('confirmed');

      // Fire payment-recorded event so ALL dashboard components refresh
      // (RecentActivity, RevenueSnapshot, ChartsPanel all listen for this)
      window.dispatchEvent(new CustomEvent('payment-recorded', {
        detail: { projectId, txHash, totalUSD, timestamp: Date.now() }
      }));

      // Refresh contract-backed data (rights holders, transactions list)
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

  return {
    project,
    rightsHolders,
    transactions,
    isConnected,
    walletAddress,
    connectWallet,
    sendRevenue,
    txStatus,
    lastTxHash,
    errorMessage,
    isDemoMode,
    refreshDashboardData,
  };
}
