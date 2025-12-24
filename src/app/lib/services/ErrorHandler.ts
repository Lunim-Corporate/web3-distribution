import { ServiceError } from './types';

export class ErrorHandler {
  private static readonly ERROR_MESSAGES: Record<string, string> = {
    // User rejection errors
    'ACTION_REJECTED': 'You cancelled the transaction',
    'USER_REJECTED': 'You cancelled the transaction',
    
    // Network errors
    'NETWORK_ERROR': 'Network connection issue. Please check your internet',
    'UNSUPPORTED_NETWORK': 'Please switch to a supported network',
    'NETWORK_CHANGED': 'Network changed. Please refresh the page',
    
    // Wallet errors
    'WALLET_NOT_FOUND': 'No wallet detected. Please install MetaMask',
    'WALLET_NOT_CONNECTED': 'Please connect your wallet first',
    'INSUFFICIENT_FUNDS': 'Insufficient funds for this transaction',
    
    // Transaction errors
    'TRANSACTION_FAILED': 'Transaction failed. Please try again',
    'GAS_ESTIMATION_FAILED': 'Unable to estimate gas. Transaction may fail',
    'NONCE_TOO_LOW': 'Transaction nonce error. Please try again',
    'REPLACEMENT_UNDERPRICED': 'Gas price too low. Increase gas price',
    
    // Contract errors
    'CONTRACT_NOT_FOUND': 'Smart contract not found at this address',
    'CALL_EXCEPTION': 'Contract call failed. Check parameters',
    'EXECUTION_REVERTED': 'Transaction reverted. Check contract conditions',
    
    // Generic errors
    'UNKNOWN_ERROR': 'An unexpected error occurred',
    'TIMEOUT': 'Request timed out. Please try again',
  };

  private static readonly RETRYABLE_ERRORS = new Set([
    'NETWORK_ERROR',
    'TIMEOUT',
    'NONCE_TOO_LOW',
    'REPLACEMENT_UNDERPRICED',
  ]);

  static handle(error: any, context?: string): ServiceError {
    const errorCode = this.extractErrorCode(error);
    const message = this.getUserFriendlyMessage(errorCode, error);
    const isRetryable = this.RETRYABLE_ERRORS.has(errorCode);

    const serviceError: ServiceError = {
      code: errorCode,
      message: context ? `${context}: ${message}` : message,
      originalError: error,
      isRetryable,
    };

    console.error('Service Error:', serviceError);
    return serviceError;
  }

  private static extractErrorCode(error: any): string {
    // Check for ethers.js error codes
    if (error?.code) {
      const code = error.code.toString().toUpperCase();
      if (code === 'ACTION_REJECTED' || code === '4001') return 'ACTION_REJECTED';
      if (code === 'INSUFFICIENT_FUNDS') return 'INSUFFICIENT_FUNDS';
      if (code === 'NETWORK_ERROR') return 'NETWORK_ERROR';
      if (code === 'CALL_EXCEPTION') return 'CALL_EXCEPTION';
      if (code === 'NONCE_EXPIRED' || code === 'NONCE_TOO_LOW') return 'NONCE_TOO_LOW';
      if (code === 'REPLACEMENT_UNDERPRICED') return 'REPLACEMENT_UNDERPRICED';
    }

    // Check for MetaMask error codes
    if (error?.code === 4001) return 'USER_REJECTED';
    if (error?.code === -32002) return 'WALLET_NOT_CONNECTED';
    if (error?.code === -32603) return 'TRANSACTION_FAILED';

    // Check error message for common patterns
    const message = error?.message?.toLowerCase() || '';
    if (message.includes('user rejected') || message.includes('user denied')) {
      return 'USER_REJECTED';
    }
    if (message.includes('insufficient funds')) return 'INSUFFICIENT_FUNDS';
    if (message.includes('network')) return 'NETWORK_ERROR';
    if (message.includes('gas')) return 'GAS_ESTIMATION_FAILED';
    if (message.includes('revert')) return 'EXECUTION_REVERTED';
    if (message.includes('timeout')) return 'TIMEOUT';

    return 'UNKNOWN_ERROR';
  }

  private static getUserFriendlyMessage(errorCode: string, error: any): string {
    const baseMessage = this.ERROR_MESSAGES[errorCode] || this.ERROR_MESSAGES['UNKNOWN_ERROR'];
    
    // Add specific details for certain errors
    if (errorCode === 'EXECUTION_REVERTED' && error?.reason) {
      return `${baseMessage}: ${error.reason}`;
    }
    
    if (errorCode === 'INSUFFICIENT_FUNDS' && error?.shortfall) {
      return `${baseMessage}. Need ${error.shortfall} more`;
    }

    return baseMessage;
  }

  static isRetryable(error: ServiceError): boolean {
    return error.isRetryable;
  }

  static throwError(error: any, context?: string): never {
    throw this.handle(error, context);
  }
}
