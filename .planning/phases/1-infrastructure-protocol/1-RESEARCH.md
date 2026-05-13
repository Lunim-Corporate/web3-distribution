# Phase 1 Research: Infrastructure & Protocol

## Standard Stack
- **SDK**: `@0xsplits/splits-sdk` (v2).
- **Blockchain Interface**: `ethers.js` v6.
- **Data Indexer**: The Graph (0xSplits Sepolia Subgraph).

## Architecture Patterns
- **Initialization**: 
  ```javascript
  const splitsClient = new SplitsClient({
    chainId: 11155111, // Sepolia
    provider: ethersProvider,
    signer: ethersSigner,
  });
  ```
- **Mutable Splits**: Always specify a `controller` during split creation. The account at this address is the only one authorized to invoke update functions.

## Don't Hand-Roll
- **Split Calculations**: Use SDK built-ins for share conversions.
- **Subgraph Query Construction**: Leverage SDK methods like `getSplitMetadata` where possible instead of raw GraphQL to benefit from the SDK's internal caching.

## Common Pitfalls
- **Dust Handling**: 0xSplits might leave small "dust" amounts in the contract.
- **Controller Dependency**: Losing access to the controller wallet means the split becomes immutable for life.
- **Subgraph Delay**: On-chain split updates can take a few seconds to reflect in Subgraph queries.

## Code Examples
### Fetching User Balance
```javascript
const earnings = await splitsClient.getUserEarnings({
  userAddress: '0x...',
});
```

### Creating a Mutable Split
```javascript
const response = await splitsClient.createSplit({
  recipients: [{ address: '0x...', percentShare: 50 }, ...],
  distributorFeePercent: 0,
  controller: '0xAdmin...',
});
```
