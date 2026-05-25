# INVESTIGATION REPORT: Smart Account + ERC-4337
**Phase:** D
**Date:** 2026-05-25
**Severity:** CRITICAL

---

## 1. Issue Summary

We audited the ERC-4337 Account Abstraction, Safe Smart Account (`permissionless@0.2.57`), Alchemy paymaster, and gas sponsorship workflows. While the smart account is correctly structured with Entrypoint v0.6 (`0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789`), gas-free distribution is completely non-functional because the bundler and paymaster endpoints are blocked by the template placeholder `YOUR_ALCHEMY_KEY` inside `NEXT_PUBLIC_BUNDLER_URL` and `NEXT_PUBLIC_PAYMASTER_URL`.

---

## 2. Root Cause Analysis

The application leverages Alchemy's Gas Sponsorship Policies to support zero-cost transactions for creators. However, the custom Alchemy sponsor request inside [web3.ts](file:///Users/jeeveshsingale/web3-freedom-upgrade/src/app/lib/web3.ts) routes directly to the placeholders:
```typescript
const PAYMASTER_URL = process.env.NEXT_PUBLIC_PAYMASTER_URL || ALCHEMY_RPC;
const BUNDLER_URL = process.env.NEXT_PUBLIC_BUNDLER_URL || ALCHEMY_RPC;
```
Because both values default to `https://base-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY`, any attempt to serialize and sponsor a `UserOperation` returns a network connection failure, preventing smart account initialization and write operations.

---

## 3. ERC-4337 Configuration Audit

- **Account Abstraction Standard:** ERC-4337
- **Smart Account Factory:** Safe Smart Account (`toSafeSmartAccount` v1.4.1)
- **EntryPoint Address:** `0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789` (v0.6)
- **Safe 4337 Module:** `0x39E9269c98CAF0ca8675071f105b31057022f462`
- **Safe Factory:** `0x4e1C6295da940866A45F924e38e65fB84F0E01a6`
- **Gas Sponsorship Method:** Alchemy Paymaster API call (`alchemy_requestGasAndPaymasterAndData`)
- **Gas Policy ID:** `fbcf7119-8b28-4838-8670-6c2c2c42e4aa` (Valid format)

---

## 4. Operational Gaps

1. **Smart Account Initialization:** The Hook `useRevenueSplitter` runs `toSafeSmartAccount` dynamically on load. While this completes client-side using Privy's EIP-1193 injected provider, the smart account client cannot submit any transactions.
2. **User Operation Failures:** Submitting a distribution user operation to `smartAccountClient.sendTransaction()` results in immediate transport rejection because of the malformed Alchemy paymaster endpoint.

---

## 5. Recommended Actions

1. Proceed to **Phase E** (Dashboard + Transaction Flow Investigation) to analyze UI actions.
2. Formulate Phase F to securely replace all instances of `YOUR_ALCHEMY_KEY` in `.env.local`.
