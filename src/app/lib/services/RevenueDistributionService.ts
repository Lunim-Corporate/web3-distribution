import { BaseService } from './BaseService';
import { FEATURE_FLAGS, getContractAddress, REVENUE_DISTRIBUTOR_ABI } from '@/lib/contracts';
import { ContractService } from './ContractService';
import { PaymentService } from './PaymentService';
import { TransactionService } from './TransactionService';
import { TransactionReceipt } from './types';
import { PaymentSplit } from '@/lib/types';

export type DistributionMode = 'mock' | 'testnet' | 'production';

export interface RevenueShare {
  contributorId: string;
  contributorName: string;
  walletAddress: string;
  percentage: number;
  amount: number;
}

export interface DistributionRequest {
  projectId: string;
  projectName: string;
  totalAmount: number;
  shares: RevenueShare[];
  mode: DistributionMode;
  contractAddress?: string;
  useSmartContract: boolean;
  revenueSource?: string;
}

export interface DistributionResult {
  success: boolean;
  mode: DistributionMode;
  totalAmount: number;
  distributedAmount: number;
  transactions: TransactionReceipt[];
  errors: string[];
  timestamp: number;
  transactionHash?: string;
  reference?: string;
}

export class RevenueDistributionService extends BaseService {
  private static instance: RevenueDistributionService;
  private contractService: ContractService;
  private paymentService: PaymentService;
  private transactionService: TransactionService;
  private currentMode: DistributionMode = 'mock';

  private constructor() {
    super();
    this.contractService = ContractService.getInstance();
    this.paymentService = PaymentService.getInstance();
    this.transactionService = TransactionService.getInstance();
    
    // Load saved mode from localStorage
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('distribution_mode');
      if (savedMode) {
        this.currentMode = savedMode as DistributionMode;
      }
    }
  }

  static getInstance(): RevenueDistributionService {
    if (!RevenueDistributionService.instance) {
      RevenueDistributionService.instance = new RevenueDistributionService();
    }
    return RevenueDistributionService.instance;
  }

  setMode(mode: DistributionMode): void {
    this.currentMode = mode;
    if (typeof window !== 'undefined') {
      localStorage.setItem('distribution_mode', mode);
    }
  }

  getMode(): DistributionMode {
    return this.currentMode;
  }

  async distributeRevenue(request: DistributionRequest): Promise<DistributionResult> {
    const mode = request.mode || this.currentMode;
    const configuredAddress = getContractAddress('RevenueDistributor', FEATURE_FLAGS.DEFAULT_NETWORK);
    const contractAddress = request.contractAddress || configuredAddress;
    const shouldUseContract = request.useSmartContract && FEATURE_FLAGS.USE_SMART_CONTRACT;
    const distributedAmount = request.shares.reduce((sum, s) => sum + s.amount, 0);
    const processingRecord = await this.persistRevenue(request, 'Processing');

    if (shouldUseContract && !contractAddress) {
      throw new Error('Smart contract mode enabled but RevenueDistributor address is missing');
    }

    try {
      if (shouldUseContract && contractAddress) {
        const receipt = await this.distributeViaContract({
          ...request,
          contractAddress,
        });

        const result: DistributionResult = {
          success: true,
          mode,
          totalAmount: request.totalAmount,
          distributedAmount,
          transactions: [receipt],
          errors: [],
          timestamp: Date.now(),
          transactionHash: receipt.hash,
          reference: receipt.hash,
        };

        await this.updateRevenueStatus(processingRecord?.id, {
          status: 'Paid',
          transactionHash: receipt.hash,
          splits: request.shares.map((share) => ({
            contributorId: share.contributorId,
            contributorName: share.contributorName,
            amount: share.amount,
            percentage: share.percentage,
            status: 'Paid' as PaymentSplit['status'],
          })),
        });
        this.saveDistributionHistory(request, result);
        return result;
      }

      const mockRef = `SIM-${Date.now()}`;
      const result: DistributionResult = {
        success: true,
        mode,
        totalAmount: request.totalAmount,
        distributedAmount,
        transactions: [],
        errors: [],
        timestamp: Date.now(),
        transactionHash: mockRef,
        reference: mockRef,
      };

      await this.updateRevenueStatus(processingRecord?.id, {
        status: 'Paid',
        transactionHash: mockRef,
        splits: request.shares.map((share) => ({
          contributorId: share.contributorId,
          contributorName: share.contributorName,
          amount: share.amount,
          percentage: share.percentage,
          status: 'Paid' as PaymentSplit['status'],
        })),
      });
      this.saveDistributionHistory(request, result);
      return result;
    } catch (error) {
      await this.updateRevenueStatus(processingRecord?.id, { status: 'Pending' });
      throw this.handleError(error, 'Failed to distribute revenue');
    }
  }

  private async persistRevenue(request: DistributionRequest, status: PaymentSplit['status'] | 'Paid' | 'Pending' | 'Processing', txReference?: string): Promise<{ id: string } | null> {
    const payload = {
      projectId: request.projectId,
      projectName: request.projectName,
      amount: request.totalAmount,
      status,
      transactionHash: txReference,
      source: request.revenueSource || 'Payment Split',
      splits: request.shares.map(share => ({
        contributorId: share.contributorId,
        contributorName: share.contributorName,
        amount: share.amount,
        percentage: share.percentage,
        status,
      })),
    };

    const response = await fetch('/api/revenue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Failed to persist revenue distribution');
    }

    const created = await response.json();
    return created?.id ? { id: created.id } : null;
  }

  private async updateRevenueStatus(id: string | undefined, updates: Record<string, any>): Promise<void> {
    if (!id) return;

    const response = await fetch('/api/revenue', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });

    if (!response.ok) {
      throw new Error('Failed to update revenue distribution status');
    }
  }

  private async distributeViaContract(request: DistributionRequest): Promise<TransactionReceipt> {
    if (!request.contractAddress) {
      throw new Error('Smart contract mode enabled but RevenueDistributor address is missing');
    }

    return await this.contractService.distributeRevenue(
      request.contractAddress,
      REVENUE_DISTRIBUTOR_ABI,
      request.projectId,
      request.totalAmount.toString()
    );
  }

  // Legacy paths retained for compatibility
  async distributeRevenueDeprecated(request: DistributionRequest): Promise<DistributionResult> {
    const mode = request.mode || this.currentMode;

    try {
      switch (mode) {
        case 'mock':
          return await this.distributeMock(request);
        case 'testnet':
          return await this.distributeTestnet(request);
        case 'production':
          return await this.distributeProduction(request);
        default:
          throw new Error(`Unknown distribution mode: ${mode}`);
      }
    } catch (error) {
      throw this.handleError(error, 'Failed to distribute revenue');
    }
  }

  private async distributeMock(request: DistributionRequest): Promise<DistributionResult> {
    console.log('Mock distribution:', request);

    // Simulate distribution
    const transactions: TransactionReceipt[] = [];
    const errors: string[] = [];

    for (const share of request.shares) {
      const mockTx: TransactionReceipt = {
        hash: `0x${Math.random().toString(16).slice(2, 66)}`,
        from: request.contractAddress || 'unknown',
        to: share.walletAddress,
        value: share.amount.toString(),
        blockNumber: Math.floor(Math.random() * 1000000),
        status: 'confirmed' as any,
        timestamp: Date.now(),
        gasUsed: '21000',
        effectiveGasPrice: '20000000000',
      };
      transactions.push(mockTx);
    }

    const result: DistributionResult = {
      success: true,
      mode: 'mock',
      totalAmount: request.totalAmount,
      distributedAmount: request.shares.reduce((sum, s) => sum + s.amount, 0),
      transactions,
      errors,
      timestamp: Date.now(),
    };

    this.saveDistributionHistory(request, result);
    return result;
  }

  private async distributeTestnet(request: DistributionRequest): Promise<DistributionResult> {
    console.log('Testnet distribution:', request);

    const transactions: TransactionReceipt[] = [];
    const errors: string[] = [];

    if (request.useSmartContract && request.contractAddress) {
      // Use smart contract for distribution
      try {
        const receipt = await this.distributeViaContract(request);
        transactions.push(receipt);
      } catch (error: any) {
        errors.push(`Contract distribution failed: ${error.message}`);
      }
    } else {
      // Direct wallet-to-wallet transfers
      for (const share of request.shares) {
        try {
          const receipt = await this.paymentService.sendPayment({
            to: share.walletAddress,
            amount: share.amount.toString(),
            memo: `Revenue share for ${request.projectName}`,
          });
          transactions.push(receipt);
        } catch (error: any) {
          errors.push(`Payment to ${share.contributorName} failed: ${error.message}`);
        }
      }
    }

    const distributedAmount = transactions.reduce((sum, tx) => sum + parseFloat(tx.value), 0);

    const result: DistributionResult = {
      success: errors.length === 0,
      mode: 'testnet',
      totalAmount: request.totalAmount,
      distributedAmount,
      transactions,
      errors,
      timestamp: Date.now(),
    };

    this.saveDistributionHistory(request, result);
    return result;
  }

  private async distributeProduction(request: DistributionRequest): Promise<DistributionResult> {
    console.log('Production distribution:', request);

    const transactions: TransactionReceipt[] = [];
    const errors: string[] = [];

    if (request.useSmartContract && request.contractAddress) {
      // Use smart contract for distribution
      try {
        const receipt = await this.distributeViaContract(request);
        transactions.push(receipt);
      } catch (error: any) {
        errors.push(`Contract distribution failed: ${error.message}`);
      }
    } else {
      // Direct wallet-to-wallet transfers
      for (const share of request.shares) {
        try {
          const receipt = await this.paymentService.sendPayment({
            to: share.walletAddress,
            amount: share.amount.toString(),
            memo: `Revenue share for ${request.projectName}`,
          });
          transactions.push(receipt);
        } catch (error: any) {
          errors.push(`Payment to ${share.contributorName} failed: ${error.message}`);
        }
      }
    }

    const distributedAmount = transactions.reduce((sum, tx) => sum + parseFloat(tx.value), 0);

    const result: DistributionResult = {
      success: errors.length === 0,
      mode: 'production',
      totalAmount: request.totalAmount,
      distributedAmount,
      transactions,
      errors,
      timestamp: Date.now(),
    };

    this.saveDistributionHistory(request, result);
    return result;
  }

  async distributeFiatRevenue(request: DistributionRequest): Promise<DistributionResult> {
    console.log('Fiat distribution:', request);

    // For fiat-only creators, we simulate off-chain distribution
    const transactions: TransactionReceipt[] = [];
    const errors: string[] = [];

    for (const share of request.shares) {
      const mockTx: TransactionReceipt = {
        hash: `fiat_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        from: 'platform_treasury',
        to: share.contributorId,
        value: share.amount.toString(),
        blockNumber: 0,
        status: 'confirmed' as any,
        timestamp: Date.now(),
        gasUsed: '0',
        effectiveGasPrice: '0',
      };
      transactions.push(mockTx);
    }

    const result: DistributionResult = {
      success: true,
      mode: this.currentMode,
      totalAmount: request.totalAmount,
      distributedAmount: request.shares.reduce((sum, s) => sum + s.amount, 0),
      transactions,
      errors,
      timestamp: Date.now(),
    };

    this.saveDistributionHistory(request, result);
    return result;
  }

  getDistributionHistory(limit: number = 20): DistributionResult[] {
    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem('distribution_history');
      const history: DistributionResult[] = stored ? JSON.parse(stored) : [];
      return history.slice(0, limit);
    } catch (error) {
      console.error('Failed to get distribution history:', error);
      return [];
    }
  }

  private saveDistributionHistory(request: DistributionRequest, result: DistributionResult): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('distribution_history');
      const history: DistributionResult[] = stored ? JSON.parse(stored) : [];
      history.unshift(result);
      localStorage.setItem('distribution_history', JSON.stringify(history.slice(0, 100)));
    } catch (error) {
      console.error('Failed to save distribution history:', error);
    }
  }

  calculateShares(totalAmount: number, contributors: Array<{ id: string; name: string; walletAddress: string; percentage: number }>): RevenueShare[] {
    return contributors.map(contributor => ({
      contributorId: contributor.id,
      contributorName: contributor.name,
      walletAddress: contributor.walletAddress,
      percentage: contributor.percentage,
      amount: (totalAmount * contributor.percentage) / 100,
    }));
  }
}
