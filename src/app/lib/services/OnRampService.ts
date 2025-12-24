import { BaseService } from './BaseService';

export interface OnRampProvider {
  name: 'stripe' | 'moonpay' | 'transak';
  displayName: string;
  supportedCurrencies: string[];
  supportedCrypto: string[];
}

export interface OnRampRequest {
  provider: 'stripe' | 'moonpay' | 'transak';
  fiatAmount: number;
  fiatCurrency: string;
  cryptoCurrency: string;
  walletAddress: string;
  email?: string;
}

export interface OnRampSession {
  sessionId: string;
  provider: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fiatAmount: number;
  fiatCurrency: string;
  cryptoAmount?: number;
  cryptoCurrency: string;
  walletAddress: string;
  createdAt: number;
  completedAt?: number;
  transactionHash?: string;
}

export class OnRampService extends BaseService {
  private static instance: OnRampService;

  private constructor() {
    super();
  }

  static getInstance(): OnRampService {
    if (!OnRampService.instance) {
      OnRampService.instance = new OnRampService();
    }
    return OnRampService.instance;
  }

  getProviders(): OnRampProvider[] {
    return [
      {
        name: 'stripe',
        displayName: 'Stripe On-Ramp',
        supportedCurrencies: ['USD', 'EUR', 'GBP'],
        supportedCrypto: ['USDC', 'USDT', 'ETH'],
      },
      {
        name: 'moonpay',
        displayName: 'MoonPay',
        supportedCurrencies: ['USD', 'EUR', 'GBP', 'KES'],
        supportedCrypto: ['USDC', 'USDT', 'ETH', 'MATIC'],
      },
      {
        name: 'transak',
        displayName: 'Transak',
        supportedCurrencies: ['USD', 'EUR', 'GBP', 'KES', 'NGN'],
        supportedCrypto: ['USDC', 'USDT', 'ETH', 'MATIC', 'BNB'],
      },
    ];
  }

  async createOnRampSession(request: OnRampRequest): Promise<OnRampSession> {
    try {
      const session: OnRampSession = {
        sessionId: `onramp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        provider: request.provider,
        status: 'pending',
        fiatAmount: request.fiatAmount,
        fiatCurrency: request.fiatCurrency,
        cryptoCurrency: request.cryptoCurrency,
        walletAddress: request.walletAddress,
        createdAt: Date.now(),
      };

      this.saveSession(session);

      // Simulate provider-specific session creation
      switch (request.provider) {
        case 'stripe':
          return this.createStripeSession(session);
        case 'moonpay':
          return this.createMoonPaySession(session);
        case 'transak':
          return this.createTransakSession(session);
        default:
          throw new Error('Unsupported provider');
      }
    } catch (error) {
      throw this.handleError(error, 'Failed to create on-ramp session');
    }
  }

  private async createStripeSession(session: OnRampSession): Promise<OnRampSession> {
    // In production, this would call Stripe's On-Ramp API
    // For now, we simulate the session creation
    console.log('Creating Stripe On-Ramp session:', session);
    
    // Simulate exchange rate calculation
    const exchangeRate = this.getExchangeRate(session.fiatCurrency, session.cryptoCurrency);
    session.cryptoAmount = session.fiatAmount * exchangeRate;
    
    this.updateSession(session);
    return session;
  }

  private async createMoonPaySession(session: OnRampSession): Promise<OnRampSession> {
    // In production, this would call MoonPay's API
    console.log('Creating MoonPay session:', session);
    
    const exchangeRate = this.getExchangeRate(session.fiatCurrency, session.cryptoCurrency);
    session.cryptoAmount = session.fiatAmount * exchangeRate;
    
    this.updateSession(session);
    return session;
  }

  private async createTransakSession(session: OnRampSession): Promise<OnRampSession> {
    // In production, this would call Transak's API
    console.log('Creating Transak session:', session);
    
    const exchangeRate = this.getExchangeRate(session.fiatCurrency, session.cryptoCurrency);
    session.cryptoAmount = session.fiatAmount * exchangeRate;
    
    this.updateSession(session);
    return session;
  }

  async completeOnRampSession(sessionId: string, transactionHash?: string): Promise<OnRampSession> {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    session.status = 'completed';
    session.completedAt = Date.now();
    session.transactionHash = transactionHash;

    this.updateSession(session);
    return session;
  }

  async getSessionStatus(sessionId: string): Promise<OnRampSession | null> {
    return this.getSession(sessionId);
  }

  getRecentSessions(limit: number = 10): OnRampSession[] {
    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem('onramp_sessions');
      const sessions: OnRampSession[] = stored ? JSON.parse(stored) : [];
      return sessions.slice(0, limit);
    } catch (error) {
      console.error('Failed to get recent sessions:', error);
      return [];
    }
  }

  private getExchangeRate(fiatCurrency: string, cryptoCurrency: string): number {
    // Simulated exchange rates
    const rates: Record<string, Record<string, number>> = {
      USD: {
        USDC: 1.0,
        USDT: 1.0,
        ETH: 0.0004,
        MATIC: 1.2,
        BNB: 0.0035,
      },
      EUR: {
        USDC: 1.1,
        USDT: 1.1,
        ETH: 0.00044,
        MATIC: 1.32,
        BNB: 0.00385,
      },
      GBP: {
        USDC: 1.27,
        USDT: 1.27,
        ETH: 0.00051,
        MATIC: 1.52,
        BNB: 0.00445,
      },
      KES: {
        USDC: 0.0077,
        USDT: 0.0077,
        ETH: 0.0000031,
        MATIC: 0.0092,
        BNB: 0.000027,
      },
    };

    return rates[fiatCurrency]?.[cryptoCurrency] || 1.0;
  }

  private saveSession(session: OnRampSession): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('onramp_sessions');
      const sessions: OnRampSession[] = stored ? JSON.parse(stored) : [];
      sessions.unshift(session);
      localStorage.setItem('onramp_sessions', JSON.stringify(sessions.slice(0, 50)));
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }

  private updateSession(session: OnRampSession): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('onramp_sessions');
      const sessions: OnRampSession[] = stored ? JSON.parse(stored) : [];
      const index = sessions.findIndex(s => s.sessionId === session.sessionId);
      
      if (index !== -1) {
        sessions[index] = session;
        localStorage.setItem('onramp_sessions', JSON.stringify(sessions));
      }
    } catch (error) {
      console.error('Failed to update session:', error);
    }
  }

  private getSession(sessionId: string): OnRampSession | null {
    if (typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem('onramp_sessions');
      const sessions: OnRampSession[] = stored ? JSON.parse(stored) : [];
      return sessions.find(s => s.sessionId === sessionId) || null;
    } catch (error) {
      console.error('Failed to get session:', error);
      return null;
    }
  }
}
