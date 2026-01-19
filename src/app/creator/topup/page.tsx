'use client';

import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { CreatorLayout } from '@/components/layouts/CreatorLayout';
import { Project, TopUp } from '@/lib/types';
import { useWallet } from '@/lib/wallet';
import { toast } from 'react-hot-toast';
import { getTxExplorerUrl } from '@/lib/tx';

export default function CreatorTopUpPage() {
  const { user, isReady } = useAuth();
  const router = useRouter();
  const { account, isConnected, isConnecting, connectWallet } = useWallet();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [amount, setAmount] = useState('0.1');
  const [currency, setCurrency] = useState('ETH');
  const [loading, setLoading] = useState(false);
  const [topups, setTopups] = useState<TopUp[]>([]);

  const loadTopUps = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/topups');
      if (!res.ok) return;
      const data = await res.json();
      const filtered = data.filter((t: TopUp) => t.creatorUserId === user.id);
      setTopups(filtered);
    } catch {
      setTopups([]);
    }
  };

  useEffect(() => {
    if (!isReady) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    fetch('/api/projects')
      .then((res) => res.json())
      .then((data: Project[]) => {
        const creatorProjects = data.filter((p) => p.creatorId === user.id);
        setProjects(creatorProjects);
      })
      .catch(() => setProjects([]));
    loadTopUps();
  }, [user, isReady, router]);

  if (!isReady || !user || (user.role !== 'creator' && user.role !== 'admin')) {
    return null;
  }

  const walletAddress = account || '';
  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
    } catch (error) {
      console.error(error);
    }
  };

  const handleTopUp = async () => {
    if (!walletAddress || !isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!selectedProjectId) {
      toast.error('Select a project to top up');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      if (!window.ethereum) {
        toast.error('MetaMask is not available');
        return;
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();
      const toAddress = selectedProject?.contractAddress && ethers.isAddress(selectedProject.contractAddress)
        ? selectedProject.contractAddress
        : walletAddress;
      if (!selectedProject?.contractAddress) {
        toast('No project contract address set. Sending to your wallet as escrow.', { icon: '⚠️' });
      }
      const tx = await signer.sendTransaction({
        to: toAddress,
        value: ethers.parseEther(parsedAmount.toString()),
      });
      const receipt = await tx.wait();

      await fetch('/api/topups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProjectId,
          projectName: selectedProject?.name || 'Project',
          creatorUserId: user.id,
          amount: parsedAmount,
          currency,
          chainId: Number(network.chainId),
          txHash: receipt?.hash || tx.hash,
          createdAt: new Date().toISOString(),
        }),
      });
      toast.success(`Top-up confirmed! Tx: ${receipt?.hash || tx.hash}`);
      await loadTopUps();
    } catch (error) {
      toast.error('Failed to top up');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CreatorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Top Up
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Add funds to a project wallet using your connected account.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Up Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Wallet Connection */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Wallet Address
              </h3>
              {isConnected && walletAddress ? (
                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <span className="text-2xl">✅</span>
                  <div className="flex-1">
                    <p className="font-medium text-green-900 dark:text-green-100">
                      Wallet Connected
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300 font-mono">
                      {walletAddress.slice(0, 10)}...{walletAddress.slice(-8)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-gray-600 dark:text-gray-400">
                    Connect your wallet to receive funds.
                  </p>
                  <button
                    onClick={handleConnectWallet}
                    disabled={isConnecting}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  >
                    {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Select Project
              </h3>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Choose a project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount and Currency */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Amount
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Amount
                    </label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Currency
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="ETH">ETH</option>
                      <option value="MATIC">MATIC</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={handleTopUp}
                  disabled={loading || !walletAddress || !selectedProjectId}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : `Top Up ${amount} ${currency}`}
                </button>
              </div>
            </div>
          </div>

          {/* Recent Top-Ups */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Recent Top-Ups
              </h3>
              {topups.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  No recent top-ups.
                </p>
              ) : (
                <div className="space-y-3">
                  {topups.slice(0, 6).map(topup => (
                    <div
                      key={topup.id}
                      className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {topup.amount} {topup.currency}
                        </span>
                        <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Confirmed
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Project: {topup.projectName}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {(() => {
                          const txUrl = getTxExplorerUrl(topup.chainId, topup.txHash);
                          if (txUrl) {
                            return (
                              <a
                                href={txUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                View tx
                              </a>
                            );
                          }
                          return topup.txHash ? (
                            <span className="font-mono">{topup.txHash.slice(0, 10)}...</span>
                          ) : (
                            <span className="text-gray-400">Tx pending</span>
                          );
                        })()}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {new Date(topup.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </CreatorLayout>
  );
}
