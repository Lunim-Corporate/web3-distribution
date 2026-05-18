'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import './web3modal'; // Bootstrap Web3Modal singleton
import { 
  useWeb3Modal, 
  useWeb3ModalAccount, 
  useWeb3ModalProvider,
  useDisconnect
} from '@web3modal/ethers/react';
import { BrowserProvider, formatEther, parseEther } from 'ethers';
import { toast } from 'react-hot-toast';
import { useAuth } from './auth';

type WalletProviderLike = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, listener: (accounts: string[]) => void) => void;
  removeListener?: (event: string, listener: (accounts: string[]) => void) => void;
  providers?: WalletProviderLike[];
  providerMap?: Map<unknown, WalletProviderLike>;
};

function getBrowserEthereum(): WalletProviderLike | null {
  if (typeof window === 'undefined') return null;
  return ((window as Window & { ethereum?: WalletProviderLike }).ethereum ?? null);
}

function getErrorCode(error: unknown): number | undefined {
  return typeof error === 'object' && error !== null && 'code' in error
    ? Number((error as { code?: unknown }).code)
    : undefined;
}

interface WalletContextValue {
  account: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  chainId: number | null;
  balance: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  switchNetwork: (chainId: string) => Promise<void>;
  sendTransaction: (to: string, value: string) => Promise<string>;
  getNetworkName: (chainId: number | null) => string;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { open } = useWeb3Modal();
  const { address, isConnected, chainId } = useWeb3ModalAccount();
  const { walletProvider } = useWeb3ModalProvider();
  const { disconnect } = useDisconnect();
  const { user, connectUserWallet } = useAuth();
  
  const [balance, setBalance] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoAddress, setDemoAddress] = useState<string | null>(null);
  const [manualAddress, setManualAddress] = useState<string | null>(null);
  const [forcedDisconnected, setForcedDisconnected] = useState(false);

  // Sync manual wallet state from window.ethereum
  useEffect(() => {
    const eth = getBrowserEthereum();
    if (eth) {
      const handleAccounts = (accounts: string[]) => {
        if (accounts.length > 0) {
          setManualAddress(accounts[0]);
          setForcedDisconnected(false);
        } else {
          setManualAddress(null);
        }
      };
      eth.on('accountsChanged', handleAccounts);
      // Initial check
      eth.request({ method: 'eth_accounts' }).then(handleAccounts).catch(() => {});
      return () => {
        if (eth.removeListener) eth.removeListener('accountsChanged', handleAccounts);
      };
    }
  }, []);

  // Sync Demo Mode State
  useEffect(() => {
    const checkDemoMode = () => {
      const mode = localStorage.getItem('demo_mode') === 'true';
      setIsDemoMode(mode);
      if (mode) {
        const savedDemoWallet = localStorage.getItem('demo_wallet');
        setDemoAddress(savedDemoWallet);
        if (savedDemoWallet) setForcedDisconnected(false);
      } else {
        setDemoAddress(null);
      }
    };
    
    checkDemoMode();

    const onDemoChanged = () => checkDemoMode();
    const onWalletChanged = (e: Event) => {
      const detail = (e as CustomEvent<string | null>).detail;
      const mode = localStorage.getItem('demo_mode') === 'true';
      if (mode) {
        if (detail === null) {
          setDemoAddress(null);
          return;
        }
        if (detail) {
          setDemoAddress(detail);
          setForcedDisconnected(false);
        } else {
          const savedDemoWallet = localStorage.getItem('demo_wallet');
          setDemoAddress(savedDemoWallet);
          if (savedDemoWallet) setForcedDisconnected(false);
        }
      } else {
        if (detail === null) {
          setManualAddress(null);
          return;
        }
        if (detail) {
          setManualAddress(detail);
          setForcedDisconnected(false);
        }
        else {
          // Trigger re-check of eth_accounts
          const eth = getBrowserEthereum();
          if (eth) {
            eth.request({ method: 'eth_accounts' }).then((accs: string[]) => {
              if (accs.length > 0) {
                setManualAddress(accs[0]);
                setForcedDisconnected(false);
              } else {
                setManualAddress(null);
              }
            }).catch(() => setManualAddress(null));
          }
        }
      }
    };

    window.addEventListener('demo-mode-changed', onDemoChanged);
    window.addEventListener('wallet-changed', onWalletChanged);
    
    return () => {
      window.removeEventListener('demo-mode-changed', onDemoChanged);
      window.removeEventListener('wallet-changed', onWalletChanged);
    };
  }, []);

  const activeAddress = forcedDisconnected
    ? null
    : isDemoMode && demoAddress
      ? demoAddress
      : address || manualAddress || null;
  const activeIsConnected = forcedDisconnected
    ? false
    : isDemoMode
      ? !!demoAddress
      : (isConnected || !!manualAddress);
  const activeChainId = forcedDisconnected ? null : (isDemoMode && demoAddress ? 31337 : chainId || null);

  // Fetch balance when account or provider changes
  const fetchBalance = useCallback(async () => {
    if (isDemoMode && demoAddress) {
      setBalance('10000.0000'); // Mock balance for demo accounts
      return;
    }
    if (!activeAddress || !walletProvider) {
      setBalance(null);
      return;
    }
    try {
      const ethersProvider = new BrowserProvider(walletProvider);
      const balanceWei = await ethersProvider.getBalance(activeAddress);
      setBalance(parseFloat(formatEther(balanceWei)).toFixed(4));
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance(null);
    }
  }, [activeAddress, walletProvider, isDemoMode, demoAddress]);

  useEffect(() => {
    if (activeIsConnected) {
      fetchBalance();
      // Sync wallet address to Supabase if not already synced
      if (activeAddress && user && user.wallet_address !== activeAddress) {
        connectUserWallet(activeAddress).catch(err => {
          console.error('Failed to sync wallet to profile:', err);
        });
      }
    } else {
      setBalance(null);
    }
  }, [activeIsConnected, fetchBalance, activeAddress, user, connectUserWallet]);

  const connectWallet = async () => {
    setIsConnecting(true);
    setForcedDisconnected(false);
    try {
      await open();
    } catch (error) {
      console.error('Error opening modal:', error);
      toast.error('Failed to open wallet selector');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    setForcedDisconnected(true);
    setManualAddress(null);
    setDemoAddress(null);
    localStorage.removeItem('demo_wallet');
    localStorage.removeItem('demo_private_key');
    localStorage.removeItem('selected_live_wallet');

    if (isDemoMode) {
      window.dispatchEvent(new CustomEvent('wallet-changed', { detail: null }));
    } else {
      try {
        await disconnect();
      } catch(e) {
        console.error('Error disconnecting from web3modal', e);
      } finally {
        window.dispatchEvent(new CustomEvent('wallet-changed', { detail: null }));
      }
    }
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
    } catch (error: unknown) {
      if (getErrorCode(error) === 4902) {
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
    account: activeAddress,
    isConnected: activeIsConnected,
    isConnecting,
    chainId: activeChainId,
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
