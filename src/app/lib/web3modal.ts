'use client';

import { createWeb3Modal, defaultConfig } from '@web3modal/ethers/react';

// 1. Get projectId from WalletConnect Cloud — https://cloud.walletconnect.com
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo';

// 2. Set metadata for your dApp
const metadata = {
  name: 'LUNIM Platform',
  description: 'Automated & transparent revenue distribution for creative projects',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://lunim.io',
  icons: ['/favicon.ico'],
};

// 3. Define supported chains
const mainnet = {
  chainId: 1,
  name: 'Ethereum',
  currency: 'ETH',
  explorerUrl: 'https://etherscan.io',
  rpcUrl: 'https://cloudflare-eth.com',
};

const sepolia = {
  chainId: 11155111,
  name: 'Sepolia Testnet',
  currency: 'ETH',
  explorerUrl: 'https://sepolia.etherscan.io',
  rpcUrl: 'https://rpc.sepolia.org',
};

const baseSepolia = {
  chainId: 84532,
  name: 'Base Sepolia',
  currency: 'ETH',
  explorerUrl: 'https://sepolia.basescan.org',
  rpcUrl: 'https://sepolia.base.org',
};

const hardhat = {
  chainId: 31337,
  name: 'Hardhat Localhost',
  currency: 'ETH',
  explorerUrl: '',
  rpcUrl: 'http://127.0.0.1:8545',
};

// 4. Create ethersConfig
const ethersConfig = defaultConfig({
  metadata,
  enableEIP6963: true,   // MetaMask, Rabby, Coinbase auto-detect
  enableInjected: true,   // window.ethereum fallback
  enableCoinbase: true,   // Coinbase Wallet
});

// 5. Create modal instance (singleton — safe to call at module scope)
createWeb3Modal({
  ethersConfig,
  chains: [baseSepolia, mainnet, hardhat],
  projectId,
  enableAnalytics: false,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#7c3aed',           // violet-600 brand
    '--w3m-border-radius-master': '12px',
  },
});

/**
 * Re-exported hooks from @web3modal/ethers/react:
 *
 *   useWeb3ModalAccount()   → { address, chainId, isConnected }
 *   useWeb3ModalProvider()  → { walletProvider }  (an EIP-1193 provider)
 *   useWeb3Modal()          → { open, close }     (programmatic modal control)
 *
 * Import them from '@web3modal/ethers/react' in consuming components.
 * This module exists solely to bootstrap the modal at app-load time.
 */
export {};
