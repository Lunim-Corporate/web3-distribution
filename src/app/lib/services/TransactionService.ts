import { ethers } from 'ethers';
import { BaseService } from './BaseService';
import { TransactionReceipt, TransactionStatus } from './types';
import { ErrorHandler } from './ErrorHandler';

interface StoredTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  status: TransactionStatus;
  timestamp: number;
  description?: string;
  blockNumber?: number;
  gasUsed?: string;
  effectiveGasPrice?: string;
}

export class TransactionService extends BaseService {
  private static instance: TransactionService;
  private static readonly STORAGE_KEY = 'web3_transactions';
  private static readonly MAX_STORED_TXS = 50;

  private constructor() {
    super();
  }

  static getInstance(): TransactionService {
    if (!TransactionService.instance) {
      TransactionService.instance = new TransactionService();
    }
    return TransactionService.instance;
  }

  async trackTransaction(
    hash: string,
    description?: string
  ): Promise<TransactionReceipt> {
    try {
      await this.ensureConnection();

      const tx = await this.provider!.getTransaction(hash);
      if (!tx) {
        ErrorHandler.throwError(
          new Error('Transaction not found'),
          'trackTransaction'
        );
      }

      const storedTx: StoredTransaction = {
        hash,
        from: tx.from,
        to: tx.to || '',
        value: ethers.formatEther(tx.value),
        status: TransactionStatus.PENDING,
        timestamp: Date.now(),
        description,
      };

      this.saveTransaction(storedTx);

      const receipt = await tx.wait();
      
      if (receipt) {
        storedTx.status = receipt.status === 1 
          ? TransactionStatus.CONFIRMED 
          : TransactionStatus.FAILED;
        storedTx.blockNumber = receipt.blockNumber;
        storedTx.gasUsed = receipt.gasUsed.toString();
        storedTx.effectiveGasPrice = receipt.gasPrice?.toString();
        
        this.updateTransaction(storedTx);
      }

      return this.mapToReceipt(storedTx);
    } catch (error) {
      throw this.handleError(error, 'Failed to track transaction');
    }
  }

  async getTransactionStatus(hash: string): Promise<TransactionStatus> {
    try {
      await this.ensureConnection();

      const receipt = await this.provider!.getTransactionReceipt(hash);
      
      if (!receipt) {
        return TransactionStatus.PENDING;
      }

      return receipt.status === 1 
        ? TransactionStatus.CONFIRMED 
        : TransactionStatus.FAILED;
    } catch (error) {
      throw this.handleError(error, 'Failed to get transaction status');
    }
  }

  async waitForTransaction(
    hash: string,
    confirmations: number = 1
  ): Promise<TransactionReceipt> {
    try {
      await this.ensureConnection();

      const receipt = await this.provider!.waitForTransaction(hash, confirmations);
      
      if (!receipt) {
        ErrorHandler.throwError(
          new Error('Transaction receipt not found'),
          'waitForTransaction'
        );
      }

      const storedTx: StoredTransaction = {
        hash,
        from: receipt.from,
        to: receipt.to || '',
        value: '0',
        status: receipt.status === 1 
          ? TransactionStatus.CONFIRMED 
          : TransactionStatus.FAILED,
        timestamp: Date.now(),
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        effectiveGasPrice: receipt.gasPrice?.toString(),
      };

      this.updateTransaction(storedTx);

      return this.mapToReceipt(storedTx);
    } catch (error) {
      throw this.handleError(error, 'Failed to wait for transaction');
    }
  }

  getRecentTransactions(limit: number = 10): TransactionReceipt[] {
    try {
      const stored = this.getStoredTransactions();
      return stored
        .slice(0, limit)
        .map(tx => this.mapToReceipt(tx));
    } catch (error) {
      console.error('Failed to get recent transactions:', error);
      return [];
    }
  }

  getPendingTransactions(): TransactionReceipt[] {
    try {
      const stored = this.getStoredTransactions();
      return stored
        .filter(tx => tx.status === TransactionStatus.PENDING)
        .map(tx => this.mapToReceipt(tx));
    } catch (error) {
      console.error('Failed to get pending transactions:', error);
      return [];
    }
  }

  clearTransactionHistory(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TransactionService.STORAGE_KEY);
    }
  }

  private saveTransaction(tx: StoredTransaction): void {
    if (typeof window === 'undefined') return;

    const stored = this.getStoredTransactions();
    const filtered = stored.filter(t => t.hash !== tx.hash);
    const updated = [tx, ...filtered].slice(0, TransactionService.MAX_STORED_TXS);
    
    localStorage.setItem(
      TransactionService.STORAGE_KEY,
      JSON.stringify(updated)
    );
  }

  private updateTransaction(tx: StoredTransaction): void {
    if (typeof window === 'undefined') return;

    const stored = this.getStoredTransactions();
    const index = stored.findIndex(t => t.hash === tx.hash);
    
    if (index !== -1) {
      stored[index] = tx;
      localStorage.setItem(
        TransactionService.STORAGE_KEY,
        JSON.stringify(stored)
      );
    } else {
      this.saveTransaction(tx);
    }
  }

  private getStoredTransactions(): StoredTransaction[] {
    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem(TransactionService.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to parse stored transactions:', error);
      return [];
    }
  }

  private mapToReceipt(tx: StoredTransaction): TransactionReceipt {
    return {
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: tx.value,
      blockNumber: tx.blockNumber || 0,
      status: tx.status,
      timestamp: tx.timestamp,
      gasUsed: tx.gasUsed || '0',
      effectiveGasPrice: tx.effectiveGasPrice || '0',
    };
  }

  async refreshPendingTransactions(): Promise<void> {
    const pending = this.getPendingTransactions();
    
    for (const tx of pending) {
      try {
        const status = await this.getTransactionStatus(tx.hash);
        if (status !== TransactionStatus.PENDING) {
          await this.waitForTransaction(tx.hash);
        }
      } catch (error) {
        console.error(`Failed to refresh transaction ${tx.hash}:`, error);
      }
    }
  }
}
