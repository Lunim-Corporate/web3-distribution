'use client';
import React, { useState, useEffect } from 'react';
import { useRevenueContract } from '../hooks/useRevenueContract';
import { ethers } from 'ethers';

const getDeterministicWallet = (index: number) => {
    // skip account 0 as it's the payer
    const path = "m/44'/60'/0'/0/" + (index + 1);
    const wallet = ethers.HDNodeWallet.fromPhrase("test test test test test test test test test test test junk", "", path);
    return wallet.address;
};

export function RevenueDistribution() {
  const {
    isConnected,
    walletAddress,
    connectWallet,
    connectLocalDemo,
    sendProjectRevenue,
    getLiveBalances,
    txStatus,
    lastTxHash,
    errorText,
  } = useRevenueContract();

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [rightsHolders, setRightsHolders] = useState([]);
  const [balances, setBalances] = useState({});
  const [distributeAmount, setDistributeAmount] = useState('1');
  const [highlightedWallets, setHighlightedWallets] = useState({});
  const [prevBalances, setPrevBalances] = useState({});
  const [txHistory, setTxHistory] = useState([]);

  // Fetch all projects initially
  useEffect(() => {
    fetch('/api/projects', { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setProjects(data);
        if (data.length > 0 && !selectedProjectId) {
           setSelectedProjectId(data[0].id);
        }
      })
      .catch(console.error);
  }, []);

  // Fetch specific project details
  useEffect(() => {
    if (!selectedProjectId) return;
    fetch(`/api/projects/${selectedProjectId}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(json => {
        const pr = json.data;
        if (!pr || !pr.project_contributors) return;
        
        const mapped = pr.project_contributors.map((pc, idx) => ({
           id: pc.id,
           name: pc.users?.name || pc.users?.email || 'Unknown',
           role: pc.role,
           percentage: Math.round(Number(pc.revenue_share) * 100), // bps
           wallet: getDeterministicWallet(idx)
        }));
        setRightsHolders(mapped);
      })
      .catch(console.error);
  }, [selectedProjectId]);

  const refreshBalances = async () => {
    if (rightsHolders.length === 0) return;
    const addresses = rightsHolders.map(h => h.wallet);
    const newBalances = await getLiveBalances(addresses);
    setBalances(newBalances);
  };

  useEffect(() => {
    if (isConnected && rightsHolders.length > 0) {
      refreshBalances();
    }
  }, [isConnected, rightsHolders]);

  useEffect(() => {
    const updatedWallets = {};
    const newTxDetails = [];
    let changed = false;

    for (const [wallet, currentBal] of Object.entries(balances)) {
      const prevBal = prevBalances[wallet];
      if (prevBal && prevBal !== "0" && currentBal !== prevBal) {
        updatedWallets[wallet] = true;
        changed = true;
        
        const diff = Number(currentBal) - Number(prevBal);
        const holder = rightsHolders.find(h => h.wallet === wallet);
        if (holder) {
          newTxDetails.push({
            name: holder.name,
            role: holder.role,
            received: diff.toFixed(4)
          });
        }
      }
    }

    if (changed) {
      setHighlightedWallets(updatedWallets);
      if (newTxDetails.length > 0) {
        setTxHistory(newTxDetails);
      }
      setTimeout(() => setHighlightedWallets({}), 4000);
      
      // Auto-refresh main dashboard components if applicable
      const event = new CustomEvent('payment-recorded');
      window.dispatchEvent(event);
    }

    if (Object.keys(balances).length > 0) {
      setPrevBalances(balances);
    }
  }, [balances, rightsHolders]);

  const handleSend = async () => {
    if (!distributeAmount || Number(distributeAmount) <= 0 || rightsHolders.length === 0) return;
    const recipients = rightsHolders.map(h => h.wallet);
    const roles = rightsHolders.map(h => h.name); // passing real names
    const bps = rightsHolders.map(h => h.percentage);
    
    // validate total BPS
    const sum = bps.reduce((a, b) => a + b, 0);
    if (sum !== 10000) {
      alert(`Error: Total revenue share is ${sum/100}%, must be 100% (10000 bps).`);
      return;
    }

    const success = await sendProjectRevenue(distributeAmount, recipients, roles, bps, selectedProjectId);
    if (success) {
      // Refresh balances with exponential backoff or simple delay
      setTimeout(refreshBalances, 1000);
      setTimeout(refreshBalances, 3000);
    }
  };

  const getPreviewAmount = (percentage: number) => {
    if (!distributeAmount || isNaN(distributeAmount)) return "0.00";
    return ((Number(distributeAmount) * percentage) / 10000).toFixed(4);
  };

  return (
    <div className="w-full mb-8" id="web3-distribution">
      <header className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6 space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold text-indigo-900 dark:text-indigo-400">LUNIM Web3 Splitter</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Production-Linked Smart Contract Distribution</p>
        </div>
        <div className="flex gap-2">
          {!isConnected ? (
            <>
              <button 
                onClick={connectLocalDemo}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-md hover:shadow-lg"
              >
                Connect System Base
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-lg">
              <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-mono text-sm text-indigo-800 font-semibold">Router Connected</span>
            </div>
          )}
        </div>
      </header>

      {errorText && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-8 rounded-r">
          <p className="font-bold">Error</p>
          <p>{errorText}</p>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
             <label className="block text-sm font-semibold text-gray-600 mb-2">Target Project</label>
             <select 
               value={selectedProjectId}
               onChange={(e) => setSelectedProjectId(e.target.value)}
               className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 font-medium text-gray-800"
             >
               {projects.map(p => (
                 <option key={p.id} value={p.id}>{p.name}</option>
               ))}
             </select>
          </div>
      </div>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Distribute Revenue</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-600 mb-2">Total Amount (ETH)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 font-bold">Ξ</span>
                </div>
                <input
                  type="number"
                  value={distributeAmount}
                  onChange={(e) => setDistributeAmount(e.target.value)}
                  className="pl-10 w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 py-3 text-lg font-mono font-medium"
                  placeholder="1.0"
                />
              </div>
            </div>

            <button
              onClick={handleSend}
              disabled={!isConnected || txStatus === 'pending' || rightsHolders.length === 0}
              className={`w-full py-4 px-6 rounded-lg font-bold text-white shadow-md transition-all ${
                (!isConnected || rightsHolders.length === 0)
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : txStatus === 'pending'
                    ? 'bg-indigo-400 cursor-wait'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 hover:shadow-lg transform hover:-translate-y-0.5'
              }`}
            >
              {txStatus === 'pending' ? 'Syncing with Ledger...' : 'Execute & Sync Split'}
            </button>

            {txStatus !== 'idle' && (
              <div className="mt-6 p-4 rounded-lg bg-gray-50 border border-gray-200">
                <div className="flex items-center mb-2">
                  <span className="font-semibold text-gray-700 mr-2">Status:</span>
                  <span className={`font-bold uppercase text-xs px-2 py-1 rounded ${
                    txStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                    txStatus === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {txStatus}
                  </span>
                </div>
                {lastTxHash && (
                  <div className="text-sm text-gray-500 mt-2 truncate">
                    Hash: <a href={`https://etherscan.io/tx/${lastTxHash}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">{lastTxHash.substring(0, 15)}...</a>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Preview Split</h2>
            <div className="space-y-3">
              {rightsHolders.length === 0 && <p className="text-gray-500 text-sm">Loading project contributors...</p>}
              {rightsHolders.map((h, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <div className="font-medium text-gray-700 truncate pr-2" title={h.name}>{h.name}</div>
                  <div className="text-indigo-600 font-mono font-bold whitespace-nowrap">+ {getPreviewAmount(h.percentage)} ETH</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Contributors & Live Wallets</h2>
              <button 
                onClick={refreshBalances} 
                disabled={!isConnected}
                className="text-sm text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1 rounded-full font-medium"
              >
                Refresh ETH Nodes
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rightsHolders.length === 0 && <p className="text-gray-500 text-sm col-span-2">No contributors found for this project.</p>}
              {rightsHolders.map((holder, idx) => {
                const bal = balances[holder.wallet] || "0";
                const isHighlighted = highlightedWallets[holder.wallet];
                
                return (
                  <div 
                    key={idx} 
                    className={`p-5 rounded-xl border transition-colors duration-[1500ms] shadow-sm flex flex-col justify-between ${
                      isHighlighted ? 'bg-green-50 border-green-300' : 'bg-white border-gray-100'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="font-bold text-gray-900 text-lg truncate" title={holder.name}>{holder.name}</div>
                        <div className="text-sm font-medium text-gray-500 flex items-center mt-1 truncate">
                          {holder.role}
                        </div>
                      </div>
                      <div className="bg-indigo-100 text-indigo-800 py-1 px-3 rounded-full text-xs font-black shadow-sm flex-shrink-0">
                        {holder.percentage / 100}%
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex justify-between items-center mb-1">
                        <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Node Balance</div>
                        <div className="text-[10px] text-gray-300 font-mono tracking-tighter" title={holder.wallet}>
                          {holder.wallet.substring(0,6)}...{holder.wallet.substring(38)}
                        </div>
                      </div>
                      <div className={`text-2xl font-mono font-bold ${isHighlighted ? 'text-green-600' : 'text-gray-800'}`}>
                        {Number(bal).toFixed(4)} ETH
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {txHistory.length > 0 && (
            <div className="bg-indigo-900 p-6 rounded-xl shadow-lg border border-indigo-800 text-white animate-fade-in">
              <h2 className="text-xl font-bold mb-4 text-indigo-100">Last Distribution Synchronized</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-indigo-700 text-indigo-300">
                      <th className="pb-3 pt-2 font-semibold">Recipient Code</th>
                      <th className="pb-3 pt-2 font-semibold">Database Role</th>
                      <th className="pb-3 pt-2 text-right font-semibold">Amount Received</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txHistory.map((row, i) => (
                      <tr key={i} className="border-b border-indigo-800 hover:bg-indigo-800/50">
                        <td className="py-3 font-medium">{row.name}</td>
                        <td className="py-3 text-indigo-200">{row.role}</td>
                        <td className="py-3 text-right font-mono text-green-400 font-bold">+{row.received} ETH</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
