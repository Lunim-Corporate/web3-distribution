# INVESTIGATION REPORT: Dashboard + Transaction Flow
**Phase:** E
**Date:** 2026-05-18
**Severity:** CRITICAL

---

## 1. Issue Summary

All dashboard transaction flows are simulated or broken. No action in the dashboard produces an actual on-chain transaction. Multiple components have missing imports, mock-only logic, or dead code. The entire "Web3" layer is a facade.

---

## 2. Root Cause Analysis

The dashboard was built with placeholder/mock implementations for all blockchain interactions. Actual on-chain integration was never completed. The current state is a UI demo with no real blockchain connectivity.

---

## 3. All Dashboard Actions — Detailed Trace

### Action 1: Wallet Connection Button
```
File: SmartContractPanel.tsx via useWallet()
Hook: useWallet().connectWallet() from wallet.tsx
Flow:
  → window.ethereum.request('eth_requestAccounts')  // MetaMask-only
  → Sets state account, isConnected, balance, chainId
  → toast.success('Wallet connected successfully!')

Problems:
  - MetaMask-dependent (won't work with embedded wallets)
  - No fallback for missing MetaMask
  - No connection to Privy embedded wallet
  - No smart account creation after connection
  - balance is mocked parseInt conversion
```
**Status:** BROKEN (for Privy/embedded wallet scenario)

---

### Action 2: Contract Function Execution
```
File: SmartContractPanel.tsx
Hook: handleContractInteraction(functionName)
Flow:
  → Checks if isConnected OR userWallet exists
  → Checks admin permission
  → toast.loading()
  → await new Promise(resolve => setTimeout(resolve, 2000))  // FAKE
  → toast.success(`${functionName} executed successfully!`) // FAKE
  → console.log(`...called with account:`, account)

Problems:
  - 2-second setTimeout is NOT an actual transaction
  - No viem writeContract call
  - No UserOperation creation
  - No bundler submission
  - No receipt polling
  - No actual state change
```
**Status:** FULLY MOCKED — No blockchain interaction

---

### Action 3: Payment Processing
```
File: PaymentSplitter.tsx
Hook: handleProcessPayment()
Flow:
  → Checks admin role
  → toast.loading()
  → await new Promise(resolve => setTimeout(resolve, 2000))  // FAKE
  → Saves to localStorage
  → toast.success()
  → window.location.reload()

Problems:
  - 2-second setTimeout is fake
  - Only saves to localStorage
  - No contract interaction at all
  - Hard page reload (poor UX)
  - No RevenueSplitter.release() call
```
**Status:** FULLY MOCKED

---

### Action 4: Smart Contract View Details
```
File: SmartContractPanel.tsx
Hook: handleViewContract(contract)
Flow:
  → Opens modal
  → Shows mock contract data from mockData.ts

Problems:
  - Contract addresses are fake hex strings
  - No actual on-chain data
  - No balanceOf() calls
  - No readContract() calls
```
**Status:** SIMULATED with mock data

---

### Action 5: Generate PDF Report
```
File: dashboard/page.tsx (Generate Report button)
Flow:
  → Fetches /api/revenue
  → Creates jsPDF
  → Adds text lines
  → doc.save()

Problems:
  - /api/revenue will fail (no supabaseServer.ts)
  - Works as file-only operation if API returns empty
```
**Status:** FUNCTIONAL (non-blockchain) but API will error

---

### Action 6: Add Project
```
File: AddProjectModal.tsx
Flow:
  → Shows modal
  → Enter name, select type
  → toast.success()
  → Closes modal

Problems:
  - No persistence (not even localStorage)
  - No contract.createProject() call
  - No state update
```
**Status:** TOAST-ONLY — no actual creation

---

### Action 7: Resurface/Notification Settings
```
File: NotifyWidget.tsx
Flow:
  → Reads mockRights and mockMilestones
  → Compares dates
  → Shows notification widget
  → Dismisses to localStorage

Problems:
  - Based on hardcoded mock data
  - No real rights/milestones from chain
  - No real-time monitoring
```
**Status:** MOCK DATA only

---

### Action 8: Payment Split Calculation
```
File: PaymentSplitter.tsx
Flow:
  → Select project → get contributors
  → Enter amount → calculate splits
  → Show breakdown UI
  → "Process Payment" button

Problems:
  - "Process Payment" does NOT execute on-chain
  - No RevenueSplitter.release() call
  - localStorage-only persistence
  - No real transaction hash generation
```
**Status:** UI-ONLY — no actual payment execution

---

## 4. Dead UI Flows

| UI Element | Action | Expected | Actual |
|---|---|---|---|
| "Add Project" button | Opens modal, create project | Contract.createProject() | Just shows a toast |
| "Process Payment" button | Execute revenue split | RevenueSplitter.release() | localStorage save |
| "Execute {function}" buttons | Smart contract write | viem writeContract | setTimeout(2000) |
| "View Details" on contract | Read contract info | viem readContract | Fake mock data |
| "Connect Wallet" button | Connect/identify wallet | Privy/Wagmi connection | window.ethereum request |
| "Generate Report (PDF)" | Export revenue report | API → PDF | API fails, PDF empty |

---

## 5. Unconnected Hooks

| Hook | Connected To | Status |
|---|---|---|
| `useWallet().account` | SmartContractPanel display | DISPLAY ONLY |
| `useWallet().isConnected` | SmartContractPanel conditional | DISPLAY ONLY |
| `useWallet().chainId` | SmartContractPanel display | DISPLAY ONLY |
| `useWallet().balance` | SmartContractPanel display | DISPLAY ONLY |
| `useAuth().connectUserWallet()` | Function exists, never called | DEAD CODE |
| `useAuth().disconnectUserWallet()` | Function exists, never called | DEAD CODE |
| `useWallet()` from `web3.ts` | Never imported by any component | DEAD CODE |

---

## 6. Broken Async Flows

### Flow: Contract Create → Transaction → Receipt → State Update
```
Current: Button click → setTimeout(2000) → toast → END
Should:  Button click → wagmi.useWriteContract() 
         → alchemy.sendUserOperation() 
         → bundler.submit()
         → waitForTransactionReceipt() 
         → update state
         → toast with tx hash
```

---

## 7. Missing Contract Addresses

| Contract | Address | File |
|---|---|---|
| RevenueSplitter (Base Sepolia) | **NOT DEPLOYED** | smart-contracts/contracts/ |
| Creative Rights Manager | **FAKE** 0x1111...1111 | mockData.ts |
| Revenue Splitter | **FAKE** 0x2222...2222 | mockData.ts |

---

## 8. Missing ABIs

| ABI | Status |
|---|---|
| RevenueSplitter.abi | **MISSING** (contract exists, needs `solc` compilation) |
| ERC-20 ABI | **MISSING** (not currently needed) |
| Any contract ABI | **MISSING** |

Without ABIs, `viem.getContract()` cannot be created, and `readContract`/`writeContract` cannot work.

---

## 9. ethers.js Remnants

### Package.json
```json
"ethers": "^6.15.0"
```

### smart-contracts/package.json (Hardhat tests)
```json
"ethers": "^6.16.0"
```

The `ethers` package remains as a dependency in the frontend package.json but is never imported by any frontend code. It's a dead dependency. The smart-contracts package legitimately uses it via Hardhat.

---

## 10. Severity Assessment

**Overall: CRITICAL**

Every transaction flow is broken/mocked:
- 6 dashboard actions traced, 0 produce on-chain transactions
- 2 critical missing files cause compile errors
- All contract interactions are setTimeout-based simulations
- All payment processing is localStorage-only
- No ABI files exist for contract interaction
- No contract addresses exist for deployment targets

## 11. Files Affected

| File | Issue | Severity |
|---|---|---|
| `src/app/components/dashboard/SmartContractPanel.tsx` | Missing imports, mock txns, no real interaction | CRITICAL |
| `src/app/components/dashboard/PaymentSplitter.tsx` | localStorage payments, no on-chain | HIGH |
| `src/app/components/dashboard/AddProjectModal.tsx` | No persistence at all | HIGH |
| `src/app/dashboard/page.tsx` | Mock data, no real state | MEDIUM |
| `src/app/data/mockData.ts` | Fake contract addresses | MEDIUM |
| `src/app/lib/wallet.tsx` | MetaMask-only, no abstraction | CRITICAL |

## 12. Recommended Fix

1. Create dummyWallets.ts and walletUtils.ts (or remove SmartContractPanel imports)
2. Install viem + wagmi + @alchemy/aa-*
3. Create ABI for RevenueSplitter (compile contract)
4. Deploy RevenueSplitter to Base Sepolia
5. Create contract configuration with actual addresses
6. Replace setTimeout mock transactions with real writeContract calls
7. Replace localStorage payment persistence with on-chain transactions
8. Add proper transaction receipt polling and state updates
