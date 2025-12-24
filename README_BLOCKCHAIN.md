# Blockchain Abstraction Layer

## Quick Start

This project implements a full blockchain abstraction layer that replaces direct Ethereum calls with simple business actions.

### Installation

```bash
npm install
```

### Configuration

1. Copy environment template:
```bash
cp .env.local.example .env.local
```

2. Edit `.env.local` with your configuration

3. Get testnet tokens from [Polygon Faucet](https://faucet.polygon.technology/)

### Development

```bash
# Start development server
npm run dev

# Compile smart contracts
npm run compile

# Run tests
npm test

# Deploy to Mumbai testnet
npm run deploy:mumbai
```

## Features

✅ **Service Layer Architecture**
- Clean separation between UI and blockchain
- Singleton pattern for service instances
- Type-safe interfaces

✅ **User-Friendly Actions**
- "Link Account" instead of "Connect Wallet"
- "Send Payment" instead of raw transactions
- "Split Revenue" for smart contract distribution

✅ **Error Handling**
- User-friendly error messages
- Retryable error detection
- Detailed error context

✅ **Transaction Management**
- Automatic transaction tracking
- Real-time status updates
- Transaction history persistence

✅ **Gas Optimization**
- Gas estimation before transactions
- Batch payment support
- Optimized contract calls

✅ **Smart Contracts**
- ProjectRegistry for project management
- RevenueDistributor for automatic splits
- OpenZeppelin security standards

## Architecture

```
┌─────────────────────────────────────────┐
│           UI Components                  │
│  (PaymentSplitter, SmartContractPanel)  │
└──────────────┬──────────────────────────┘
               │
               │ Business Actions
               │
┌──────────────▼──────────────────────────┐
│         Service Layer                    │
│  ┌────────────────────────────────────┐ │
│  │ WalletService                      │ │
│  │ PaymentService                     │ │
│  │ ContractService                    │ │
│  │ TransactionService                 │ │
│  └────────────────────────────────────┘ │
└──────────────┬──────────────────────────┘
               │
               │ ethers.js
               │
┌──────────────▼──────────────────────────┐
│         Blockchain Layer                 │
│  ┌────────────────────────────────────┐ │
│  │ Ethereum / Polygon Network         │ │
│  │ Smart Contracts                    │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## Usage Examples

### Link Account

```typescript
import { WalletService } from '@/lib/services/WalletService';

const walletService = WalletService.getInstance();
const walletInfo = await walletService.linkAccount();
```

### Send Payment

```typescript
import { PaymentService } from '@/lib/services/PaymentService';

const paymentService = PaymentService.getInstance();
const receipt = await paymentService.sendPayment({
  to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  amount: '0.1',
  memo: 'Payment for services',
});
```

### Split Revenue

```typescript
import { ContractService } from '@/lib/services/ContractService';
import { getContractAddress, REVENUE_DISTRIBUTOR_ABI } from '@/lib/contracts';

const contractService = ContractService.getInstance();
const contractAddress = getContractAddress('RevenueDistributor', 'mumbai');

const receipt = await contractService.distributeRevenue(
  contractAddress,
  REVENUE_DISTRIBUTOR_ABI,
  'project-001',
  '1.0'
);
```

## Documentation

- [Smart Contract Integration Guide](./docs/SMART_CONTRACT_INTEGRATION.md)
- [API Reference](./docs/API_REFERENCE.md)

## Project Structure

```
web3-distribution/
├── src/app/lib/
│   ├── services/              # Service layer
│   │   ├── BaseService.ts
│   │   ├── WalletService.ts
│   │   ├── PaymentService.ts
│   │   ├── ContractService.ts
│   │   ├── TransactionService.ts
│   │   ├── ErrorHandler.ts
│   │   └── types.ts
│   ├── contracts.ts           # Contract configuration
│   └── wallet.tsx             # Wallet provider
├── contracts/                 # Solidity contracts
│   ├── ProjectRegistry.sol
│   ├── RevenueDistributor.sol
│   └── interfaces/
├── scripts/                   # Deployment scripts
│   ├── deploy.js
│   └── verify.js
├── test/                      # Integration tests
│   ├── PaymentService.test.ts
│   └── ContractService.test.ts
├── docs/                      # Documentation
│   ├── SMART_CONTRACT_INTEGRATION.md
│   └── API_REFERENCE.md
└── deployments/               # Deployment artifacts
```

## Testing

### Run All Tests

```bash
npm test
```

### Run with Gas Report

```bash
npm run test:gas
```

### Test Coverage

- ✅ Payment validation
- ✅ Gas estimation
- ✅ Contract deployment
- ✅ Revenue distribution
- ✅ Contributor withdrawals
- ✅ Project management

## Deployment

### Deploy to Mumbai Testnet

```bash
npm run deploy:mumbai
```

### Verify Contracts

```bash
npm run verify:mumbai
```

### Update Configuration

After deployment, update contract addresses in `src/app/lib/contracts.ts`

## Security

- ✅ OpenZeppelin contracts for security
- ✅ ReentrancyGuard on payable functions
- ✅ Ownable for access control
- ✅ Input validation
- ✅ Safe math operations

## Performance

- ✅ Singleton pattern for services
- ✅ Contract instance caching
- ✅ Batch payment support
- ✅ Gas optimization
- ✅ Transaction pooling

## Browser Support

- Chrome (with MetaMask)
- Firefox (with MetaMask)
- Brave (built-in wallet)
- Edge (with MetaMask)

## Networks Supported

- Ethereum Mainnet
- Polygon Mainnet
- Polygon Mumbai (Testnet)
- BSC Mainnet
- BSC Testnet
- Hardhat Local

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For issues or questions:
- Check [documentation](./docs/)
- Review [test files](./test/)
- Open an issue on GitHub

## Roadmap

- [ ] Multi-signature wallet support
- [ ] Layer 2 integration (Optimism, Arbitrum)
- [ ] ERC-20 token support
- [ ] Advanced analytics dashboard
- [ ] Mobile app support
- [ ] Gasless transactions (meta-transactions)
