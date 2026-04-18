# Summary: Protocol & SDK Setup (Plan 01-protocol-setup)

## Work Completed
- **SDK Installation**: Installed `@0xsplits/splits-sdk`, `ethers@latest`, and `viem` to support the protocol layer.
- **Client Factory**: Created `src/lib/web3/client.ts` implementing a singleton `SplitsClient` configured for Sepolia.
- **Subgraph Service**: Created `src/lib/web3/subgraph.ts` for fetching indexed earnings and historical split data.
- **Interaction Hook**: Created `src/hooks/useSplits.ts` to provide protocol data to React components.

## Key Files Created
- [client.ts](file:///Users/jeeveshsingale/web3-distribution/src/lib/web3/client.ts)
- [subgraph.ts](file:///Users/jeeveshsingale/web3-distribution/src/lib/web3/subgraph.ts)
- [useSplits.ts](file:///Users/jeeveshsingale/web3-distribution/src/hooks/useSplits.ts)

## Self-Check
- [x] Dependencies installed with legacy peer deps to avoid ESLint conflicts.
- [x] Singleton pattern used for the SDK client.
- [x] Subgraph queries verified against standard 0xSplits schemas.
- [x] Hook supports both data fetching and manual refresh.

## Verification: PASSED
- [x] Files created and exported.
- [x] Basic type check passed for core logic.
