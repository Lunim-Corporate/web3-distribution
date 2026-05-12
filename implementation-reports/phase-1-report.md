# Phase 1 — Web3 Foundation Refactor Report

**Date:** 2026-05-12  
**Status:** ✅ Complete  
**Project:** LUNIM Creative Rights & Revenue Distribution Platform

---

## 1. Work Completed

### Dependency Installation
We have installed the mandatory Web3 stack to support modern Account Abstraction (ERC-4337):
- **Wagmi & Viem**: Replaced `ethers.js` as the primary blockchain interaction layer.
- **Privy (@privy-io/react-auth)**: Foundation for embedded wallets and social authentication.
- **Permissionless.js**: Orchestration layer for ERC-4337 (Bundlers, Paymasters, and Smart Accounts).
- **Safe SDKs**: Prepared for production-grade multisig/smart account infrastructure.

### Provider Architecture Refactor
The application root layout (`src/app/layout.tsx`) has been refactored to support the new provider hierarchy:
1. **Web3Providers**: Custom wrapper for Wagmi and React Query.
2. **AuthProvider**: Integrated with Privy for seamless session management.
3. **Legacy Removal**: Removed the global `WalletProvider` which was tightly coupled to `window.ethereum` (MetaMask).

### Network & Infrastructure Configuration
- Configured **Base Sepolia** as the primary testing environment.
- Integrated **Alchemy RPC** and **Alchemy Gas Manager** support.
- Defined environment variable structure for Bundler and Paymaster URLs.

---

## 2. Architectural Decisions

### Viem vs Ethers.js
We chose **Viem** for its superior TypeScript support, smaller bundle size, and native integration with Wagmi. This allows for more predictable and type-safe contract interactions.

### Abstraction Layer
Instead of components calling `window.ethereum` directly, all blockchain logic is now encapsulated within `useRevenueSplitter` and `useAuth` hooks. This allows the platform to switch between "Embedded Wallet" and "External Wallet" modes without breaking UI components.

---

## 3. Risks & Blockers

### Dependency Conflicts
- `viem` and `permissionless` versions must be carefully matched to satisfy peer dependency requirements of `@privy-io/react-auth`. Currently locked to compatible versions.

### Alchemy Policy
- Gas sponsorship depends on a valid **Alchemy Gas Policy ID**. This must be correctly configured in the Alchemy Dashboard to avoid transaction failures during testing.

---

## 4. Next Steps
Phase 1 is complete. We are moving to **Phase 2 — Embedded Auth + Wallet Creation**, where we will finalize the user onboarding flow and remove the requirement for MetaMask entirely.

---
*Report generated: 2026-05-12T04:32:00+01:00*
