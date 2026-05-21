# INVESTIGATION REPORT: Smart Account + ERC-4337
**Phase:** D
**Date:** 2026-05-18
**Severity:** HIGH

---

## 1. Issue Summary

The application has zero ERC-4337 (Account Abstraction) implementation. There is no smart account creation, no bundler setup, no paymaster configuration, and no user operation flow. Despite the stated goal of supporting ERC-4337 and smart accounts, no code or configuration exists for these features.

---

## 2. Root Cause Analysis

ERC-4337 infrastructure was never built. The codebase has:
- No `@alchemy/aa-accounts` or similar SDK
- No `@account-abstraction/sdk` or similar SDK
- No bundler URL configuration
- No paymaster URL configuration
- No smart account factory contract
- No user operation construction
- No gas estimation for user ops
- No sponsored transaction flow

---

## 3. Smart Account Analysis

### Current State
**No smart account creation exists.**

The `SmartContractPanel.tsx` has a "Wallet Information" section that shows a dummy wallet from mock data, but this is entirely simulated with `setTimeout` delays. No actual smart account is created.

### Required Components

| Component | Status | Purpose |
|---|---|---|
| Smart account factory | **MISSING** | Deploys new smart accounts |
| Account abstraction SDK | **MISSING** | Handles account creation |
| EntryPoint contract | **MISSING** | Processes UserOperations |
| Module manager | **MISSING** | Manages account modules |
| Validation module | **MISSING** | Validates UserOperations |

---

## 4. Bundler Analysis

### Current State
**No bundler is configured.**

| Bundler Component | Status | Purpose |
|---|---|---|
| `BUNDLER_RPC_URL` env var | **MISSING** | Bundler endpoint |
| Alchemy Bundler | **MISSING** | Recommended bundler service |
| Pimlico Bundler | **MISSING** | Alternative bundler service |
| Stackup Bundler | **MISSING** | Alternative bundler service |
| User operation submission | **MISSING** | `eth_sendUserOperation` |
| User operation status | **MISSING** | `eth_getUserOperationReceipt` |

---

## 5. Paymaster Analysis

### Current State
**No paymaster is configured.**

| Paymaster Component | Status | Purpose |
|---|---|---|
| `PAYMASTER_API_KEY` env var | **MISSING** | Paymaster authorization |
| Paymaster URL | **MISSING** | `pm_` sponsor endpoint |
| Gas sponsorship approval | **MISSING** | `pm_sponsorUserOperation` |
| Paymaster middleware | **MISSING** | Viem client integration |
| Sponsorship policy | **MISSING** | Rules for what gets sponsored |

---

## 6. User Operation Flow

### Current State (Broken)
```
User clicks "Execute"
   → setTimeOut(2000ms)  // simulated
   → toast.success("executed")
   → NO actual UserOperation created
   → NO transaction on chain
   → NO gas estimation
```

### Expected Flow (Required)
```
User clicks "Execute"
   → Build UserOperation with account
   → Estimate gas for UserOperation
   → Request paymaster sponsorship (if eligible)
   → Sign UserOperation with owner key
   → Submit UserOperation via bundler (eth_sendUserOperation)
   → Poll for receipt (eth_getUserOperationReceipt)
   → Display transaction hash to user
```

---

## 7. Signer Incompatibilities

### Current State
The `wallet.tsx` uses `window.ethereum` as the signer. This approach is incompatible with ERC-4337 because:

| Issue | Detail |
|---|---|
| EOA vs Smart Account | window.ethereum returns an EOA, not a smart account |
| No UserOperation support | EIP-1193 providers don't support eth_sendUserOperation |
| Signing model wrong | Smart accounts use ERC-4337 validation (validAfter, validUntil, sig) |
| Gas estimation different | Smart account gas estimation is more complex |
| No paymaster middleware | window.ethereum has no concept of paymasters |

---

## 8. Contract Analysis

### File: `smart-contracts/contracts/RevenueSplitter.sol`
This is a simple payment splitter contract. It is:
- **NOT** an ERC-4337 contract
- **NOT** a smart account implementation
- A standard Solidity contract that would need to be deployed and called via smart account
- Deployable to Base Sepolia

### What's Missing for Integration
| Requirement | Status |
|---|---|
| ABI for RevenueSplitter | **MISSING** (needs compilation) |
| Deployed contract address | **MISSING** |
| viem contract instance | **MISSING** |
| Smart account contract | **MISSING** |
| EntryPoint address on Base Sepolia | **MISSING** (0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789) |

---

## 9. ERC-4337 Infrastructure Requirements

To enable smart accounts, the following infrastructure is needed:

### Packages
```json
{
  "@alchemy/aa-accounts": "^3.0.0",
  "@alchemy/aa-core": "^3.0.0",
  "@alchemy/aa-alchemy": "^3.0.0",
  "viem": "^2.0.0",
  "wagmi": "^2.0.0"
}
```

### Contracts (Base Sepolia)
| Contract | Address (Base Sepolia) |
|---|---|
| EntryPoint 0.7 | `0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789` |
| SimpleAccount Factory | `0x9406Cc6185a346906296840746125a0E44976454` |

---

## 10. Severity Assessment

**Overall: HIGH**

- ERC-4337 is completely unimplemented
- Smart accounts don't exist
- No bundler or paymaster configured
- All transactions are simulated
- SmartContractPanel uses mock data with timeouts

## 11. Files Affected

| File | Issue |
|---|---|
| `smart-contracts/contracts/RevenueSplitter.sol` | Not deployed, no ABI in frontend |
| `src/app/components/dashboard/SmartContractPanel.tsx` | Mock transactions, non-existent imports |
| `src/app/components/dashboard/PaymentSplitter.tsx` | Simulated setTimeout payments |
| `src/app/lib/wallet.tsx` | EOA-only, no ERC-4337 |
| `src/app/lib/web3.ts` | Simulated contract calls |

## 12. Recommended Fix

1. Install @alchemy/aa-accounts, @alchemy/aa-core, @alchemy/aa-alchemy
2. Configure Alchemy client with Base Sepolia + Gas Manager
3. Create smart account factory using `createLightAccount` or `createMultiOwnerModularAccount`
4. Set up paymaster with Alchemy Gas Manager URL
5. Replace mock transaction flows with real UserOperation submission
6. Compile and deploy RevenueSplitter to Base Sepolia
7. Generate ABIs and import in frontend
