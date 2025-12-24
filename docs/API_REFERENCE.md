# API Reference

## Service Layer API

### WalletService

Singleton service for wallet management.

#### `getInstance(): WalletService`

Get the singleton instance.

```typescript
const walletService = WalletService.getInstance();
```

#### `linkAccount(): Promise<WalletInfo>`

Link user's wallet account.

**Returns**: `WalletInfo` object containing address, balance, chainId, networkName, and connection status.

**Throws**: ServiceError if wallet not found or user rejects.

```typescript
const walletInfo = await walletService.linkAccount();
console.log(walletInfo.address);
```

#### `getWalletInfo(): Promise<WalletInfo>`

Get current wallet information.

```typescript
const info = await walletService.getWalletInfo();
```

#### `ensureNetwork(requiredChainId: number): Promise<void>`

Ensure wallet is on the required network.

```typescript
await walletService.ensureNetwork(80001); // Mumbai
```

#### `switchNetwork(chainId: number): Promise<void>`

Switch to a different network.

```typescript
await walletService.switchNetwork(137); // Polygon
```

#### `getNetworkName(chainId: number): string`

Get human-readable network name.

```typescript
const name = walletService.getNetworkName(80001); // "Polygon Mumbai"
```

---

### PaymentService

Singleton service for payment transactions.

#### `getInstance(): PaymentService`

Get the singleton instance.

```typescript
const paymentService = PaymentService.getInstance();
```

#### `sendPayment(request: PaymentRequest): Promise<TransactionReceipt>`

Send a single payment.

**Parameters**:
- `request.to`: Recipient address
- `request.amount`: Amount in ETH (string)
- `request.currency`: Optional currency (default: 'ETH')
- `request.memo`: Optional memo

```typescript
const receipt = await paymentService.sendPayment({
  to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  amount: '0.1',
  memo: 'Payment for services',
});
```

#### `sendBatchPayments(request: BatchPaymentRequest): Promise<TransactionReceipt[]>`

Send multiple payments.

```typescript
const receipts = await paymentService.sendBatchPayments({
  payments: [
    { to: '0xAddress1', amount: '0.5' },
    { to: '0xAddress2', amount: '0.3' },
  ],
});
```

#### `estimateGas(request: PaymentRequest): Promise<GasEstimate>`

Estimate gas for a payment.

**Returns**: Gas estimate with gasLimit, gasPrice, and estimatedCost.

```typescript
const estimate = await paymentService.estimateGas({
  to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  amount: '0.1',
});
console.log(`Cost: ${estimate.estimatedCost} ETH`);
```

#### `validatePayment(request: PaymentRequest): Promise<{valid: boolean, error?: string}>`

Validate a payment before sending.

```typescript
const validation = await paymentService.validatePayment(payment);
if (!validation.valid) {
  console.error(validation.error);
}
```

#### `getBalance(address?: string): Promise<string>`

Get balance for an address (defaults to current account).

```typescript
const balance = await paymentService.getBalance();
```

---

### ContractService

Singleton service for smart contract interactions.

#### `getInstance(): ContractService`

Get the singleton instance.

```typescript
const contractService = ContractService.getInstance();
```

#### `loadContract(address: string, abi: any[]): Promise<Contract>`

Load a contract instance.

```typescript
const contract = await contractService.loadContract(
  '0xContractAddress',
  CONTRACT_ABI
);
```

#### `distributeRevenue(contractAddress: string, abi: any[], projectId: string, amount: string): Promise<TransactionReceipt>`

Distribute revenue to project contributors.

```typescript
const receipt = await contractService.distributeRevenue(
  contractAddress,
  REVENUE_DISTRIBUTOR_ABI,
  'project-001',
  '1.0'
);
```

#### `getProjectDetails(contractAddress: string, abi: any[], projectId: string): Promise<ProjectDetails>`

Get project details from contract.

```typescript
const details = await contractService.getProjectDetails(
  contractAddress,
  PROJECT_REGISTRY_ABI,
  'project-001'
);
```

#### `registerProject(contractAddress: string, abi: any[], projectId: string, contributors: string[], shares: number[]): Promise<TransactionReceipt>`

Register a new project.

```typescript
const receipt = await contractService.registerProject(
  contractAddress,
  PROJECT_REGISTRY_ABI,
  'project-001',
  ['0xAddr1', '0xAddr2'],
  [60, 40]
);
```

#### `isContractDeployed(address: string): Promise<boolean>`

Check if a contract is deployed at an address.

```typescript
const deployed = await contractService.isContractDeployed('0xAddress');
```

---

### TransactionService

Singleton service for transaction tracking.

#### `getInstance(): TransactionService`

Get the singleton instance.

```typescript
const transactionService = TransactionService.getInstance();
```

#### `trackTransaction(hash: string, description?: string): Promise<TransactionReceipt>`

Track a transaction by hash.

```typescript
const receipt = await transactionService.trackTransaction(
  '0xTransactionHash',
  'Revenue distribution'
);
```

#### `getTransactionStatus(hash: string): Promise<TransactionStatus>`

Get current status of a transaction.

```typescript
const status = await transactionService.getTransactionStatus('0xHash');
// Returns: 'pending' | 'confirmed' | 'failed'
```

#### `getRecentTransactions(limit: number = 10): TransactionReceipt[]`

Get recent transactions from local storage.

```typescript
const recent = transactionService.getRecentTransactions(5);
```

#### `getPendingTransactions(): TransactionReceipt[]`

Get all pending transactions.

```typescript
const pending = transactionService.getPendingTransactions();
```

#### `refreshPendingTransactions(): Promise<void>`

Refresh status of all pending transactions.

```typescript
await transactionService.refreshPendingTransactions();
```

#### `clearTransactionHistory(): void`

Clear all stored transactions.

```typescript
transactionService.clearTransactionHistory();
```

---

### ErrorHandler

Static utility for error handling.

#### `handle(error: any, context?: string): ServiceError`

Convert any error to a ServiceError with user-friendly message.

```typescript
try {
  await someOperation();
} catch (error) {
  const serviceError = ErrorHandler.handle(error, 'Operation failed');
  console.error(serviceError.message);
}
```

#### `isRetryable(error: ServiceError): boolean`

Check if an error can be retried.

```typescript
if (ErrorHandler.isRetryable(serviceError)) {
  // Show retry button
}
```

---

## Types

### WalletInfo

```typescript
interface WalletInfo {
  address: string;
  balance: string;
  chainId: number;
  networkName: string;
  isConnected: boolean;
}
```

### PaymentRequest

```typescript
interface PaymentRequest {
  to: string;
  amount: string;
  currency?: 'ETH' | 'MATIC' | 'BNB';
  memo?: string;
}
```

### TransactionReceipt

```typescript
interface TransactionReceipt {
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
```

### GasEstimate

```typescript
interface GasEstimate {
  gasLimit: string;
  gasPrice: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  estimatedCost: string;
}
```

### ProjectDetails

```typescript
interface ProjectDetails {
  projectId: string;
  name: string;
  totalRevenue: string;
  contributors: string[];
  shares: number[];
  isActive: boolean;
}
```

### ServiceError

```typescript
interface ServiceError {
  code: string;
  message: string;
  originalError?: any;
  isRetryable: boolean;
}
```

---

## Configuration Functions

### `getContractAddress(contractName, network?): string`

Get contract address for a network.

```typescript
import { getContractAddress } from '@/lib/contracts';

const address = getContractAddress('RevenueDistributor', 'mumbai');
```

### `getNetworkConfig(network?): NetworkConfig`

Get network configuration.

```typescript
import { getNetworkConfig } from '@/lib/contracts';

const config = getNetworkConfig('mumbai');
console.log(config.rpcUrl);
```

### `isContractDeployed(contractName, network?): boolean`

Check if contract is deployed on a network.

```typescript
import { isContractDeployed } from '@/lib/contracts';

if (isContractDeployed('RevenueDistributor', 'mumbai')) {
  // Contract is deployed
}
```

---

## React Hooks

### `useWallet()`

Hook for wallet functionality.

```typescript
import { useWallet } from '@/lib/wallet';

function MyComponent() {
  const {
    account,
    isConnected,
    isConnecting,
    chainId,
    balance,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    sendTransaction,
    getNetworkName,
  } = useWallet();

  return (
    <button onClick={connectWallet}>
      {isConnected ? account : 'Link Account'}
    </button>
  );
}
```

---

## Components

### TransactionMonitor

Component for displaying recent transactions.

```typescript
import { TransactionMonitor } from '@/components/dashboard/TransactionMonitor';

function Dashboard() {
  return <TransactionMonitor />;
}
```

**Features**:
- Auto-refresh every 10 seconds
- Shows last 5 transactions
- Status indicators (✅ confirmed, ⏳ pending, ❌ failed)
- Links to block explorer
- Manual refresh button
- Clear history option

---

## Constants

### Network Chain IDs

```typescript
const CHAIN_IDS = {
  ETHEREUM_MAINNET: 1,
  GOERLI: 5,
  SEPOLIA: 11155111,
  POLYGON: 137,
  MUMBAI: 80001,
  BSC: 56,
  BSC_TESTNET: 97,
};
```

### Transaction Status

```typescript
enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
}
```

---

## Error Codes

Common error codes returned by ErrorHandler:

- `ACTION_REJECTED`: User cancelled transaction
- `USER_REJECTED`: User rejected connection
- `NETWORK_ERROR`: Network connection issue
- `UNSUPPORTED_NETWORK`: Network not supported
- `WALLET_NOT_FOUND`: MetaMask not installed
- `WALLET_NOT_CONNECTED`: Wallet not connected
- `INSUFFICIENT_FUNDS`: Not enough balance
- `TRANSACTION_FAILED`: Transaction failed
- `GAS_ESTIMATION_FAILED`: Cannot estimate gas
- `CONTRACT_NOT_FOUND`: Contract not at address
- `CALL_EXCEPTION`: Contract call failed
- `EXECUTION_REVERTED`: Transaction reverted
- `UNKNOWN_ERROR`: Unexpected error
