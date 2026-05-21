# INVESTIGATION REPORT: Provider + Auth
**Phase:** B
**Date:** 2026-05-18
**Severity:** CRITICAL

---

## 1. Issue Summary

The authentication and provider stack is entirely custom/localStorage-based with no integration of the intended Web3 auth stack (Privy, Wagmi, Viem). The wallet provider is pure MetaMask-dependent (`window.ethereum`). SmartContractPanel references non-existent wallet service files. Multiple provider hierarchy issues exist.

---

## 2. Root Cause Analysis

The application was partially refactored toward a Privy/Wagmi/Viem architecture but none of these packages were installed or implemented. The existing codebase has:

- **Auth:** Custom localStorage-based auth with hardcoded admin credentials
- **Wallet:** Direct `window.ethereum` MetaMask RPC calls with no abstraction
- **Web3:** Pure mock/simulation in `web3.ts`
- **Missing files:** `dummyWallets` and `walletUtils` imports exist but files don't

---

## 3. Auth Provider Analysis

### File: `src/app/lib/auth.tsx`
| Issue | Type | Severity |
|---|---|---|
| Hardcoded admin credentials | Security | CRITICAL |
| localStorage-based session | Anti-pattern | HIGH |
| No Privy integration | Missing feature | CRITICAL |
| No password hashing | Security | HIGH |
| Mock login (no real auth) | Functional | CRITICAL |
| No HTTP-only cookies | Security | MEDIUM |
| No session expiry | Security | MEDIUM |
| No CSRF protection | Security | MEDIUM |

### Auth Flow (Current)
```
Login Form → auth.login() → setUser in state → localStorage.setItem('crt_user')
                                                                     ↓
Route Protection → middleware.ts reads cookie (set by login page) → redirect if missing
```

### Auth Flow (Should Be)
```
Privy Login → Privy OAuth/OTP → Embedded Wallet Creation → JWT from Privy
                                                                       ↓
Route Protection → Privy server-side token verification → session persists
```

## 4. Wallet Provider Analysis

### File: `src/app/lib/wallet.tsx`
| Issue | Type | Severity |
|---|---|---|
| Uses `window.ethereum` directly | MetaMask dependency | CRITICAL |
| No Privy embedded wallet | Missing feature | CRITICAL |
| No Wagmi integration | Missing feature | CRITICAL |
| No Viem clients | Missing feature | CRITICAL |
| No chain configuration | Missing config | HIGH |
| Ethereum-only assumption | Architectural | HIGH |
| `getNetworkName` not exposed in context value | Bug | MEDIUM |
| Interface doesn't include `getNetworkName` | TypeScript error | MEDIUM |

### Wallet Flow (Current)
```
Component → useWallet() → connectWallet()
                              ↓
                window.ethereum.request('eth_requestAccounts')
                              ↓
                MetaMask popup → user approves
                              ↓
                window.ethereum.request('eth_getBalance')
                              ↓
                Set state: account, balance, chainId
```

### Wallet Flow (Should Be)
```
Component → usePrivy() / useWagmi() → connectWallet()
                                           ↓
                Privy Embedded Wallet OR External Wallet
                                           ↓
                Wagmi useAccount / useBalance / useWalletClient
                                           ↓
                Viem publicClient + walletClient
```

## 5. Provider Hierarchy

### Current
```
RootLayout
  └── AuthProvider (custom)
       └── WalletProvider (window.ethereum)
            └── Pages
```

### Should Be
```
RootLayout
  └── PrivyProvider
       └── WagmiProvider
            └── QueryClientProvider
                 └── Pages
```

## 6. Missing Provider Files

| Required File | Status | Imported By |
|---|---|---|
| `src/app/lib/supabaseServer.ts` | **DOES NOT EXIST** | All API routes |
| `src/app/data/dummyWallets.ts` | **DOES NOT EXIST** | SmartContractPanel.tsx:12 |
| `src/app/lib/walletUtils.ts` | **DOES NOT EXIST** | SmartContractPanel.tsx:13 |

### Impact of Missing Files

#### `dummyWallets` (SmartContractPanel.tsx:12)
```typescript
import { getWalletByUserId } from '@/data/dummyWallets';
// This import will fail at compile/runtime
// Entire SmartContractPanel cannot render
```

#### `walletUtils` (SmartContractPanel.tsx:13)
```typescript
import MockWalletService from '@/lib/walletUtils';
// This import will fail at compile/runtime
// Entire SmartContractPanel cannot render
```

## 7. Hydration / SSR Issues

| Issue | Location | Severity |
|---|---|---|
| localStorage access without useEffect guard | auth.tsx | MEDIUM |
| window.ethereum access in components | Multiple | MEDIUM |
| No `"use client"` directive issues | Not present | OK |

## 8. Duplicate Wallet Systems

### File: `src/app/lib/wallet.tsx` (239 lines)
Full MetaMask wallet provider with context

### File: `src/app/lib/web3.ts` (42 lines)
Simplified mock wallet with simulated functions

**Problem:** Both files exist with overlapping purposes. `web3.ts` is a stub that was likely meant to be replaced but remains as dead code.

## 9. Provider Ordering

The current `WalletProvider` wraps the entire app, including the `AuthProvider`. The AuthProvider provides `connectUserWallet()` / `disconnectUserWallet()` methods but they are never called by the WalletProvider or any wallet hook. There is no bridge between auth state and wallet state.

## 10. Severity Assessment

**Overall: CRITICAL**

- Auth is insecure (hardcoded credentials, localStorage)
- Wallet is MetaMask-only (won't work on mobile, no embedded wallet)
- Missing 2 critical files cause SmartContractPanel to crash
- No Privy, Wagmi, or Viem packages installed
- No provider bridge between Auth and Wallet

## 11. Files Affected

| File | Issue |
|---|---|
| `src/app/lib/auth.tsx` | Hardcoded credentials, localStorage, no Privy |
| `src/app/lib/wallet.tsx` | window.ethereum, no abstraction, MetaMask-only |
| `src/app/lib/web3.ts` | Dead code, mock-only implementation |
| `src/app/components/dashboard/SmartContractPanel.tsx` | Imports non-existent files |
| `src/app/layout.tsx` | Wrong provider hierarchy |
| `src/app/components/ClientLayout.tsx` | Duplicate of layout, unused |
| `src/app/middleware.ts` | Cookie-based guard, no Privy integration |

## 12. Recommended Fix

1. Install @privy-io/react-auth, wagmi, viem, @tanstack/react-query
2. Create PrivyProvider wrapping WagmiProvider + QueryClientProvider
3. Replace wallet.tsx with Wagmi hooks (useAccount, useConnect, useDisconnect)
4. Connect user wallet to auth context properly
5. Create supabaseServer.ts or migrate API routes off Supabase
6. Create dummyWallets.ts and walletUtils.ts or remove imports
7. Clean up duplicate wallet systems
8. Remove hardcoded credentials, implement proper Privy auth
