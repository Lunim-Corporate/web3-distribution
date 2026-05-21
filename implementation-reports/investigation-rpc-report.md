# INVESTIGATION REPORT: Blockchain + RPC
**Phase:** C
**Date:** 2026-05-18
**Severity:** CRITICAL

---

## 1. Issue Summary

The application has zero blockchain/RPC connectivity. No Viem clients are created, no chain configuration exists, no Wagmi connectors are set up, and no RPC endpoints are configured. The existing `wallet.tsx` uses direct MetaMask RPC calls (`window.ethereum.request`) which bypass all abstraction layers.

---

## 2. Root Cause Analysis

The codebase was never connected to a blockchain network. Despite references to "Smart Contracts" and "Web3" in the UI and code, every blockchain interaction is either:
1. A direct `window.ethereum` MetaMask call (wallet.tsx)
2. A mock/simulation (web3.ts, SmartContractPanel.tsx)
3. A timeout-based fake transaction (PaymentSplitter.tsx)

No Viem or Wagmi packages exist. No chain configurations are defined.

---

## 3. Chain Configuration Analysis

### Current State
**No chain configuration exists anywhere in the codebase.**

There is no definition for:
- Base Sepolia (chain ID: 84532)
- Ethereum (chain ID: 1)
- Any testnet

### File: `src/app/lib/wallet.tsx` (Partial)
Has a `getNetworkName` function but it maps to the wrong networks:
```
1  → Ethereum Mainnet (OK)
5  → Goerli Testnet (DEPRECATED, should be Sepolia 11155111)
137 → Polygon Mainnet (Not in scope)
80001 → Polygon Mumbai (Not in scope, also deprecated)
56  → BSC Mainnet (Not in scope)
97  → BSC Testnet (Not in scope)
```

### File: `src/app/lib/wallet.tsx` (NETWORKS constant)
Has `NETWORKS` export with only Ethereum, Polygon, and Mumbai — no Base at all.

---

## 4. RPC Configuration

### Current State
**No RPC URLs are configured.**

| RPC | Status | Purpose |
|---|---|---|
| Base Sepolia RPC | **MISSING** | Primary network for this application |
| Alchemy RPC | **MISSING** | Reliable RPC provider |
| Public RPC fallback | **MISSING** | No fallback configured |

### What Should Exist
```typescript
// viem chain definition
import { baseSepolia } from 'viem/chains';
import { http, createPublicClient, createWalletClient } from 'viem';

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL),
});

export const walletClient = createWalletClient({
  chain: baseSepolia,
  transport: http(process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL),
});
```

---

## 5. Transport Configuration

### Current State
No transport abstraction exists. All RPC calls go through `window.ethereum.request()` which is:
- MetaMask-dependent
- Not configurable
- Not portable
- Unavailable on mobile web
- Unavailable in server components

### What Should Exist
```typescript
import { http } from 'viem';

export const transport = http(
  process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL || 
  'https://base-sepolia.g.alchemy.com/v2/demo'
);
```

---

## 6. Viem Client Analysis

### Current State
**No Viem clients exist anywhere in the codebase.**

| Required Client | Status | File |
|---|---|---|
| `createPublicClient` | **MISSING** | N/A |
| `createWalletClient` | **MISSING** | N/A |
| `createTestClient` | **MISSING** | N/A |

### Impact
Without Viem clients:
- No `readContract` capability
- No `writeContract` capability
- No `getBalance` capability
- No `sendTransaction` capability
- No `waitForTransactionReceipt` capability
- No `simulateContract` capability

---

## 7. Wagmi Configuration Analysis

### Current State
**No Wagmi configuration exists anywhere.**

| Required System | Status |
|---|---|
| `createConfig` | **MISSING** |
| `WagmiProvider` | **MISSING** |
| `useConnect` | **MISSING** |
| `useAccount` | **MISSING** |
| `useWalletClient` | **MISSING** |
| `useWriteContract` | **MISSING** |
| `useReadContract` | **MISSING** |
| `useSendTransaction` | **MISSING** |

---

## 8. RPC Failure Modes

Without proper RPC configuration, every blockchain interaction will fail:

| Scenario | Failure Mode |
|---|---|
| Read contract data | No public client → cannot read contract |
| Write contract data | No wallet client → cannot sign |
| Get wallet balance | No public client → cannot query |
| Send transaction | No wallet connection → cannot submit |
| Wait for receipt | No public client → cannot watch |
| Estimate gas | No public client → cannot estimate |
| Switch network | MetaMask-dependent → won't work for embedded wallets |
| Sign message | No wallet client → cannot sign |

---

## 9. CORS / Rate Limiting

No RPC endpoints are configured so CORS and rate limiting are not yet relevant. However, once Alchemy RPC is configured:
- Free tier: 300K compute units/day (~300 requests/day for complex queries)
- Rate limiting will occur if caching isn't implemented
- CORS is handled by Alchemy by default

---

## 10. Base Network Discovery

### Required Configuration for Base Sepolia
```typescript
import { baseSepolia } from 'viem/chains';
// chainId: 84532
// RPC: https://base-sepolia.g.alchemy.com/v2/{API_KEY}
// Explorer: https://sepolia.basescan.org
// Currency: ETH
```

---

## 11. Files Affected

| File | Issue |
|---|---|
| `src/app/lib/wallet.tsx` | No chain config, MetaMask-only, no Base |
| `src/app/lib/web3.ts` | Dead mock file |
| `src/app/components/dashboard/SmartContractPanel.tsx` | Mock transactions, no real RPC |
| Entire app | No Viem/Wagmi anywhere |

## 12. Severity Assessment

**Overall: CRITICAL**

Zero blockchain connectivity exists. The application cannot:
- Connect to Base Sepolia
- Read any contract
- Write any transaction
- Query any balance
- Sign any message
- Confirm any on-chain action

## 13. Recommended Fix

1. Install `viem` and `wagmi` packages
2. Create chain config for Base Sepolia
3. Create Viem public client with Alchemy RPC transport
4. Create Wagmi config with connectors (Privy, injected, WalletConnect)
5. Set up WagmiProvider in layout
6. Replace window.ethereum calls with Wagmi hooks
7. Add proper baseSepolia chain import from viem/chains
8. Test RPC connectivity with `getBlockNumber()`
