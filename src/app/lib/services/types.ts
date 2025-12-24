export interface WalletInfo {
  address: string;
  balance: string;
  chainId: number;
  networkName: string;
  isConnected: boolean;
}

export interface TransactionRequest {
  to: string;
  value: string;
  data?: string;
  gasLimit?: string;
}

export interface TransactionReceipt {
  hash: string;
  from: string;
  to: string;
  value: string;
  blockNumber: number;
  status: TransactionStatus;
  timestamp: number;
  gasUsed: string;
  effectiveGasPrice: string;
}

export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
}

export interface PaymentRequest {
  to: string;
  amount: string;
  currency?: 'ETH' | 'MATIC' | 'BNB';
  memo?: string;
}

export interface BatchPaymentRequest {
  payments: PaymentRequest[];
}

export interface GasEstimate {
  gasLimit: string;
  gasPrice: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  estimatedCost: string;
}

export interface ContractCallRequest {
  contractAddress: string;
  functionName: string;
  args: any[];
  value?: string;
}

export interface ProjectDetails {
  projectId: string;
  name: string;
  totalRevenue: string;
  contributors: string[];
  shares: number[];
  isActive: boolean;
}

export interface NetworkConfig {
  chainId: string;
  chainName: string;
  rpcUrls: string[];
  blockExplorerUrls: string[];
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export interface ServiceError {
  code: string;
  message: string;
  originalError?: any;
  isRetryable: boolean;
}
