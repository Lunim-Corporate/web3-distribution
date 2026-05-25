# INVESTIGATION REPORT: Dashboard + Transaction Flow
**Phase:** E
**Date:** 2026-05-25
**Severity:** MEDIUM

---

## 1. Issue Summary

We audited all client-side transaction triggers, distribution panels, and smart contract write utilities. The UI dashboard panels (`DistributePanel.tsx` and `SmartContractPanel.tsx`) are correctly integrated with the `useRevenueSplitter()` hook from `src/app/lib/web3.ts`. There are no legacy `ethers.js` or MetaMask `window.ethereum` dependencies in the transaction flow logic. However, due to the placeholder `YOUR_ALCHEMY_KEY` blockages detailed in Phases A, C, and D, clicking distribution buttons triggers immediate uncaught transport failures.

---

## 2. Root Cause Analysis

Both the Direct Distribution (`handleDistribute` inside `DistributePanel.tsx`) and Admin Panel triggers (`handleSendETH` / `handleReleasePayments` inside `SmartContractPanel.tsx`) call `distributeRevenue()`:
```typescript
const hash = await distributeRevenue(amount);
```
Since the `smartAccountClient` fails to instantiate or request gas estimates from the paymaster due to the malformed `.env.local` URLs, the execution fails, and a "Failed to send ETH" or "Failed to connect RPC" toast message is returned to the user.

---

## 3. Transaction Execution Trace

Below is the verified operational pipeline of a revenue distribution transaction:

```
[UI Dashboard] Click "Initiate Distribution"
       │
       ▼
[DistributePanel.tsx] Triggers handleDistribute()
       │
       ▼
[web3.ts] useRevenueSplitter().distributeRevenue(amountEth)
       │
       ▼
[web3.ts] toSafeSmartAccount() builds the user's ERC-4337 Smart Account
       │
       ▼
[web3.ts] createSmartAccountClient() compiles UserOperation (fails due to Paymaster URL)
       │
       ▼
[web3.ts] smartAccountClient.sendTransaction() (UserOp submitted to Bundler - fails due to Bundler URL)
       │
       ▼
[web3.ts] publicClient.waitForTransactionReceipt(hash) (Awaits mining)
       │
       ▼
[DistributePanel.tsx] POST to /api/web3/auto-distribute to sync payment record to Supabase DB
       │
       ▼
[UI Dashboard] Custom Event 'payment-recorded' updates analytics snapshot
```

---

## 4. Operational Gaps

1. **Stale Text Labels:** `SmartContractPanel.tsx` still contains a legacy textual description: `"Wallet-connected reads/writes via ethers."` despite being completely migrated to the `viem` + `permissionless` framework. This is a minor copy mismatch.
2. **Database Syncing Gaps:** The automated database sync endpoint `/api/web3/auto-distribute` is fully functional and bypasses database-level Row-Level Security (RLS) restrictions by using the backend admin client, ensuring complete data synchronization.

---

## 5. Recommended Actions

1. Proceed to **Phase F** to apply minimal safe fixes to `.env.local` to resolve the `YOUR_ALCHEMY_KEY` placeholder vulnerability.
2. Update the textual label in `SmartContractPanel.tsx` to match the actual implemented stack.
