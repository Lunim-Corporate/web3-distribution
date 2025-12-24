'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { WalletService } from './services/WalletService';
import { WalletInfo } from './services/types';

declare global {
  interface Window {
    ethereum?: any;
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
  getNetworkName: (chainId: number | null) => string;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const walletService = WalletService.getInstance();

  useEffect(() => {
    checkConnection();
    setupEventListeners();
  }, []);

  const checkConnection = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await walletService.getAccounts();
        if (accounts.length > 0) {
          const walletInfo = await walletService.getWalletInfo();
          updateWalletState(walletInfo);
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    }
  };

  const updateWalletState = (walletInfo: WalletInfo) => {
    setAccount(walletInfo.address);
    setIsConnected(walletInfo.isConnected);
    setChainId(walletInfo.chainId);
    setBalance(walletInfo.balance);
  };

  const setupEventListeners = () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('disconnect', handleDisconnect);
    }
  };

  const handleAccountsChanged = async (accounts: string[]) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      try {
        const walletInfo = await walletService.getWalletInfo();
        updateWalletState(walletInfo);
      } catch (error) {
        console.error('Error updating wallet info:', error);
      }
    }
  };

  const handleChainChanged = (chainId: string) => {
    setChainId(parseInt(chainId, 16));
    window.location.reload();
  };

  const handleDisconnect = () => {
    disconnectWallet();
  };

  const connectWallet = async () => {
    const isInstalled = await walletService.isWalletInstalled();
    
    if (!isInstalled) {
      toast.error('MetaMask is not installed. Please install MetaMask to continue.');
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    setIsConnecting(true);
    try {
      const walletInfo = await walletService.linkAccount();
      updateWalletState(walletInfo);
      toast.success('Account linked successfully!');
    } catch (error: any) {
      console.error('Error linking account:', error);
      toast.error(error.message || 'Failed to link account');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setIsConnected(false);
    setChainId(null);
    setBalance(null);
    toast.success('Account disconnected');
  };

  const switchNetwork = async (targetChainId: string) => {
    try {
      const chainIdNum = parseInt(targetChainId, 16);
      await walletService.switchNetwork(chainIdNum);
      toast.success('Network switched successfully');
    } catch (error: any) {
      console.error('Error switching network:', error);
      toast.error(error.message || 'Failed to switch network');
      throw error;
    }
  };

  const sendTransaction = async (to: string, value: string): Promise<string> => {
    if (!account) throw new Error('No account connected');

    try {
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: account,
          to,
          value: `0x${(parseFloat(value) * Math.pow(10, 18)).toString(16)}`,
        }],
      });
      return txHash;
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  };

  const getNetworkName = (chainId: number | null): string => {
    if (!chainId) return 'Unknown Network';
    return walletService.getNetworkName(chainId);
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
