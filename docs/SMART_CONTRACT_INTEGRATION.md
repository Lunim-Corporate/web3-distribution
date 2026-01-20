# Smart Contract Integration Guide

## Overview

This document describes the blockchain abstraction layer that enables the UI to use simple business actions instead of direct Ethereum calls. The service layer provides safety, improved UX, testing capabilities, and scalability.

## Architecture

### Service Layer Structure

```
src/app/lib/services/
├── index.ts                 # Exports all services
├── types.ts                 # TypeScript interfaces
├── BaseService.ts           # Base class for all services
├── ErrorHandler.ts          # User-friendly error handling
├── WalletService.ts         # Account management
├── PaymentService.ts        # Payment transactions
├── ContractService.ts       # Smart contract interactions
└── TransactionService.ts    # Transaction tracking
```

### Key Components

1. **BaseService**: Provides provider initialization, signer management, and connection handling
2. **ErrorHandler**: Maps blockchain errors to user-friendly messages
3. **WalletService**: Handles wallet connection and network management
4. **PaymentService**: Manages payment transactions with validation and gas estimation
5. **ContractService**: Abstracts smart contract interactions
6. **TransactionService**: Tracks and persists transaction history

## Business Actions

### Link Account

Instead of "Connect Wallet", use "Link Account":

```typescript
import { WalletService } from '@/lib/services/WalletService';

const walletService = WalletService.getInstance();
const walletInfo = await walletService.linkAccount();
```

### Send Payment

Simple payment with validation:

```typescript
import { PaymentService } from '@/lib/services/PaymentService';

const paymentService = PaymentService.getInstance();

const payment = {
  to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  amount: '0.1',
  memo: 'Payment for services',
};

// Validate before sending
const validation = await paymentService.validatePayment(payment);
if (!validation.valid) {
  console.error(validation.error);
  return;
}

// Estimate gas
const gasEstimate = await paymentService.estimateGas(payment);
console.log(`Estimated cost: ${gasEstimate.estimatedCost} ETH`);

// Send payment
const receipt = await paymentService.sendPayment(payment);
console.log(`Transaction hash: ${receipt.hash}`);
```

### Split Revenue

Distribute revenue using smart contracts:

```typescript
import { ContractService } from '@/lib/services/ContractService';
import { getContractAddress, REVENUE_DISTRIBUTOR_ABI } from '@/lib/contracts';

const contractService = ContractService.getInstance();
const contractAddress = getContractAddress('RevenueDistributor', 'mumbai');

const receipt = await contractService.distributeRevenue(
  contractAddress,
  REVENUE_DISTRIBUTOR_ABI,
  'project-001',
  '1.0' // Amount in ETH
);
```

## Smart Contracts

### ProjectRegistry

Manages project registration and contributor shares.

**Key Functions:**

- `registerProject(projectId, name, contributors, shares)`: Register a new project
- `getProject(projectId)`: Get project details
- `updateProject(projectId, contributors, shares)`: Update project configuration
- `deactivateProject(projectId)`: Deactivate a project

### RevenueDistributor

Handles revenue distribution to contributors.

**Key Functions:**

- `distributeRevenue(projectId)`: Distribute revenue based on shares (payable)
- `getContributorShare(projectId, contributor)`: Get contributor's share percentage
- `withdrawContributorBalance()`: Withdraw accumulated balance
- `getContributorBalance(contributor)`: Check pending balance

## Deployment

### Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.local.example .env.local
# Edit .env.local with your values
```

3. Get testnet tokens:
- Mumbai: https://faucet.polygon.technology/

### Compile Contracts

```bash
npm run compile
```

### Deploy to Mumbai Testnet

```bash
npm run deploy:mumbai
```

This will:
1. Deploy ProjectRegistry contract
2. Deploy RevenueDistributor contract
3. Save deployment info to `deployments/` directory
4. Display contract addresses

### Update Configuration

After deployment, update `src/app/lib/contracts.ts` with the deployed addresses:

```typescript
export const CONTRACT_ADDRESSES = {
  mumbai: {
    ProjectRegistry: '0xYourProjectRegistryAddress',
    RevenueDistributor: '0xYourRevenueDistributorAddress',
  },
};
```

### Verify Contracts

```bash
npm run verify:mumbai
```

## Testing

### Run Tests

```bash
npm test
```

### Run Tests with Gas Report

```bash
npm run test:gas
```

### Test Coverage

The test suite includes:
- Payment validation tests
- Gas estimation tests
- Contract deployment tests
- Revenue distribution tests
- Contributor withdrawal tests
- Project management tests

## Usage Examples

### Register a Project

```typescript
import { ContractService } from '@/lib/services/ContractService';
import { getContractAddress, PROJECT_REGISTRY_ABI } from '@/lib/contracts';

const contractService = ContractService.getInstance();
const registryAddress = getContractAddress('ProjectRegistry', 'mumbai');

const receipt = await contractService.registerProject(
  registryAddress,
  PROJECT_REGISTRY_ABI,
  'project-001',
  ['0xContributor1', '0xContributor2'],
  [60, 40] // 60% and 40% shares
);
```

### Get Project Details

```typescript
const projectDetails = await contractService.getProjectDetails(
  registryAddress,
  PROJECT_REGISTRY_ABI,
  'project-001'
);

console.log(projectDetails);
// {
//   projectId: 'project-001',
//   name: 'My Project',
//   totalRevenue: '5.0',
//   contributors: ['0x...', '0x...'],
//   shares: [60, 40],
//   isActive: true
// }
```

### Batch Payments

```typescript
import { PaymentService } from '@/lib/services/PaymentService';

const paymentService = PaymentService.getInstance();

const batchPayment = {
  payments: [
    { to: '0xAddress1', amount: '0.5', memo: 'Payment 1' },
    { to: '0xAddress2', amount: '0.3', memo: 'Payment 2' },
    { to: '0xAddress3', amount: '0.2', memo: 'Payment 3' },
  ],
};

// Validate batch
const validation = await paymentService.validateBatchPayment(batchPayment);
if (!validation.valid) {
  console.error(validation.error);
  return;
}

// Send batch
const receipts = await paymentService.sendBatchPayments(batchPayment);
console.log(`Sent ${receipts.length} payments`);
```

### Monitor Transactions

```typescript
import { TransactionService } from '@/lib/services/TransactionService';

const transactionService = TransactionService.getInstance();

// Get recent transactions
const recent = transactionService.getRecentTransactions(10);

// Get pending transactions
const pending = transactionService.getPendingTransactions();

// Refresh pending transactions
await transactionService.refreshPendingTransactions();
```

## Error Handling

The ErrorHandler provides user-friendly error messages:

```typescript
try {
  await paymentService.sendPayment(payment);
} catch (error: any) {
  // Error is already formatted with user-friendly message
  console.error(error.message);
  // Examples:
  // - "You cancelled the transaction"
  // - "Insufficient funds for this transaction"
  // - "Please connect your wallet first"
  // - "Network connection issue. Please check your internet"
}
```

### Retryable Errors

Some errors can be retried:

```typescript
import { ErrorHandler } from '@/lib/services/ErrorHandler';

try {
  await paymentService.sendPayment(payment);
} catch (error: any) {
  const serviceError = ErrorHandler.handle(error);
  
  if (serviceError.isRetryable) {
    // Show retry button to user
    console.log('This operation can be retried');
  }
}
```

## Configuration

### Feature Flags

Control features via environment variables:

```bash
# Enable smart contract mode
NEXT_PUBLIC_USE_SMART_CONTRACT=true

# Enable batch payments
NEXT_PUBLIC_ENABLE_BATCH_PAYMENTS=true

# Enable gas estimation
NEXT_PUBLIC_ENABLE_GAS_ESTIMATION=true

# Set default network
NEXT_PUBLIC_DEFAULT_NETWORK=mumbai
```

### Network Configuration

Add custom networks in `src/app/lib/contracts.ts`:

```typescript
export const NETWORK_CONFIG = {
  myNetwork: {
    chainId: 12345,
    name: 'My Custom Network',
    rpcUrl: 'https://rpc.mynetwork.com',
    blockExplorer: 'https://explorer.mynetwork.com',
  },
};
```

## Troubleshooting

### Common Issues

**Issue**: "MetaMask is not installed"
- **Solution**: Install MetaMask browser extension

**Issue**: "Insufficient funds for gas fees"
- **Solution**: Get testnet tokens from faucet or add funds

**Issue**: "Transaction reverted"
- **Solution**: Check contract conditions (e.g., shares must total 100%)

**Issue**: "Network changed. Please refresh the page"
- **Solution**: Refresh the page after switching networks

**Issue**: "Contract not deployed at this address"
- **Solution**: Verify contract addresses in configuration

### Debug Mode

Enable detailed logging:

```typescript
// In browser console
localStorage.setItem('DEBUG', 'true');
```

### Gas Issues

If transactions fail due to gas:

1. Check gas estimation:
```typescript
const estimate = await paymentService.estimateGas(payment);
console.log('Gas estimate:', estimate);
```

2. Increase gas limit manually:
```typescript
// In ContractService or PaymentService
const txOptions = {
  gasLimit: 500000, // Increase if needed
};
```

## Security Best Practices

1. **Never commit private keys**: Use environment variables
2. **Validate all inputs**: Use service validation methods
3. **Test on testnet first**: Always test before mainnet deployment
4. **Use hardware wallets**: For production deployments
5. **Audit contracts**: Get professional security audit before mainnet
6. **Monitor transactions**: Use TransactionMonitor component
7. **Set spending limits**: Implement approval workflows for large amounts

## Performance Optimization

1. **Batch operations**: Use batch payment methods when possible
2. **Cache contract instances**: ContractService caches loaded contracts
3. **Optimize gas**: Use gas estimation before transactions
4. **Lazy load services**: Services use singleton pattern
5. **Transaction pooling**: Group multiple operations when possible

## Support

For issues or questions:
- Check the troubleshooting section
- Review test files for examples
- Check contract events for debugging
- Use block explorer to verify transactions

## License

MIT License - See LICENSE file for details
