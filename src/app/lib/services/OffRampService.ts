import { BaseService } from './BaseService';

export interface OffRampProvider {
  name: 'tink' | 'truelayer' | 'plaid' | 'chimoney' | 'paystack';
  displayName: string;
  supportedRegions: string[];
  supportedCurrencies: string[];
}

export interface BankAccount {
  id: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  routingNumber?: string;
  currency: string;
}

export interface OffRampRequest {
  provider: 'tink' | 'truelayer' | 'plaid' | 'chimoney' | 'paystack';
  cryptoAmount: number;
  cryptoCurrency: string;
  fiatCurrency: string;
  bankAccountId: string;
  walletAddress: string;
}

export interface OffRampTransaction {
  transactionId: string;
  provider: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  cryptoAmount: number;
  cryptoCurrency: string;
  fiatAmount: number;
  fiatCurrency: string;
  bankAccountId: string;
  walletAddress: string;
  createdAt: number;
  completedAt?: number;
  transactionHash?: string;
  failureReason?: string;
}

export class OffRampService extends BaseService {
  private static instance: OffRampService;

  private constructor() {
    super();
  }

  static getInstance(): OffRampService {
    if (!OffRampService.instance) {
      OffRampService.instance = new OffRampService();
    }
    return OffRampService.instance;
  }

  getProviders(): OffRampProvider[] {
    return [
      {
        name: 'tink',
        displayName: 'Tink (Europe)',
        supportedRegions: ['EU', 'UK'],
        supportedCurrencies: ['EUR', 'GBP', 'SEK', 'DKK'],
      },
      {
        name: 'truelayer',
        displayName: 'TrueLayer (UK/EU)',
        supportedRegions: ['UK', 'EU'],
        supportedCurrencies: ['GBP', 'EUR'],
      },
      {
        name: 'plaid',
        displayName: 'Plaid (US/Canada)',
        supportedRegions: ['US', 'CA'],
        supportedCurrencies: ['USD', 'CAD'],
      },
      {
        name: 'chimoney',
        displayName: 'Chimoney (Global)',
        supportedRegions: ['Global'],
        supportedCurrencies: ['USD', 'EUR', 'GBP', 'NGN', 'KES', 'GHS', 'ZAR'],
      },
      {
        name: 'paystack',
        displayName: 'Paystack (Africa)',
        supportedRegions: ['NG', 'GH', 'ZA', 'KE'],
        supportedCurrencies: ['NGN', 'GHS', 'ZAR', 'KES'],
      },
    ];
  }

  async createWithdrawal(request: OffRampRequest): Promise<OffRampTransaction> {
    try {
      // Calculate fiat amount based on exchange rate
      const exchangeRate = this.getExchangeRate(request.cryptoCurrency, request.fiatCurrency);
      const fiatAmount = request.cryptoAmount * exchangeRate;

      const transaction: OffRampTransaction = {
        transactionId: `offramp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        provider: request.provider,
        status: 'pending',
        cryptoAmount: request.cryptoAmount,
        cryptoCurrency: request.cryptoCurrency,
        fiatAmount,
        fiatCurrency: request.fiatCurrency,
        bankAccountId: request.bankAccountId,
        walletAddress: request.walletAddress,
        createdAt: Date.now(),
      };

      this.saveTransaction(transaction);

      // Simulate provider-specific withdrawal
      switch (request.provider) {
        case 'tink':
          return this.processTinkWithdrawal(transaction);
        case 'truelayer':
          return this.processTrueLayerWithdrawal(transaction);
        case 'plaid':
          return this.processPlaidWithdrawal(transaction);
        case 'chimoney':
          return this.processChimoneyWithdrawal(transaction);
        case 'paystack':
          return this.processPaystackWithdrawal(transaction);
        default:
          throw new Error('Unsupported provider');
      }
    } catch (error) {
      throw this.handleError(error, 'Failed to create withdrawal');
    }
  }

  private async processTinkWithdrawal(transaction: OffRampTransaction): Promise<OffRampTransaction> {
    console.log('Processing Tink withdrawal:', transaction);
    transaction.status = 'processing';
    this.updateTransaction(transaction);
    return transaction;
  }

  private async processTrueLayerWithdrawal(transaction: OffRampTransaction): Promise<OffRampTransaction> {
    console.log('Processing TrueLayer withdrawal:', transaction);
    transaction.status = 'processing';
    this.updateTransaction(transaction);
    return transaction;
  }

  private async processPlaidWithdrawal(transaction: OffRampTransaction): Promise<OffRampTransaction> {
    console.log('Processing Plaid withdrawal:', transaction);
    transaction.status = 'processing';
    this.updateTransaction(transaction);
    return transaction;
  }

  private async processChimoneyWithdrawal(transaction: OffRampTransaction): Promise<OffRampTransaction> {
    console.log('Processing Chimoney withdrawal:', transaction);
    transaction.status = 'processing';
    this.updateTransaction(transaction);
    return transaction;
  }

  private async processPaystackWithdrawal(transaction: OffRampTransaction): Promise<OffRampTransaction> {
    console.log('Processing Paystack withdrawal:', transaction);
    transaction.status = 'processing';
    this.updateTransaction(transaction);
    return transaction;
  }

  async completeWithdrawal(transactionId: string, transactionHash?: string): Promise<OffRampTransaction> {
    const transaction = this.getTransaction(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    transaction.status = 'completed';
    transaction.completedAt = Date.now();
    transaction.transactionHash = transactionHash;

    this.updateTransaction(transaction);
    return transaction;
  }

  async failWithdrawal(transactionId: string, reason: string): Promise<OffRampTransaction> {
    const transaction = this.getTransaction(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    transaction.status = 'failed';
    transaction.completedAt = Date.now();
    transaction.failureReason = reason;

    this.updateTransaction(transaction);
    return transaction;
  }

  async getTransactionStatus(transactionId: string): Promise<OffRampTransaction | null> {
    return this.getTransaction(transactionId);
  }

  getRecentTransactions(limit: number = 10): OffRampTransaction[] {
    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem('offramp_transactions');
      const transactions: OffRampTransaction[] = stored ? JSON.parse(stored) : [];
      return transactions.slice(0, limit);
    } catch (error) {
      console.error('Failed to get recent transactions:', error);
      return [];
    }
  }

  saveBankAccount(account: BankAccount): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('bank_accounts');
      const accounts: BankAccount[] = stored ? JSON.parse(stored) : [];
      
      const existingIndex = accounts.findIndex(a => a.id === account.id);
      if (existingIndex !== -1) {
        accounts[existingIndex] = account;
      } else {
        accounts.push(account);
      }
      
      localStorage.setItem('bank_accounts', JSON.stringify(accounts));
    } catch (error) {
      console.error('Failed to save bank account:', error);
    }
  }

  getBankAccounts(): BankAccount[] {
    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem('bank_accounts');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get bank accounts:', error);
      return [];
    }
  }

  private getExchangeRate(cryptoCurrency: string, fiatCurrency: string): number {
    // Simulated exchange rates (crypto to fiat)
    const rates: Record<string, Record<string, number>> = {
      USDC: {
        USD: 1.0,
        EUR: 0.91,
        GBP: 0.79,
        NGN: 1550,
        KES: 130,
        GHS: 12,
        ZAR: 18.5,
      },
      USDT: {
        USD: 1.0,
        EUR: 0.91,
        GBP: 0.79,
        NGN: 1550,
        KES: 130,
        GHS: 12,
        ZAR: 18.5,
      },
      ETH: {
        USD: 2500,
        EUR: 2275,
        GBP: 1975,
        NGN: 3875000,
        KES: 325000,
        GHS: 30000,
        ZAR: 46250,
      },
      MATIC: {
        USD: 0.83,
        EUR: 0.76,
        GBP: 0.66,
        NGN: 1286,
        KES: 108,
        GHS: 10,
        ZAR: 15.4,
      },
    };

    return rates[cryptoCurrency]?.[fiatCurrency] || 1.0;
  }

  private saveTransaction(transaction: OffRampTransaction): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('offramp_transactions');
      const transactions: OffRampTransaction[] = stored ? JSON.parse(stored) : [];
      transactions.unshift(transaction);
      localStorage.setItem('offramp_transactions', JSON.stringify(transactions.slice(0, 50)));
    } catch (error) {
      console.error('Failed to save transaction:', error);
    }
  }

  private updateTransaction(transaction: OffRampTransaction): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('offramp_transactions');
      const transactions: OffRampTransaction[] = stored ? JSON.parse(stored) : [];
      const index = transactions.findIndex(t => t.transactionId === transaction.transactionId);
      
      if (index !== -1) {
        transactions[index] = transaction;
        localStorage.setItem('offramp_transactions', JSON.stringify(transactions));
      }
    } catch (error) {
      console.error('Failed to update transaction:', error);
    }
  }

  private getTransaction(transactionId: string): OffRampTransaction | null {
    if (typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem('offramp_transactions');
      const transactions: OffRampTransaction[] = stored ? JSON.parse(stored) : [];
      return transactions.find(t => t.transactionId === transactionId) || null;
    } catch (error) {
      console.error('Failed to get transaction:', error);
      return null;
    }
  }
}
