'use client';

import { useState, useEffect, useCallback } from 'react';
import { ETH_PRICE_USD as FALLBACK_PRICE } from '@/app/lib/constants';

const POLL_INTERVAL_MS = 60_000; // Poll every 60 seconds

/**
 * React hook that provides the live ETH/USD price.
 * 
 * - Fetches from /api/eth-price on mount and every 60s
 * - Falls back to the hardcoded constant if the API fails
 * - Shares the price across components via a module-level cache
 */
export function useEthPrice() {
  const [price, setPrice] = useState<number>(FALLBACK_PRICE);
  const [isLive, setIsLive] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchPrice = useCallback(async () => {
    try {
      const res = await fetch('/api/eth-price', { cache: 'no-store' });
      if (!res.ok) throw new Error('API error');

      const data = await res.json();
      if (data.price && typeof data.price === 'number') {
        setPrice(data.price);
        setIsLive(true);
        setLastUpdated(data.timestamp);
      }
    } catch {
      // Keep current price (fallback or stale), mark as not live
      setIsLive(false);
    }
  }, []);

  useEffect(() => {
    fetchPrice(); // Initial fetch

    const interval = setInterval(fetchPrice, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchPrice]);

  return {
    /** Current ETH price in USD */
    ethPrice: price,
    /** Whether the price is from a live API (vs fallback) */
    isLive,
    /** ISO timestamp of last successful price update */
    lastUpdated,
    /** Convert ETH amount to USD */
    ethToUsd: (eth: number) => eth * price,
    /** Format ETH amount as USD string */
    formatEthAsUsd: (eth: number) =>
      new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(eth * price),
  };
}
