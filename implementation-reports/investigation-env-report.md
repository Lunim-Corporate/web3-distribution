# INVESTIGATION REPORT: Environment + Configuration
**Phase:** A
**Date:** 2026-05-18
**Severity:** CRITICAL

---

## 1. Issue Summary

Zero environment variables exist. No `.env.local`, `.env.development`, `.env.production`, or `.env.template` files are present in the project root. The entire application has no configured environment layer.

---

## 2. Root Cause Analysis

The application was cloned/scaffolded without environment setup. The README references a `.env.template` that does not exist. No environment configuration was ever materialized.

---

## 3. Missing Variables

### Required Variables (No Values)

The following environment variables are **referenced or required** by the codebase architecture but have **zero values**:

| Variable | Status | Purpose | Source |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | **MISSING** | Supabase project URL for database access | All API routes (`api/*/route.ts`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **MISSING** | Supabase anonymous API key | All API routes |
| `NEXT_PUBLIC_PRIVY_APP_ID` | **MISSING** | Privy authentication app ID | Wallet/auth refactoring target |
| `NEXT_PUBLIC_ALCHEMY_API_KEY` | **MISSING** | Alchemy RPC access for Base Sepolia | Blockchain connectivity |
| `NEXT_PUBLIC_BASE_RPC_URL` | **MISSING** | Base Sepolia RPC endpoint | Chain configuration |
| `NEXT_PUBLIC_CHAIN_ID` | **MISSING** | Target chain ID (84532 for Base Sepolia) | Network switching |
| `WALLET_CONNECT_PROJECT_ID` | **MISSING** | WalletConnect Cloud project ID | Wagmi configuration |
| `PAYMASTER_API_KEY` | **MISSING** | ERC-4337 paymaster API key | Gas sponsorship |
| `BUNDLER_RPC_URL` | **MISSING** | ERC-4337 bundler RPC endpoint | User operation submission |
| `NEXT_PUBLIC_APP_URL` | **MISSING** | Application base URL | Referenced in README |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | **MISSING** | Deployed RevenueSplitter address | Contract interaction |

---

## 4. Variables Not Used (Dead Config)

No dead configuration exists since no env variables are configured at all.

---

## 5. Variables That Should Exist

### Privy Configuration (Missing Entirely)
```env
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id
```
- **How to obtain:** Sign up at https://console.privy.io, create an app, copy the App ID
- **What breaks without it:** Cannot authenticate users via Privy (Google login, email OTP, embedded wallets)

### Alchemy Configuration (Missing Entirely)
```env
NEXT_PUBLIC_ALCHEMY_API_KEY=your-alchemy-api-key
```
- **How to obtain:** Sign up at https://www.alchemy.com, create an app on Base Sepolia, copy the API key
- **What breaks without it:** No RPC connectivity to Base Sepolia; transactions cannot be submitted

### Base Sepolia Chain Configuration (Missing Entirely)
```env
NEXT_PUBLIC_BASE_RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_KEY
NEXT_PUBLIC_CHAIN_ID=84532
```
- **How to obtain:** Use Alchemy RPC URL with your API key
- **What breaks without it:** Wagmi/Viem cannot connect to the network

### WalletConnect Configuration (Missing Entirely)
```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-project-id
```
- **How to obtain:** Sign up at https://cloud.walletconnect.com
- **What breaks without it:** Wagmi's WalletConnect connector won't initialize

### ERC-4337 Paymaster Configuration (Missing Entirely)
```env
NEXT_PUBLIC_PAYMASTER_API_KEY=your-paymaster-key
NEXT_PUBLIC_BUNDLER_RPC_URL=https://api.pimlico.io/v2/base-sepolia/rpc?apikey=YOUR_KEY
```
- **How to obtain:** Sign up at https://www.pimlico.io or similar paymaster service
- **What breaks without it:** User operations cannot be sponsored; users pay gas

### Supabase Configuration (Missing)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```
- **How to obtain:** Create a Supabase project at https://supabase.com
- **What breaks without it:** All API routes (`api/revenue`, `api/projects`, `api/rights`, `api/milestones`, `api/users`) will fail

---

## 6. Exposed Secrets

No secrets are currently exposed because no env file exists. However, the following hardcoded credentials exist in source code and are vulnerabilities:

### File: `src/app/lib/auth.tsx`
```typescript
const ADMIN_EMAIL = 'jeevesh2515@gmail.com';
const ADMIN_PASSWORD = 'Newproject1';
```
**Severity:** CRITICAL — Plaintext hardcoded credentials in client-side code.

---

## 7. Affected Systems

| System | Impact |
|---|---|
| Authentication | Cannot use Privy; only hardcoded admin login works |
| Blockchain Connectivity | No RPC, no chain config, no connectivity |
| Smart Contract Interaction | Cannot execute any on-chain transactions |
| API Routes | All 5 API routes will fail (no Supabase) |
| Embedded Wallet | No Privy embedded wallet creation |
| Smart Account | No ERC-4337 account setup |
| Payment Processing | Cannot execute on-chain payments |
| Gas Sponsorship | No paymaster configured |

---

## 8. Severity Assessment

**Overall: CRITICAL**

The application has zero environment configuration. Every system that depends on external services is non-functional.

---

## 9. Recommended Fix

1. Create `.env.local` with all required variables
2. Create `.env.template` as documentation
3. Sign up for: Privy, Alchemy, WalletConnect, Pimlico (or alternative), Supabase
4. Remove hardcoded credentials from `auth.tsx`
5. Add `next.config.js` env public exposure for client-side variables

---

## 10. Required Accounts

To restore functionality, the following accounts must be created:

1. **Privy** (https://console.privy.io) — Auth + Embedded Wallets
2. **Alchemy** (https://www.alchemy.com) — RPC + Blockchain API
3. **WalletConnect** (https://cloud.walletconnect.com) — Wallet connectors
4. **Pimlico** (https://www.pimlico.io) — ERC-4337 Bundler + Paymaster
5. **Supabase** (https://supabase.com) — Database + API

---

## 11. Next Actions

1. Create all required service accounts
2. Generate API keys
3. Create `.env.local` with valid values
4. Ensure `.env.local` is in `.gitignore`
5. Remove hardcoded credentials from `auth.tsx`
6. Verify env loading with `process.env` checks
