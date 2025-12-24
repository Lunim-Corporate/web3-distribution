# Getting Started with Blockchain Abstraction Layer

## Prerequisites

- Node.js 18+ installed
- MetaMask browser extension
- Basic understanding of blockchain concepts

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure Environment

1. Copy the environment template:
```bash
cp .env.local.example .env.local
```

2. Edit `.env.local` and set:
```bash
# Enable smart contract features
NEXT_PUBLIC_USE_SMART_CONTRACT=false  # Set to true after deployment
NEXT_PUBLIC_DEFAULT_NETWORK=mumbai

# Add your RPC URLs (optional, defaults provided)
NEXT_PUBLIC_MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com/
```

## Step 3: Get Testnet Tokens

1. Visit [Polygon Faucet](https://faucet.polygon.technology/)
2. Connect your MetaMask wallet
3. Switch to Mumbai Testnet
4. Request test MATIC tokens

## Step 4: Compile Smart Contracts

```bash
npm run compile
```

Expected output:
```
Compiled 7 Solidity files successfully
```

## Step 5: Run Tests (Optional)

```bash
npm test
```

This will run integration tests for:
- Payment validation
- Gas estimation
- Contract deployment
- Revenue distribution

## Step 6: Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 7: Test the UI

### Link Your Account

1. Navigate to the dashboard
2. Click "Link Account" button
3. Approve MetaMask connection
4. Verify your account is connected

### Test Payment Functionality

1. Go to Payment Splitter section
2. Click "New Payment Split"
3. Select a project
4. Enter amount (in ETH)
5. Click "Calculate Splits"
6. Review the split amounts
7. Click "Send Payment" (requires admin role)

### Monitor Transactions

1. Check the Transaction Monitor component
2. View recent transactions
3. Click "Refresh" to update status
4. Click transaction hash to view on block explorer

## Step 8: Deploy Smart Contracts (Optional)

### Configure Deployment

1. Add your private key to `.env.local`:
```bash
PRIVATE_KEY=your_private_key_without_0x_prefix
```

⚠️ **Security Warning**: Never commit your private key to version control!

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

After deployment, update `src/app/lib/contracts.ts`:

```typescript
export const CONTRACT_ADDRESSES = {
  mumbai: {
    ProjectRegistry: '0xYourProjectRegistryAddress',
    RevenueDistributor: '0xYourRevenueDistributorAddress',
  },
};
```

### Enable Smart Contract Mode

Update `.env.local`:
```bash
NEXT_PUBLIC_USE_SMART_CONTRACT=true
```

Restart the development server.

## Step 9: Verify Contracts (Optional)

1. Get Polygonscan API key from [Polygonscan](https://polygonscan.com/apis)

2. Add to `.env.local`:
```bash
POLYGONSCAN_API_KEY=your_api_key
```

3. Run verification:
```bash
npm run verify:mumbai
```

## Common Issues & Solutions

### Issue: "MetaMask is not installed"
**Solution**: Install [MetaMask extension](https://metamask.io/download/)

### Issue: "Insufficient funds for gas fees"
**Solution**: Get more test MATIC from the faucet

### Issue: "Wrong network"
**Solution**: Switch to Mumbai Testnet in MetaMask

### Issue: "Transaction failed"
**Solution**: Check gas estimation and account balance

### Issue: "Contract not deployed"
**Solution**: Run deployment script first

## Project Structure

```
web3-distribution/
├── src/app/
│   ├── lib/
│   │   ├── services/          # Service layer (use these!)
│   │   ├── contracts.ts       # Contract configuration
│   │   └── wallet.tsx         # Wallet provider
│   └── components/
│       └── dashboard/         # UI components
├── contracts/                 # Solidity contracts
├── scripts/                   # Deployment scripts
├── test/                      # Integration tests
└── docs/                      # Documentation
```

## Key Files to Know

- **Service Layer**: `src/app/lib/services/` - Use these for all blockchain operations
- **Contract Config**: `src/app/lib/contracts.ts` - Contract addresses and ABIs
- **Environment**: `.env.local` - Your configuration (don't commit!)
- **Documentation**: `docs/` - Detailed guides and API reference

## Using the Service Layer

### Example: Send a Payment

```typescript
import { PaymentService } from '@/lib/services/PaymentService';

const paymentService = PaymentService.getInstance();

// Validate payment
const validation = await paymentService.validatePayment({
  to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  amount: '0.1',
});

if (!validation.valid) {
  console.error(validation.error);
  return;
}

// Send payment
const receipt = await paymentService.sendPayment({
  to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  amount: '0.1',
  memo: 'Test payment',
});

console.log('Transaction hash:', receipt.hash);
```

### Example: Register a Project

```typescript
import { ContractService } from '@/lib/services/ContractService';
import { getContractAddress, PROJECT_REGISTRY_ABI } from '@/lib/contracts';

const contractService = ContractService.getInstance();
const registryAddress = getContractAddress('ProjectRegistry', 'mumbai');

const receipt = await contractService.registerProject(
  registryAddress,
  PROJECT_REGISTRY_ABI,
  'my-project-001',
  ['0xContributor1', '0xContributor2'],
  [60, 40] // 60% and 40% shares
);
```

## Next Steps

1. ✅ Read [Smart Contract Integration Guide](./docs/SMART_CONTRACT_INTEGRATION.md)
2. ✅ Review [API Reference](./docs/API_REFERENCE.md)
3. ✅ Explore the service layer code
4. ✅ Test on Mumbai testnet
5. ✅ Deploy your own contracts
6. ✅ Build your features using the service layer

## Resources

- [Polygon Documentation](https://docs.polygon.technology/)
- [ethers.js Documentation](https://docs.ethers.org/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [MetaMask Documentation](https://docs.metamask.io/)

## Support

- Check the [Troubleshooting section](./docs/SMART_CONTRACT_INTEGRATION.md#troubleshooting)
- Review [test files](./test/) for examples
- Read the [API Reference](./docs/API_REFERENCE.md)

## Development Workflow

1. Make changes to code
2. Run tests: `npm test`
3. Test in browser: `npm run dev`
4. Deploy to testnet: `npm run deploy:mumbai`
5. Verify contracts: `npm run verify:mumbai`
6. Update documentation
7. Commit changes

## Production Checklist

Before deploying to mainnet:

- [ ] All tests passing
- [ ] Security audit completed
- [ ] Gas optimization reviewed
- [ ] Error handling tested
- [ ] Documentation updated
- [ ] Environment variables configured
- [ ] Backup and recovery plan
- [ ] Monitoring and alerts set up

## Tips

- Always test on Mumbai testnet first
- Use gas estimation before transactions
- Keep private keys secure
- Monitor transaction status
- Handle errors gracefully
- Provide user feedback
- Log important events
- Use the service layer (don't call ethers.js directly)

Happy coding! 🚀
