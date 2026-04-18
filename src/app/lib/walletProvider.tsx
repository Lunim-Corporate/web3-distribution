'use client';

/**
 * Web3ModalProvider — wraps the app to initialize the Web3Modal singleton.
 *
 * By importing `./web3modal`, the `createWeb3Modal()` call runs once at module
 * load time.  The hook re-exports (useWeb3ModalAccount, useWeb3ModalProvider,
 * useWeb3Modal) are then available in any descendant component.
 *
 * This replaces the old stub `walletProvider.tsx` and the raw MetaMask-only
 * `WalletProvider` in `wallet.tsx`.
 */
import React from 'react';

// Side-effect import: boots the Web3Modal singleton
import './web3modal';

export function Web3ModalBootstrap({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}