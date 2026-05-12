# Phase 0 — Project Audit Report

**Date:** 2026-05-11  
**Status:** ✅ Complete  
**Project:** LUNIM Creative Rights & Revenue Distribution Platform

---

## 1. Architecture Overview

### Stack
| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS |
| State | React Context (AuthProvider + WalletProvider) |
| Database | Supabase (Postgres + Auth + Realtime) |
| Backend API | Express.js (port 4000) — JWT-protected routes |
| Blockchain | ethers.js v6, Hardhat (local dev), Solidity 0.8.20 |
| Payments | Stripe (checkout integration) |
| Deployment | Vercel (Next.js), separate Express server |

### Directory Structure
```
/
├── src/app/lib/           # Core: auth, wallet, web3, database, types (15 files)
├── src/app/components/    # Navbar, WalletPickerModal, dashboard/* (20+ files)
├── src/app/api/           # Next.js API routes (auth, web3, stripe, etc.)
├── src/hooks/             # useRevenueContract.js (514 lines, dual-mode)
├── src/components/        # Legacy JSX components (4 files)
├── src/contracts/         # ABI JSON (RevenueRights.json)
├── contracts/             # Solidity: RevenueRights.sol, RevenueSplitter.sol
├── server/                # Express backend (auth, transactions, analytics)
├── scripts/               # deploy.js, seed.js
└── supabase/              # Migrations
```

---

## 2. Current Authentication Flow

**Method:** Supabase Auth — email + password only  
**Session:** Supabase auth tokens + custom `crt_user` cookie (JSON-encoded user data)  
**Roles:** `admin | creator | contributor | viewer` in `users_profile` table  
**2FA:** Stub — hardcoded code `123456` (NOT production-ready)

### Key Files
| File | Purpose |
|------|---------|
| `src/app/lib/auth.tsx` | AuthProvider context, login/logout/signup, cookie mgmt |
| `src/app/lib/apiSecurity.ts` | Server-side user verification from cookie |
| `src/app/lib/supabaseClient.ts` | Client-side Supabase instance |
| `src/app/lib/supabaseServer.ts` | Server-side Supabase with service role |
| `middleware.ts` | Route protection for /dashboard and /admin |
| `server/middleware/verifyJWT.js` | Express JWT verification |

### Auth Security Observations
- ⚠️ `crt_user` cookie stores user role in plaintext JSON — **client-modifiable**
- ⚠️ 2FA uses hardcoded bypass code `123456`
- ⚠️ Admin role check in middleware trusts cookie-parsed role
- ✅ `apiSecurity.ts` re-verifies role from DB for API routes
- ✅ Express backend uses proper JWT + rate limiting

---

## 3. Current Wallet & Blockchain Integration

### Dual-Mode System

**Mode 1 — Demo Mode (Default):** Auto-generates fake wallet, writes to Supabase directly, no MetaMask needed.

**Mode 2 — Live Mode:** Requires MetaMask + Hardhat node + Express backend. Calls `distributeRevenue()` on-chain, then syncs to DB.

### Wallet Files Inventory (11 files with blockchain coupling)

| File | Lines | MetaMask Dependency |
|------|-------|-------------------|
| `lib/wallet.tsx` | 511 | **HARD** — `window.ethereum`, EIP-6963 |
| `lib/web3.ts` | 132 | **HARD** — `BrowserProvider(window.ethereum)` |
| `lib/walletUtils.ts` | 287 | None (mock only) |
| `lib/walletDb.ts` | 33 | None |
| `lib/walletProvider.tsx` | 11 | None (stub) |
| `hooks/useRevenueContract.js` | 514 | **HARD** — Live mode BrowserProvider |
| `components/WalletPickerModal.tsx` | 244 | **HARD** — MetaMask connect flow |
| `components/dashboard/DistributePanel.tsx` | 228 | **HARD** — ethers BrowserProvider |
| `components/dashboard/SmartContractPanel.tsx` | 312 | **HARD** — RevenueSplitterService |
| `components/Navbar.tsx` | ~800 | References wallet state |
| `app/web3-demo/page.tsx` | — | **HARD** — window.ethereum |

### `window.ethereum` References: 6 source files  
### `BrowserProvider` References: 4 source files  
### `ethers` Import References: 9 source files

### Smart Contracts

**RevenueRights.sol** (Primary — deployed to Hardhat only)
- `distributeRevenue()` payable — splits ETH by basisPoints (10000 = 100%)
- Emits `HolderPaid` and `RevenueDistributed` events
- Constructor takes arrays of wallets, names, roles, basisPoints

**RevenueSplitter.sol** (Secondary — not used in frontend)
- Dynamic `addPayee()` + pull-based `release()` pattern

### Network Config
- **Current:** Hardhat localhost only (Chain ID 31337)
- **No Base network configuration exists anywhere**
- **No Alchemy configuration exists**
- Hardhat config has no testnet/mainnet networks

---

## 4. Dependency Audit

### Must Replace
```
ethers ^6.16.0  →  viem (wagmi peer dependency, replaces all frontend ethers usage)
```

### Must Add
```
@privy-io/react-auth        # Embedded wallets + social auth
wagmi                       # React hooks for Ethereum
viem                        # TypeScript Ethereum library
@tanstack/react-query       # Required wagmi peer dependency
@safe-global/protocol-kit   # Safe smart accounts
@safe-global/api-kit        # Safe transaction service
permissionless              # ERC-4337 bundler/paymaster utilities
```

### Keep Unchanged
```
@supabase/supabase-js, @supabase/ssr, @stripe/stripe-js, stripe,
framer-motion, chart.js, react-chartjs-2, react-hot-toast, tailwindcss,
hardhat (dev only), express, helmet, cors, morgan
```

---

## 5. Transaction Flow

### Demo Mode (Primary active flow)
```
User → "Distribute" → useRevenueContract.sendRevenueDemoMode()
  → Fake tx hash → Fetch project_contributors
  → INSERT payments (cents) → UPDATE project.total_revenue
  → CustomEvent('payment-recorded') → Dashboard refreshes
```

### Live Mode (via DistributePanel)
```
User → "Distribute" → DistributePanel.handleDistribute()
  → ethers Provider → contract.distributeRevenue({ value })
  → tx.wait() → POST /api/web3/auto-distribute
  → CustomEvent('payment-recorded') → Dashboard refreshes
```

### Database Tables
`projects`, `project_contributors`, `rights_holders`, `transactions`, `transaction_splits`, `payments`, `users_profile`

---

## 6. Environment Variables

### Current (migration impact)
| Variable | Action |
|----------|--------|
| `NEXT_PUBLIC_RPC_URL` (localhost:8545) | **Replace** with Base RPC |
| `NEXT_PUBLIC_CHAIN_ID` (31337) | **Replace** with 84532/8453 |
| `NEXT_PUBLIC_REVENUE_SPLITTER_ADDRESS` | **Update** for Base |
| `CONTRACT_ADDRESS` | **Update** for Base |
| All Supabase vars | Keep |
| All Stripe vars | Keep |
| JWT secrets | Keep |

### New Variables Required
```env
NEXT_PUBLIC_PRIVY_APP_ID=
PRIVY_APP_SECRET=
NEXT_PUBLIC_ALCHEMY_API_KEY=
ALCHEMY_GAS_POLICY_ID=
NEXT_PUBLIC_BASE_MAINNET_RPC=
NEXT_PUBLIC_BASE_SEPOLIA_RPC=
NEXT_PUBLIC_BUNDLER_URL=
NEXT_PUBLIC_PAYMASTER_URL=
```

---

## 7. Security Findings

| # | Finding | Severity |
|---|---------|----------|
| 1 | `crt_user` cookie stores role in plaintext — client can escalate to admin | **HIGH** |
| 2 | 2FA hardcoded bypass code `123456` | **HIGH** |
| 3 | `.env.local` contains real Supabase/Stripe/Resend keys | **MEDIUM** |
| 4 | JWT secret stored in `.env.local` | **MEDIUM** |
| 5 | No CSRF protection on auth cookies | **MEDIUM** |
| 6 | `BrowserProvider(window.ethereum)` trusts injected provider | **LOW** |
| 7 | Demo mode writes fake tx hashes to production tables | **LOW** |
| 8 | `next.config.js` ignores TS and ESLint errors in builds | **LOW** |

---

## 8. Deployment Architecture

- **Frontend:** Vercel — `vercel.json` configured
- **Backend:** Express on port 4000 — separate process, NOT on Vercel
- **Database:** Supabase cloud
- **Blockchain:** Hardhat local only — no testnet/mainnet deployment
- **Contract Listener:** Inside Express process, monitors on-chain events

---

## 9. File-by-File Refactor Priority

| Priority | File | Action |
|----------|------|--------|
| **P0** | `package.json` | Add wagmi, viem, privy, safe; keep ethers for server |
| **P0** | `src/app/layout.tsx` | New provider hierarchy |
| **P1** | `src/app/lib/wallet.tsx` | **Full rewrite** → Privy embedded wallet |
| **P1** | `src/app/lib/web3.ts` | **Rewrite** → viem |
| **P1** | `src/app/lib/auth.tsx` | **Major refactor** → Privy replaces Supabase Auth |
| **P1** | `middleware.ts` | Update for Privy session tokens |
| **P2** | `hooks/useRevenueContract.js` | **Rewrite** → wagmi hooks + smart account |
| **P2** | `components/WalletPickerModal.tsx` | **Remove** → Privy handles wallet UI |
| **P2** | `components/dashboard/DistributePanel.tsx` | Refactor to new hooks |
| **P2** | `components/dashboard/SmartContractPanel.tsx` | Refactor to new hooks |
| **P2** | `src/app/login/page.tsx` | Replace with Privy login |
| **P2** | `src/app/signup/page.tsx` | Replace with Privy signup |
| **P3** | `src/app/lib/walletUtils.ts` | **Remove** (obsolete mock) |
| **P3** | `src/app/lib/walletProvider.tsx` | **Remove** (unused stub) |
| **P3** | `hardhat.config.js` | Add Base Sepolia/Mainnet networks |

---

## 10. Migration Strategy

### Approach: Parallel Provider Architecture

1. **Phase 1:** Install new stack alongside existing. Create new `/lib/web3/` module. Old code keeps working.
2. **Phase 2:** Replace auth — Privy becomes primary. Sync layer to Supabase `users_profile`.
3. **Phase 3:** Smart accounts replace direct EOA signing via Safe + ERC-4337.
4. **Phase 4:** Refactor transaction UX — remove blockchain terminology.
5. **Phase 5-8:** Wallet export, security hardening, testing, documentation.

### Rollback Safety
- New files created alongside old ones — revert by changing provider tree in `layout.tsx`
- Feature flags can gate new vs old auth during transition
- Database schema changes are additive only (no destructive migrations)
- Express backend changes are minimal (JWT verification update only)

---

## 11. Risks & Blockers

| Risk | Impact | Mitigation |
|------|--------|------------|
| Privy requires API keys and app setup | **Blocks Phase 1** | User must create Privy account first |
| Smart contracts need redeployment to Base | **Blocks Phase 3** | Deploy to Base Sepolia first |
| Supabase Auth → Privy user ID mapping | Medium | Migration script, dual-auth transition |
| Express backend JWT assumes Supabase tokens | Medium | Update verifyJWT middleware |
| Demo mode deeply coupled to transaction logic | Low | Preserve as dev-only feature |

---

## 12. Next Steps — Phase 1 Prerequisites

**Before starting Phase 1, the user must provide:**
1. **Privy App ID** (create at https://dashboard.privy.io)
2. **Alchemy API Key** (create at https://dashboard.alchemy.com)
3. Confirmation of target network: **Base Sepolia** for initial testing

Phase 1 will install the new stack, create provider architecture, and configure Base networks — **without modifying any business logic.**

---

*Report generated: 2026-05-11T18:56:00+01:00*  
*Phase 0 Complete — No code modifications made*
