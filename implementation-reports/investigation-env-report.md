# INVESTIGATION REPORT: Environment + Configuration
**Phase:** A
**Date:** 2026-05-25
**Severity:** HIGH

---

## 1. Issue Summary

We audited the active `.env` and `.env.local` files in the project root. While basic blockchain, Supabase, and Privy credentials are set, **four critical environment variables** in `.env.local` are currently configured with raw placeholder strings (`YOUR_ALCHEMY_KEY`), causing all live Base Sepolia RPC connections, Paymaster operations, and ERC-4337 smart bundler transactions to fail.

---

## 2. Root Cause Analysis

The Web3 refactoring introduced integration parameters for Privy, Alchemy, and ERC-4337 smart wallets. However, the RPC and Paymaster URLs were configured using a default template placeholder string (`YOUR_ALCHEMY_KEY`) rather than interpolating the active `NEXT_PUBLIC_ALCHEMY_API_KEY` defined on line 41.

---

## 3. Active Variables Audit

The following table details the current variables found in `.env.local` and their configuration integrity:

| Variable | Current State | Purpose | Integrity / Issue |
|---|---|---|---|
| `NEXT_PUBLIC_PRIVY_APP_ID` | `cmp217w43000p0cie4kvln0y3` | Privy application ID | Active & Valid |
| `NEXT_PUBLIC_ALCHEMY_API_KEY` | `kcU9NMIFFiSqIueAidvdi` | Alchemy Dev API Key | Active & Valid |
| `NEXT_PUBLIC_ALCHEMY_RPC_URL` | `https://base-sepolia.g.alchemy.com/v2/kcU9NMIFFiSqIueAidvdi` | Direct Alchemy connection | Active & Valid |
| `NEXT_PUBLIC_BASE_MAINNET_RPC` | Contains `YOUR_ALCHEMY_KEY` | Base Mainnet transport URL | **MISCONFIGURED** (uses placeholder) |
| `NEXT_PUBLIC_BASE_SEPOLIA_RPC` | Contains `YOUR_ALCHEMY_KEY` | Base Sepolia transport URL | **MISCONFIGURED** (uses placeholder) |
| `NEXT_PUBLIC_BUNDLER_URL` | Contains `YOUR_ALCHEMY_KEY` | ERC-4337 UserOperation bundler | **MISCONFIGURED** (uses placeholder) |
| `NEXT_PUBLIC_PAYMASTER_URL` | Contains `YOUR_ALCHEMY_KEY` | ERC-4337 gas policy sponsor | **MISCONFIGURED** (uses placeholder) |
| `NEXT_PUBLIC_CHAIN_ID` | `84532` | Primary network selector | Valid (Base Sepolia `84532`) |

---

## 4. Exposed Secrets Analysis

We scanned the codebase for plaintext credentials or exposed secrets:
- In [auth.tsx](file:///Users/jeeveshsingale/web3-freedom-upgrade/src/app/lib/auth.tsx), previous hardcoded plaintext admin credentials (`jeevesh2515@gmail.com`) have been successfully removed/abstracted via Privy.
- There are no visible exposed private keys or database passwords committed.
- `.env.local` is correctly registered in the project's `.gitignore` and will not be pushed to GitHub.

---

## 5. Affected Systems

1. **Wagmi/Viem Client Connectivity:** The Wagmi transport configuration uses `NEXT_PUBLIC_BASE_SEPOLIA_RPC` which tries to query the literal address `https://base-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY`. This causes connection timeouts and failure to read/write state.
2. **Gas Sponsorship (Paymaster):** The Alchemy Gas Paymaster hook uses `NEXT_PUBLIC_PAYMASTER_URL`. This placeholder URL returns HTTP 401 Unauthorized or DNS resolution errors, blocking zero-gas smart contract distribution execution.
3. **ERC-4337 Bundling:** Submitting user operations via `NEXT_PUBLIC_BUNDLER_URL` throws invalid endpoint exceptions.

---

## 6. Recommended Fix

To resolve the misconfiguration cleanly and securely without exposing secret variables, we must replace all occurrences of `YOUR_ALCHEMY_KEY` in `.env.local` with the active API key `kcU9NMIFFiSqIueAidvdi`.

```env
# Before:
NEXT_PUBLIC_BASE_SEPOLIA_RPC=https://base-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY

# After:
NEXT_PUBLIC_BASE_SEPOLIA_RPC=https://base-sepolia.g.alchemy.com/v2/kcU9NMIFFiSqIueAidvdi
```

---

## 7. Next Actions

1. Proceed to **Phase B** to investigate Privy and Wagmi provider hierarchies.
2. Formulate Phase F to apply safe fixes for the placeholder values inside `.env.local`.
