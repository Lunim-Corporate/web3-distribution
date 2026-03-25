'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

declare global {
  interface Window {
    ethereum?: {
      request: (params: { method: string; params?: unknown[] }) => Promise<unknown>;
      on?: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}

interface WalletContextValue {
  account: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  chainId: number | null;
  balance: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: (chainId: string) => Promise<void>;
  sendTransaction: (to: string, value: string) => Promise<string>;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState<string | null>(null);

  // Check if wallet is already connected on load
  useEffect(() => {
    void checkConnection();
    setupEventListeners();
    // Dependencies are intentionally empty as this runs once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkConnection = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accountsUnknown = await window.ethereum.request({ method: 'eth_accounts' });
        const accounts = Array.isArray(accountsUnknown)
          ? accountsUnknown.filter((a) => typeof a === 'string') as string[]
          : [];
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
          await getChainId();
          await getBalance(accounts[0]);
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    }
  };

  const setupEventListeners = () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on?.('accountsChanged', handleAccountsChanged);
      window.ethereum.on?.('chainChanged', handleChainChanged);
      window.ethereum.on?.('disconnect', handleDisconnect);
    }
  };

  const handleAccountsChanged = (...args: unknown[]) => {
    const accounts = Array.isArray(args[0]) ? (args[0] as unknown[]).filter((a): a is string => typeof a === 'string') : [];
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      setAccount(accounts[0]);
      getBalance(accounts[0]);
    }
  };

  const handleChainChanged = (...args: unknown[]) => {
    const chainIdHex = typeof args[0] === 'string' ? args[0] : '';
    setChainId(parseInt(chainIdHex, 16));
    window.location.reload(); // Recommended by MetaMask
  };

  const handleDisconnect = (..._args: unknown[]) => {
    void _args;
    disconnectWallet();
  };

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      toast.error('MetaMask is not installed. Please install MetaMask to continue.');
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    setIsConnecting(true);
    try {
      const accountsUnknown = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      const accounts = Array.isArray(accountsUnknown)
        ? accountsUnknown.filter((a) => typeof a === 'string') as string[]
        : [];

      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setIsConnected(true);
        await getChainId();
        await getBalance(accounts[0]);
        toast.success('Wallet connected successfully!');
      }
    } catch (error) {
      const err = error as { code?: number; message?: string };
      console.error('Error connecting wallet:', err);
      if (err.code === 4001) {
        toast.error('Connection rejected by user');
      } else {
        toast.error('Failed to connect wallet');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setIsConnected(false);
    setChainId(null);
    setBalance(null);
    toast.success('Wallet disconnected');
  };

  const getChainId = async () => {
    try {
      if (!window.ethereum) return;
      const chainIdRaw = await window.ethereum.request({ method: 'eth_chainId' });
      const chainIdHex = typeof chainIdRaw === 'string' ? chainIdRaw : '0x0';
      setChainId(parseInt(chainIdHex, 16));
    } catch (error) {
      console.error('Error getting chain ID:', error);
    }
  };

  const getBalance = async (address: string) => {
    try {
      if (!window.ethereum) return;
      const balanceRaw = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      });
      // Convert from wei to ETH
      const balanceHex = typeof balanceRaw === 'string' ? balanceRaw : '0x0';
      const ethBalance = (parseInt(balanceHex, 16) / Math.pow(10, 18)).toFixed(4);
      setBalance(ethBalance);
    } catch (error) {
      console.error('Error getting balance:', error);
    }
  };

  const switchNetwork = async (targetChainId: string) => {
    try {
      if (!window.ethereum) throw new Error('MetaMask not detected');
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetChainId }],
      });
    } catch (error) {
      const err = error as { code?: number; message?: string };
      if (err.code === 4902) {
        // Network not added to MetaMask
        toast.error('Please add this network to MetaMask first');
      } else {
        toast.error('Failed to switch network');
      }
      throw error;
    }
  };

  const sendTransaction = async (to: string, value: string): Promise<string> => {
    if (!account) throw new Error('No account connected');
    if (!window.ethereum) throw new Error('MetaMask not detected');

    try {
      const txHashRaw = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: account,
          to,
          value: `0x${(parseFloat(value) * Math.pow(10, 18)).toString(16)}`, // Convert ETH to wei
        }],
      });
      if (typeof txHashRaw !== 'string') throw new Error('Transaction hash missing');
      return txHashRaw;
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  };

  const getNetworkName = (chainId: number | null): string => {
    switch (chainId) {
      case 1: return 'Ethereum Mainnet';
      case 5: return 'Goerli Testnet';
      case 137: return 'Polygon Mainnet';
      case 80001: return 'Polygon Mumbai';
      case 56: return 'BSC Mainnet';
      case 97: return 'BSC Testnet';
      default: return 'Unknown Network';
    }
  };

  const value = {
    account,
    isConnected,
    isConnecting,
    chainId,
    balance,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    sendTransaction,
    getNetworkName,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
}

// Network configurations
export const NETWORKS = {
  ethereum: {
    chainId: '0x1',
    chainName: 'Ethereum Mainnet',
    rpcUrls: ['https://mainnet.infura.io/v3/'],
    blockExplorerUrls: ['https://etherscan.io/'],
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  },
  polygon: {
    chainId: '0x89',
    chainName: 'Polygon Mainnet',
    rpcUrls: ['https://polygon-rpc.com/'],
    blockExplorerUrls: ['https://polygonscan.com/'],
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
  },
  mumbai: {
    chainId: '0x13881',
    chainName: 'Polygon Mumbai',
    rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
    blockExplorerUrls: ['https://mumbai.polygonscan.com/'],
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
  },
};
