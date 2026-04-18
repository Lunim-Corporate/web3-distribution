'use client';

import { useState, useEffect } from 'react';
import { SplitsClient } from '@0xsplits/splits-sdk';
import { getSplitsClient } from '@/lib/web3/client';
import { getUserEarnings, UserEarnings } from '@/lib/web3/subgraph';

export const useSplits = (address?: string) => {
  const [client, setClient] = useState<SplitsClient | null>(null);
  const [earnings, setEarnings] = useState<UserEarnings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initClient = async () => {
      try {
        const splitsClient = await getSplitsClient();
        setClient(splitsClient);
      } catch (err) {
        console.error('Failed to init Splits client:', err);
      }
    };
    initClient();
  }, []);

  useEffect(() => {
    if (!address) return;

    const fetchEarnings = async () => {
      setLoading(true);
      try {
        const data = await getUserEarnings(address);
        setEarnings(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch earnings'));
      } finally {
        setLoading(false);
      }
    };

    fetchEarnings();
  }, [address]);

  const [withdrawalStatus, setWithdrawalStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');

  const withdraw = async () => {
    if (!address || !client) return;
    setWithdrawalStatus('pending');
    try {
      // 0xSplits withdrawal logic
      // Note: In 0xSplits v1, you withdraw from SplitMain
      // The SDK provides a high-level withdraw method
      const response = await client.withdraw({
        address,
        tokens: ['0x0000000000000000000000000000000000000000'], // ETH
      });
      setWithdrawalStatus('success');
      return response;
    } catch (err) {
      console.error('Withdrawal failed:', err);
      setWithdrawalStatus('error');
      throw err;
    }
  };

  return {
    client,
    earnings,
    loading,
    error,
    withdrawalStatus,
    withdraw,
    refreshBalances: async () => {
      if (address) {
        const data = await getUserEarnings(address);
        setEarnings(data);
      }
    }
  };
};

export default useSplits;
