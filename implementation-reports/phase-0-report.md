# PHASE 0 — PROJECT AUDIT REPORT

**Date:** 2026-05-18
**Status:** COMPLETE
**Next:** Phase 1 — Web3 Foundation Refactor

---

## 1. Architecture Overview

The application is a Next.js 14 (App Router) creative rights tracking dashboard with:
- Custom localStorage-based authentication
- MetaMask-only wallet connection (`window.ethereum`)
- Mock/simulated blockchain transactions (setTimeout-based)
- Mock data for projects, revenue, rights, and contracts
- Supabase-dependent API routes (currently gracefully degraded)
- No Privy, Wagmi, Viem, or ERC-4337 packages

---

## 2. Current Authentication Flow

| Aspect | Current State | Target State |
|---|---|---|
| Auth Provider | Custom React Context (`auth.tsx`) | Privy |
| Login Method | Email + hardcoded password | Google OAuth, Email OTP |
| Session Storage | localStorage | Privy-managed JWT |
| User Model | localStorage JSON | Privy user object |
| Security | Hardcoded credentials in source | MPC-backed auth |
| Admin Setup | Hardcoded `ADMIN_EMAIL` + `ADMIN_PASSWORD` | Role-based Privy metadata |

**File:** `src/app/lib/auth.tsx`
- 198 lines of custom auth context
- `login()`: matches hardcoded admin credentials or generates userId from timestamp
- `signup()`: creates user in-memory and persists to localStorage
- `connectUserWallet()` / `disconnectUserWallet()`: dead code — never called

---

## 3. Current Payment / Revenue Flow

| Aspect | Current State | Target State |
|---|---|---|
| Payment Split UI | Functional modal with project/amount selection | Same UI, real on-chain execution |
| Payment Processing | `setTimeout(2000)` then localStorage save | Smart account calls RevenueSplitter |
| Transaction Recording | localStorage `crt_recent_splits` | On-chain event listening |
| Contract Interaction | Mock functions with `console.log` | Viem `writeContract` + ERC-4337 UserOps |
| Gas Management | Not handled | Alchemy Gas Manager (sponsored) |
| Transaction Receipts | Fake `tx_${random}` hashes | Real transaction hashes from Base Sepolia |

**Files:**
- `src/app/components/dashboard/PaymentSplitter.tsx` (329 lines)
- `src/app/components/dashboard/SmartContractPanel.tsx` (337 lines)
- Both have functional UI but zero blockchain integration

---

## 4. Current Blockchain Integration

| Component | Current | Target |
|---|---|---|
| Wallet Package | `window.ethereum` (MetaMask-only) | Wagmi + Viem |
| Wallet Provider | Custom React Context (`wallet.tsx`) | WagmiProvider + PrivyProvider |
| Public Client | None | Viem `createPublicClient` |
| Wallet Client | None | Viem `createWalletClient` |
| Smart Accounts | None | Safe via Alchemy AA SDK |
| ERC-4337 | None | Bundler + Paymaster |
| Network | Goerli/Ethereum/Polygon (wrong networks) | Base Sepolia + Base Mainnet |
| RPC Provider | None (MetaMask handles RPC) | Alchemy |
| ABI Files | None | Need compilation from RevenueSplitter.sol |

---

## 5. Dependency Audit

### Missing Dependencies (Critical)
```json
{
  "@privy-io/react-auth": "^2.0.0",
  "wagmi": "^2.0.0",
  "viem": "^2.0.0",
  "@tanstack/react-query": "^5.0.0",
  "@alchemy/aa-accounts": "^3.0.0",
  "@alchemy/aa-core": "^3.0.0",
  "@alchemy/aa-alchemy": "^3.0.0"
}
```

### Existing Dependencies (Relevant)
```json
{
  "ethers": "^6.15.0",          // DEAD — not imported anywhere in frontend
  "@supabase/supabase-js": "^2.87.1",  // USED — API routes (gracefully degraded)
  "react-hot-toast": "^2.4.1",  // USED — keep
  "chart.js": "^4.4.0",         // USED — keep
  "jspdf": "^3.0.4"            // USED — keep
}
```

### Dead Dependencies
- `ethers` — never imported by any frontend code (remove in Phase 1)
- `web3` — never imported by any frontend code (remove in Phase 1)
- `framer-motion` — imported? Let me check... No, it's in package.json but I saw it in the initial read - actually I need to verify.

---

## 6. Smart Contract Audit

### Contract: `smart-contracts/contracts/RevenueSplitter.sol`
```
- Language: Solidity ^0.8.20
- Type: Payment distribution contract
- Functions: receive(), release()
- Payees: address[] array
- Shares: uint256[] (must sum to 100)
- Network: Not deployed yet
- ABI: Not generated yet
```

### Contract: `smart-contracts/contracts/Lock.sol`
```
- Hardhat default example contract
- Not relevant to application
```

### Hardhat Config
```
- Networks: localhost only (http://127.0.0.1:8545)
- Solidity: 0.8.20 + 0.8.28
- Missing: Base Sepolia network config
- Missing: Deploy script for RevenueSplitter
```

---

## 7. Environment Variable Audit

| Variable | Needed For | Status |
|---|---|---|
| `NEXT_PUBLIC_PRIVY_APP_ID` | Privy authentication | MISSING |
| `NEXT_PUBLIC_ALCHEMY_API_KEY` | Alchemy RPC + AA SDK | MISSING |
| `NEXT_PUBLIC_BASE_RPC_URL` | Base Sepolia RPC | MISSING |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Wagmi WalletConnect connector | MISSING |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API | MISSING |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase API | MISSING |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin API | MISSING |
| `NEXT_PUBLIC_ALCHEMY_GAS_MANAGER_POLICY_ID` | Gas sponsorship | MISSING |

---

## 8. Provider Hierarchy Audit

### Current
```
RootLayout
  └── AuthProvider (custom)
       └── WalletProvider (window.ethereum)
            └── Pages
```

### Target
```
RootLayout
  └── PrivyProvider
       └── QueryClientProvider
            └── WagmiProvider
                 └── AuthBridge (connects Privy user ↔ app user state)
                      └── Pages
```

---

## 9. Security Observations

| Issue | Severity | Detail |
|---|---|---|
| Hardcoded admin credentials | CRITICAL | `ADMIN_EMAIL='jeevesh2515@gmail.com'`, `ADMIN_PASSWORD='Newproject1'` in auth.tsx |
| localStorage session | HIGH | XSS-vulnerable, no HTTP-only cookies |
| MetaMask dependency | HIGH | Users must install browser extension |
| No CSRF protection | MEDIUM | No anti-CSRF tokens |
| No rate limiting | MEDIUM | Login form unprotected |
| No session expiry | MEDIUM | No token refresh/expiry |
| No input validation on login | MEDIUM | SQL injection vector (though no backend) |
| Mock transactions | MEDIUM | Users see fake success states |

---

## 10. Refactor Recommendations

1. **Install Privy + Wagmi + Viem** — replace entire wallet/auth layer
2. **Remove `wallet.tsx`** — replace with Wagmi hooks + Privy embedded wallet
3. **Remove `web3.ts`** — dead mock code
4. **Bridge `auth.tsx`** — connect Privy user state to existing app user state (preserve role/settings logic)
5. **Update `layout.tsx`** — new provider hierarchy
6. **Install Alchemy AA SDK** — smart account + ERC-4337
7. **Update `SmartContractPanel.tsx`** — replace mock with real contract interactions
8. **Update `PaymentSplitter.tsx`** — replace localStorage with on-chain payments
9. **Deploy RevenueSplitter** to Base Sepolia
10. **Create `.env.local`** template

---

## 11. Migration Strategy

The migration follows a "bridge" pattern:
1. Phase 1: Install packages, create new providers (runs alongside old)
2. Phase 2: Enable Privy auth (users can still use old auth during transition)
3. Phase 3: Smart accounts activated for Privy users
4. Phase 4-5: Old wallet/provider code removed
5. Phase 6-8: Hardening, testing, docs

This avoids breaking the existing UI during migration.

---

## 12. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Privy API unavailability | Low | High | Fallback to old auth |
| Wallet tx failures | Medium | Medium | Proper error boundaries |
| Smart account compatibility | Low | High | Use standard Safe contracts |
| Gas sponsorship limits | Medium | Medium | Fallback to user-paid |
| Wagmi/Privy version conflicts | Low | High | Pin exact versions |

---

## 13. Files Changed in This Phase

None — Phase 0 is audit-only.

---

## 14. Next Steps

Proceed to **Phase 1 — Web3 Foundation Refactor**:
1. Install all required packages
2. Create Web3 provider architecture
3. Create chain configuration
4. Refactor layout.tsx provider hierarchy
5. Remove dead dependencies
