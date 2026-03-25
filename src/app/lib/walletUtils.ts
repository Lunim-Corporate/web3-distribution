// Wallet Utilities and Helpers for Integration with Smart Contracts

import { dummyWallets, DummyWallet, getWalletByAddress, getWalletStats } from '@/data/dummyWallets';

/**
 * Mock Wallet Service for development and testing
 * Simulates wallet operations without requiring real blockchain interaction
 */

export interface MockWalletTransaction {
  hash: string;
  from: string;
  to: string;
  amount: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: string;
}

export class MockWalletService {
  /**
   * Get wallet data by address
   */
  static getWallet(address: string): DummyWallet | null {
    const wallet = getWalletByAddress(address);
    return wallet || null;
  }

  /**
   * Get formatted balance for display
   */
  static getFormattedBalance(address: string): string {
    const wallet = this.getWallet(address);
    return wallet ? `${wallet.balance} ${wallet.network === 'Polygon Mumbai' ? 'MATIC' : 'ETH'}` : 'N/A';
  }

  /**
   * Get balance in USD
   */
  static getBalanceInUSD(address: string): number {
    const wallet = this.getWallet(address);
    return wallet ? wallet.balanceUSD : 0;
  }

  /**
   * Simulate wallet connection
   */
  static async connectWallet(address: string): Promise<boolean> {
    const wallet = this.getWallet(address);
    if (wallet) {
      wallet.isConnected = true;
      wallet.lastConnected = new Date().toISOString();
      return true;
    }
    return false;
  }

  /**
   * Simulate wallet disconnection
   */
  static disconnectWallet(address: string): void {
    const wallet = this.getWallet(address);
    if (wallet) {
      wallet.isConnected = false;
    }
  }

  /**
   * Simulate sending transaction
   */
  static async sendTransaction(
    _from: string,
    _to: string,
    _amount: string,
    projectId: string,
    projectName: string,
    description: string
  ): Promise<string> {
    // Mark mock params as intentionally unused (lint-friendly).
    void _from;
    void _to;
    void _amount;
    void projectId;
    void projectName;
    void description;

    return new Promise((resolve) => {
      // Simulate network delay
      setTimeout(() => {
        const txHash = `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;
        resolve(txHash);
      }, 1000);
    });
  }

  /**
   * Get wallet transaction history
   */
  static getTransactionHistory(address: string, limit: number = 10) {
    const wallet = this.getWallet(address);
    if (!wallet) return [];
    return wallet.transactions.slice(0, limit);
  }

  /**
   * Get wallet statistics
   */
  static getWalletStatistics(address: string) {
    return getWalletStats(address);
  }

  /**
   * Get all wallets (for admin dashboard)
   */
  static getAllWallets(): DummyWallet[] {
    return dummyWallets;
  }

  /**
   * Get wallets by user IDs
   */
  static getWalletsByUserIds(userIds: string[]): DummyWallet[] {
    return dummyWallets.filter((wallet) => userIds.includes(wallet.userId));
  }

  /**
   * Calculate gas fees (simulated)
   */
  static calculateGasFees(amount: string): {
    gasFee: string;
    totalAmount: string;
    gasPrice: string;
  } {
    const amountNum = parseFloat(amount);
    const gasPrice = '30'; // Gwei
    const gasLimit = '21000'; // Standard ERC20 transfer
    const gasFee = ((parseInt(gasLimit) * parseInt(gasPrice)) / 1e9).toFixed(4);
    const totalAmount = (amountNum + parseFloat(gasFee)).toFixed(4);

    return {
      gasFee,
      totalAmount,
      gasPrice: `${gasPrice} Gwei`,
    };
  }

  /**
   * Verify wallet address format
   */
  static isValidWalletAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Format wallet address for display
   */
  static formatWalletAddress(address: string, length: number = 6): string {
    if (!this.isValidWalletAddress(address)) return 'Invalid';
    return `${address.slice(0, length)}...${address.slice(-4)}`;
  }

  /**
   * Convert ETH to USD
   */
  static convertEthToUSD(ethAmount: string, ethPrice: number = 2500): number {
    return parseFloat(ethAmount) * ethPrice;
  }

  /**
   * Convert USD to ETH
   */
  static convertUSDToEth(usdAmount: number, ethPrice: number = 2500): string {
    return (usdAmount / ethPrice).toFixed(4);
  }

  /**
   * Get network configuration
   */
  static getNetworkConfig(chainId: number) {
    const networks: Record<
      number,
      {
        name: string;
        symbol: string;
        rpcUrl: string;
        blockExplorer: string;
        chainId: number;
      }
    > = {
      80001: {
        name: 'Polygon Mumbai',
        symbol: 'MATIC',
        rpcUrl: 'https://rpc-mumbai.maticvigil.com/',
        blockExplorer: 'https://mumbai.polygonscan.com/',
        chainId: 80001,
      },
      137: {
        name: 'Polygon Mainnet',
        symbol: 'MATIC',
        rpcUrl: 'https://polygon-rpc.com/',
        blockExplorer: 'https://polygonscan.com/',
        chainId: 137,
      },
      1: {
        name: 'Ethereum Mainnet',
        symbol: 'ETH',
        rpcUrl: 'https://mainnet.infura.io/v3/',
        blockExplorer: 'https://etherscan.io/',
        chainId: 1,
      },
    };

    return networks[chainId] || networks[80001]; // Default to Mumbai
  }

  /**
   * Simulate smart contract execution
   */
  static async executeSmartContract(
    contractAddress: string,
    functionName: string,
    parameters: unknown[],
    walletAddress: string
  ): Promise<{
    success: boolean;
    txHash: string;
    message: string;
  }> {
    void contractAddress;
    void parameters;
    void walletAddress;

    return new Promise((resolve) => {
      setTimeout(() => {
        const success = Math.random() > 0.1; // 90% success rate for demo
        resolve({
          success,
          txHash: `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`,
          message: success
            ? `${functionName} executed successfully`
            : `${functionName} execution failed`,
        });
      }, 2000);
    });
  }

  /**
   * Get pending transactions
   */
  static getPendingTransactions(address: string) {
    const wallet = this.getWallet(address);
    if (!wallet) return [];
    return wallet.transactions.filter((tx) => tx.status === 'pending');
  }

  /**
   * Get completed transactions
   */
  static getCompletedTransactions(address: string) {
    const wallet = this.getWallet(address);
    if (!wallet) return [];
    return wallet.transactions.filter((tx) => tx.status === 'completed');
  }

  /**
   * Get failed transactions
   */
  static getFailedTransactions(address: string) {
    const wallet = this.getWallet(address);
    if (!wallet) return [];
    return wallet.transactions.filter((tx) => tx.status === 'failed');
  }
}

export default MockWalletService;
