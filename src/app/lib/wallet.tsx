'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import './web3modal'; // Bootstrap Web3Modal singleton
import { 
  useWeb3Modal, 
  useWeb3ModalAccount, 
  useWeb3ModalProvider 
} from '@web3modal/ethers/react';
import { BrowserProvider, formatEther, parseEther } from 'ethers';
import { toast } from 'react-hot-toast';
import { useAuth } from './auth';

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
  const { open } = useWeb3Modal();
  const { address, isConnected, chainId } = useWeb3ModalAccount();
  const { walletProvider } = useWeb3ModalProvider();
  const { user, connectUserWallet } = useAuth();
  
  const [balance, setBalance] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Fetch balance when account or provider changes
  const fetchBalance = useCallback(async () => {
    if (!address || !walletProvider) {
      setBalance(null);
      return;
    }
    try {
      const ethersProvider = new BrowserProvider(walletProvider);
      const balanceWei = await ethersProvider.getBalance(address);
      setBalance(parseFloat(formatEther(balanceWei)).toFixed(4));
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance(null);
    }
  }, [address, walletProvider]);

  useEffect(() => {
    if (isConnected) {
      fetchBalance();
      // Sync wallet address to Supabase if not already synced
      if (address && user && user.wallet_address !== address) {
        connectUserWallet(address).catch(err => {
          console.error('Failed to sync wallet to profile:', err);
        });
      }
    } else {
      setBalance(null);
    }
  }, [isConnected, fetchBalance, address, user, connectUserWallet]);

  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      await open();
    } catch (error) {
      console.error('Error opening modal:', error);
      toast.error('Failed to open wallet selector');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    // Web3Modal handles internal state, but we can provide a toast
    toast.success('Wallet disconnected');
  };

  const switchNetwork = async (targetChainIdHex: string) => {
    // Web3Modal handles network switching through the modal or walletProvider
    // But we can try to use the walletProvider directly for convenience
    if (!walletProvider) {
      toast.error('Wallet not connected');
      return;
    }
    try {
      await walletProvider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetChainIdHex }],
      });
    } catch (error: any) {
      if (error.code === 4902) {
        toast.error('Network not found in wallet. Please add it.');
      } else {
        toast.error('Failed to switch network');
      }
    }
  };

  const sendTransaction = async (to: string, valueEth: string): Promise<string> => {
    if (!walletProvider || !address) throw new Error('Wallet not connected');
    
    try {
      const ethersProvider = new BrowserProvider(walletProvider);
      const signer = await ethersProvider.getSigner();
      
      const tx = await signer.sendTransaction({
        to,
        value: parseEther(valueEth)
      });
      
      return tx.hash;
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  };

  const getNetworkName = (id: number | null): string => {
    switch (id) {
      case 1: return 'Ethereum Mainnet';
      case 137: return 'Polygon';
      case 31337: return 'Hardhat Localhost';
      case 84532: return 'Base Sepolia';
      default: return id ? `Chain ID: ${id}` : 'Disconnected';
    }
  };

  const value = {
    account: address || null,
    isConnected,
    isConnecting,
    chainId: chainId || null,
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
