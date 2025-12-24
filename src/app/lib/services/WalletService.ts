import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';
import { BaseService } from './BaseService';
import { WalletInfo, NetworkConfig } from './types';
import { ErrorHandler } from './ErrorHandler';

const AMOY_CHAIN_ID = 80002;
const AMOY_CHAIN_HEX = '0x13882';

export class WalletService extends BaseService {
  private static instance: WalletService;

  private constructor() {
    super();
  }

  static getInstance(): WalletService {
    if (!WalletService.instance) {
      WalletService.instance = new WalletService();
    }
    return WalletService.instance;
  }

  async linkAccount(): Promise<WalletInfo> {
    if (typeof window === 'undefined') {
      const error = new Error('Window is not defined. This function must be called in a browser environment.');
      console.error('[WalletService] linkAccount error:', error);
      throw error;
    }

    if (!window.ethereum) {
      const error = new Error('MetaMask is not available');
      toast.error('MetaMask is not installed. Please install MetaMask to continue.');
      console.error('[WalletService] linkAccount error:', error);
      throw error;
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please unlock your wallet and try again.');
      }

      await this.initializeProvider();
      if (!this.provider) {
        const error = new Error('MetaMask is not available');
        toast.error('MetaMask is not installed. Please install MetaMask to continue.');
        console.error('[WalletService] linkAccount error:', error);
        throw error;
      }

      // Reset signer to ensure we pick up the newly authorized account
      this.signer = null;

      await this.ensureNetwork(AMOY_CHAIN_ID);

      const network = await this.provider.getNetwork();

      let balance = '0';
      try {
        const fetchedBalance = await this.provider.getBalance(accounts[0]);
        balance = ethers.formatEther(fetchedBalance);
      } catch (balanceError) {
        console.warn('[WalletService] balance fetch warning:', balanceError);
        toast('Wallet connected, balance temporarily unavailable (RPC busy)', { icon: '⚠️' });
      }

      return {
        address: accounts[0],
        balance,
        chainId: Number(network.chainId),
        networkName: this.getNetworkName(Number(network.chainId)),
        isConnected: true,
      };
    } catch (error: any) {
      console.error('[WalletService] linkAccount error:', error);

      if (error?.code === 4001 || error?.message?.toLowerCase().includes('user rejected')) {
        throw error;
      }

      throw this.handleError(error, error.message || 'Failed to link account');
    }
  }

  async getWalletInfo(): Promise<WalletInfo> {
    try {
      await this.ensureConnection();
      await this.ensureNetwork(AMOY_CHAIN_ID);

      const signer = await this.getSigner();
      const address = await signer.getAddress();

      let balance = '0';
      try {
        const fetchedBalance = await this.provider!.getBalance(address);
        balance = ethers.formatEther(fetchedBalance);
      } catch (balanceError) {
        console.warn('[WalletService] balance fetch warning:', balanceError);
        toast('Wallet connected, balance temporarily unavailable (RPC busy)', { icon: '⚠️' });
      }

      const network = await this.provider!.getNetwork();

      return {
        address,
        balance,
        chainId: Number(network.chainId),
        networkName: this.getNetworkName(Number(network.chainId)),
        isConnected: true,
      };
    } catch (error) {
      console.error('[WalletService] getWalletInfo error:', error);
      throw this.handleError(error, 'Failed to get wallet info');
    }
  }

  async ensureNetwork(requiredChainId: number): Promise<void> {
    try {
      const network = await this.getNetwork();
      const currentChainId = Number(network.chainId);

      if (currentChainId !== requiredChainId) {
        await this.switchNetwork(requiredChainId);
      }
    } catch (error) {
      console.error('[WalletService] ensureNetwork error:', error);
      throw this.handleError(error, 'Failed to ensure network');
    }
  }

  async switchNetwork(chainId: number): Promise<void> {
    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        toast.error('MetaMask is not installed. Please install MetaMask to continue.');
        throw new Error('Wallet not available');
      }

      const hexChainId = chainId === AMOY_CHAIN_ID ? AMOY_CHAIN_HEX : `0x${chainId.toString(16)}`;
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: hexChainId }],
        });
        return;
      } catch (error: any) {
        if (error?.code === 4902) {
          const networkConfig = this.getNetworkConfig(chainId);
          if (!networkConfig) {
            const unsupportedError = new Error(`Network ${chainId} is not supported`);
            throw unsupportedError;
          }

          await this.addNetwork(networkConfig);
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: hexChainId }],
          });
          return;
        }

        if (error?.code === 4001) {
          const networkName = this.getNetworkName(chainId);
          toast.error(`Please switch to ${networkName} to continue.`);
          throw error;
        }

        throw error;
      }
    } catch (error: any) {
      const isServiceError =
        error?.code && error?.message && Object.prototype.hasOwnProperty.call(error, 'isRetryable');
      if (!isServiceError) {
        console.error('[WalletService] switchNetwork error:', error);
      }
      if (isServiceError) {
        throw error;
      }
      throw this.handleError(error, error.message || 'Failed to switch network');
    }
  }

  async addNetwork(config: NetworkConfig): Promise<void> {
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [config],
      });
    } catch (error) {
      console.error('[WalletService] addNetwork error:', error);
      throw this.handleError(error, 'Failed to add network');
    }
  }

  getNetworkName(chainId: number): string {
    const networks: Record<number, string> = {
      1: 'Ethereum Mainnet',
      5: 'Goerli Testnet',
      11155111: 'Sepolia Testnet',
      137: 'Polygon Mainnet',
      80002: 'Polygon Amoy',
      80001: 'Polygon Mumbai',
      56: 'BSC Mainnet',
      97: 'BSC Testnet',
      43114: 'Avalanche C-Chain',
      43113: 'Avalanche Fuji',
    };

    return networks[chainId] || `Unknown Network (${chainId})`;
  }

  getNetworkConfig(chainId: number): NetworkConfig | null {
    const configs: Record<number, NetworkConfig> = {
      1: {
        chainId: '0x1',
        chainName: 'Ethereum Mainnet',
        rpcUrls: ['https://mainnet.infura.io/v3/'],
        blockExplorerUrls: ['https://etherscan.io/'],
        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
      },
      137: {
        chainId: '0x89',
        chainName: 'Polygon Mainnet',
        rpcUrls: ['https://polygon-rpc.com/'],
        blockExplorerUrls: ['https://polygonscan.com/'],
        nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
      },
      80002: {
        chainId: '0x13882',
        chainName: 'Polygon Amoy',
        rpcUrls: [process.env.NEXT_PUBLIC_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology/'],
        blockExplorerUrls: ['https://amoy.polygonscan.com/'],
        nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
      },
      80001: {
        chainId: '0x13881',
        chainName: 'Polygon Mumbai',
        rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
        blockExplorerUrls: ['https://mumbai.polygonscan.com/'],
        nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
      },
      56: {
        chainId: '0x38',
        chainName: 'BSC Mainnet',
        rpcUrls: ['https://bsc-dataseed.binance.org/'],
        blockExplorerUrls: ['https://bscscan.com/'],
        nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
      },
      97: {
        chainId: '0x61',
        chainName: 'BSC Testnet',
        rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
        blockExplorerUrls: ['https://testnet.bscscan.com/'],
        nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
      },
    };

    return configs[chainId] || null;
  }

  async isWalletInstalled(): Promise<boolean> {
    return typeof window !== 'undefined' && !!window.ethereum;
  }

  async getAccounts(): Promise<string[]> {
    try {
      if (!window.ethereum) {
        return [];
      }

      const accounts = await window.ethereum.request({
        method: 'eth_accounts',
      });

      return accounts || [];
    } catch (error) {
      console.error('[WalletService] Failed to get accounts:', error);
      return [];
    }
  }
}
