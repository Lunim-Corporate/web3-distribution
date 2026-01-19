import { ethers } from 'ethers';
import { ErrorHandler } from './ErrorHandler';
import { ServiceError } from './types';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export abstract class BaseService {
  protected provider: ethers.BrowserProvider | null = null;
  protected signer: ethers.Signer | null = null;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    // Defer initialization to avoid race conditions
    if (typeof window !== 'undefined' && window.ethereum) {
      this.initializationPromise = this.initializeProvider();
    }
  }

  protected async initializeProvider(): Promise<void> {
    if (this.provider) return; // Already initialized
    
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        this.provider = new ethers.BrowserProvider(window.ethereum);
        // Wait for provider to be ready
        await this.provider.getNetwork().catch(() => {
          // Network call failed, but provider is initialized
        });
      } catch (error) {
        console.error('[BaseService] Provider initialization error:', error);
        this.provider = null;
      }
    }
  }

  protected async getSigner(): Promise<ethers.Signer> {
    // Wait for initialization if in progress
    if (this.initializationPromise) {
      await this.initializationPromise;
    }

    if (!this.provider) {
      throw new Error('Provider not initialized. Please connect your wallet.');
    }
    
    try {
      if (!this.signer) {
        this.signer = await this.provider.getSigner();
      }
      return this.signer;
    } catch (error: any) {
      console.error('[BaseService] getSigner error:', error);
      throw new Error(error.message || 'Failed to get signer. Please unlock your wallet.');
    }
  }

  protected async ensureConnection(): Promise<void> {
    // Wait for initialization if in progress
    if (this.initializationPromise) {
      await this.initializationPromise;
    }

    if (!this.provider) {
      await this.initializeProvider();
    }
    
    if (!this.provider) {
      throw new Error('Wallet connection required. Please install MetaMask or another Web3 wallet.');
    }

    if (!this.signer) {
      await this.getSigner();
    }
  }

  protected handleError(error: any, context: string): ServiceError {
    return ErrorHandler.handle(error, context);
  }

  protected async getNetwork(): Promise<ethers.Network> {
    await this.ensureConnection();
    return await this.provider!.getNetwork();
  }

  protected async getBlockNumber(): Promise<number> {
    await this.ensureConnection();
    return await this.provider!.getBlockNumber();
  }
}
