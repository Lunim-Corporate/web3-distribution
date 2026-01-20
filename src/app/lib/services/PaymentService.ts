import { ethers } from 'ethers';
import { BaseService } from './BaseService';
import { PaymentRequest, BatchPaymentRequest, GasEstimate, TransactionReceipt } from './types';
import { ErrorHandler } from './ErrorHandler';
import { TransactionService } from './TransactionService';

export class PaymentService extends BaseService {
  private static instance: PaymentService;
  private transactionService: TransactionService;

  private constructor() {
    super();
    this.transactionService = TransactionService.getInstance();
  }

  static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  async sendPayment(request: PaymentRequest): Promise<TransactionReceipt> {
    try {
      await this.ensureConnection();

      const signer = await this.getSigner();
      const valueInWei = ethers.parseEther(request.amount);

      const tx = await signer.sendTransaction({
        to: request.to,
        value: valueInWei,
      });

      const description = request.memo 
        ? `Payment: ${request.memo}` 
        : `Payment of ${request.amount} ${request.currency || 'ETH'}`;

      return await this.transactionService.trackTransaction(tx.hash, description);
    } catch (error) {
      throw this.handleError(error, 'Failed to send payment');
    }
  }

  async sendBatchPayments(request: BatchPaymentRequest): Promise<TransactionReceipt[]> {
    try {
      await this.ensureConnection();

      const receipts: TransactionReceipt[] = [];

      for (const payment of request.payments) {
        try {
          const receipt = await this.sendPayment(payment);
          receipts.push(receipt);
        } catch (error) {
          console.error(`Failed to send payment to ${payment.to}:`, error);
          throw error;
        }
      }

      return receipts;
    } catch (error) {
      throw this.handleError(error, 'Failed to send batch payments');
    }
  }

  async estimateGas(request: PaymentRequest): Promise<GasEstimate> {
    try {
      await this.ensureConnection();

      const signer = await this.getSigner();
      const valueInWei = ethers.parseEther(request.amount);

      const gasLimit = await this.provider!.estimateGas({
        to: request.to,
        value: valueInWei,
        from: await signer.getAddress(),
      });

      const feeData = await this.provider!.getFeeData();

      const gasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei');
      const estimatedCost = gasLimit * gasPrice;

      return {
        gasLimit: gasLimit.toString(),
        gasPrice: ethers.formatUnits(gasPrice, 'gwei'),
        maxFeePerGas: feeData.maxFeePerGas 
          ? ethers.formatUnits(feeData.maxFeePerGas, 'gwei') 
          : undefined,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas 
          ? ethers.formatUnits(feeData.maxPriorityFeePerGas, 'gwei') 
          : undefined,
        estimatedCost: ethers.formatEther(estimatedCost),
      };
    } catch (error) {
      throw this.handleError(error, 'Failed to estimate gas');
    }
  }

  async estimateBatchGas(request: BatchPaymentRequest): Promise<GasEstimate> {
    try {
      await this.ensureConnection();

      let totalGasLimit = BigInt(0);
      const feeData = await this.provider!.getFeeData();
      const gasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei');

      for (const payment of request.payments) {
        const estimate = await this.estimateGas(payment);
        totalGasLimit += BigInt(estimate.gasLimit);
      }

      const estimatedCost = totalGasLimit * gasPrice;

      return {
        gasLimit: totalGasLimit.toString(),
        gasPrice: ethers.formatUnits(gasPrice, 'gwei'),
        maxFeePerGas: feeData.maxFeePerGas 
          ? ethers.formatUnits(feeData.maxFeePerGas, 'gwei') 
          : undefined,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas 
          ? ethers.formatUnits(feeData.maxPriorityFeePerGas, 'gwei') 
          : undefined,
        estimatedCost: ethers.formatEther(estimatedCost),
      };
    } catch (error) {
      throw this.handleError(error, 'Failed to estimate batch gas');
    }
  }

  async getBalance(address?: string): Promise<string> {
    try {
      await this.ensureConnection();

      let targetAddress = address;
      if (!targetAddress) {
        const signer = await this.getSigner();
        targetAddress = await signer.getAddress();
      }

      const balance = await this.provider!.getBalance(targetAddress);
      return ethers.formatEther(balance);
    } catch (error) {
      throw this.handleError(error, 'Failed to get balance');
    }
  }

  async validatePayment(request: PaymentRequest): Promise<{ valid: boolean; error?: string }> {
    try {
      if (!ethers.isAddress(request.to)) {
        return { valid: false, error: 'Invalid recipient address' };
      }

      const amount = parseFloat(request.amount);
      if (isNaN(amount) || amount <= 0) {
        return { valid: false, error: 'Invalid amount' };
      }

      const balance = await this.getBalance();
      const balanceNum = parseFloat(balance);

      if (balanceNum < amount) {
        return { valid: false, error: 'Insufficient balance' };
      }

      const estimate = await this.estimateGas(request);
      const totalCost = amount + parseFloat(estimate.estimatedCost);

      if (balanceNum < totalCost) {
        return { valid: false, error: 'Insufficient balance for gas fees' };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Validation failed' };
    }
  }

  async validateBatchPayment(request: BatchPaymentRequest): Promise<{ valid: boolean; error?: string }> {
    try {
      let totalAmount = 0;

      for (const payment of request.payments) {
        if (!ethers.isAddress(payment.to)) {
          return { valid: false, error: `Invalid address: ${payment.to}` };
        }

        const amount = parseFloat(payment.amount);
        if (isNaN(amount) || amount <= 0) {
          return { valid: false, error: `Invalid amount for ${payment.to}` };
        }

        totalAmount += amount;
      }

      const balance = await this.getBalance();
      const balanceNum = parseFloat(balance);

      if (balanceNum < totalAmount) {
        return { valid: false, error: 'Insufficient balance for all payments' };
      }

      const estimate = await this.estimateBatchGas(request);
      const totalCost = totalAmount + parseFloat(estimate.estimatedCost);

      if (balanceNum < totalCost) {
        return { valid: false, error: 'Insufficient balance for gas fees' };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Validation failed' };
    }
  }
}
