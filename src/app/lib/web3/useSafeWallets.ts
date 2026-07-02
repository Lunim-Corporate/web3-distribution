'use client';

import { useWallets } from '@privy-io/react-auth';

export type SafeWallet = any;

export function useSafeWallets(): {
  wallets: any[];
  ready: boolean;
} {
  try {
    const result = useWallets();
    return { wallets: result.wallets || [], ready: result.ready || false };
  } catch {
    return { wallets: [], ready: false };
  }
}
