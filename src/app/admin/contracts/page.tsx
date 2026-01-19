'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { ethers } from 'ethers';
import { useAuth } from '@/lib/auth';
import { CONTRACT_ADDRESSES, FEATURE_FLAGS, getNetworkConfig } from '@/lib/contracts';
import { Project } from '@/lib/types';

type ContractRow = {
  id: string;
  name: string;
  address: string;
  network: string;
};

export default function AdminContractsPage() {
  const { user, isReady } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkStatus, setCheckStatus] = useState<Record<string, string>>({});

  const loadContracts = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error('Failed to load projects');
      const data = await res.json();
      setProjects(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load contracts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isReady) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    loadContracts();
  }, [user, isReady, router]);

  const rpcUrl = getNetworkConfig(FEATURE_FLAGS.DEFAULT_NETWORK).rpcUrl;
  const hasRpc = !!rpcUrl && !rpcUrl.endsWith('/v3/');

  const contracts: ContractRow[] = useMemo(() => {
    const configured = Object.entries(CONTRACT_ADDRESSES[FEATURE_FLAGS.DEFAULT_NETWORK]).map(
      ([name, address]) => ({
        id: `${FEATURE_FLAGS.DEFAULT_NETWORK}_${name}`,
        name,
        address,
        network: FEATURE_FLAGS.DEFAULT_NETWORK,
      })
    );
    const projectContracts = projects
      .filter(p => p.contractAddress)
      .map(p => ({
        id: p.id,
        name: `${p.name} Contract`,
        address: p.contractAddress || '',
        network: FEATURE_FLAGS.DEFAULT_NETWORK,
      }));
    const combined = [...configured, ...projectContracts];
    const seen = new Set<string>();
    return combined.filter(c => {
      if (!c.address) return false;
      const key = c.address.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [projects]);

  if (!isReady || !user || user.role !== 'admin') return null;

  const copyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      toast.success('Address copied');
    } catch {
      toast.error('Unable to copy address');
    }
  };

  const checkDeployment = async (row: ContractRow) => {
    if (!row.address) {
      toast.error('No address to check');
      return;
    }

    if (!hasRpc) {
      setCheckStatus(prev => ({ ...prev, [row.id]: 'RPC not configured; cannot verify' }));
      return;
    }

    setCheckStatus(prev => ({ ...prev, [row.id]: 'Checking...' }));
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const code = await provider.getCode(row.address);
      setCheckStatus(prev => ({
        ...prev,
        [row.id]: code && code !== '0x' ? 'Deployed' : 'No code found',
      }));
    } catch (err: any) {
      setCheckStatus(prev => ({ ...prev, [row.id]: `Check failed: ${err.message}` }));
    }
  };

  return (
    <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Contracts</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Oversee and review contract templates and agreements.
          </p>
        </div>

        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <p className="text-gray-600 dark:text-gray-400">Loading contracts...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 rounded-lg p-4">
            <p className="font-semibold">Error</p>
            <p className="text-sm">{error}</p>
            <button
              onClick={loadContracts}
              className="mt-3 px-4 py-2 text-sm font-medium bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100 rounded-lg"
            >
              Retry
            </button>
          </div>
        ) : contracts.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <p className="text-gray-600 dark:text-gray-400">No contract addresses configured.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Network
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {contracts.map(contract => (
                    <tr key={contract.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {contract.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-700 dark:text-gray-300">
                        {contract.address}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 capitalize">
                        {contract.network}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                        <button
                          onClick={() => copyAddress(contract.address)}
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Copy Address
                        </button>
                        <button
                          onClick={() => checkDeployment(contract)}
                          className="text-green-600 dark:text-green-400 hover:underline"
                        >
                          Check Deployment
                        </button>
                        {checkStatus[contract.id] && (
                          <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {checkStatus[contract.id]}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
    </div>
  );
}
