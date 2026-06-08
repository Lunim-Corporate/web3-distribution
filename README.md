# LUNIM — Web3 Creative Rights & Revenue Distribution Platform

LUNIM is a cinematic-grade, enterprise-ready Web3 platform designed for creative rights management and revenue distribution. Built for modern digital production studios and content networks (e.g., HBO), it enables transparent royalty splitting, real-time milestone tracking, and smart-contract-backed financial operations.

---

## 🏗️ Architecture Overview

LUNIM utilizes a hybrid architecture blending standard Web2 performance with Web3 decentralization and security.

```mermaid
graph TD
    User([Content Admin]) -->|Initiates Split| FE[Next.js Frontend]
    FE -->|Authenticate & Sign| Privy[Privy Auth & Embedded EOA]
    
    subgraph Web3 Gasless Pipeline
        Privy -->|Request UserOp| Safe[Safe Smart Account v1.4.1]
        Safe -->|Sponsorship Request| Paymaster[Alchemy Paymaster]
        Paymaster -->|Validate & Sponsor Gas| Bundler[Alchemy Bundler]
        Bundler -->|Submit Bundled Tx| Contract[RevenueRights Contract on Base Sepolia]
    end

    subgraph EOA Fallback Pipeline (Cashless Fallback)
        Privy -->|Direct Transaction Signature| EOA_Tx[Standard Wallet Transaction]
        EOA_Tx -->|Submit Tx with Gas| Contract
    end
    
    Contract -->|Emit RevenueDistributed Event| Listener[Event Listener / Web3 Webhook]
    Listener -->|Update Ledger State| DB[(Supabase Database)]
    DB -->|Real-time Sync| FE
```

### Account Abstraction & EOA Fallback Architecture

LUNIM provides a **cashless, frictionless experience** using ERC-4337 Account Abstraction:
1. **Embedded Smart Accounts**: A Safe Smart Account is automatically created on-chain for the authenticated user via Privy embedded wallets.
2. **Gas Sponsorship**: When distributing revenue, transactions are packaged as ERC-4337 UserOperations. LUNIM sponsors 100% of the gas fees via Alchemy's Gas Manager (Paymaster), making the transaction completely free for the user.
3. **Dual Fallback Pipeline**: If Alchemy's Paymaster is unfunded or unavailable, LUNIM gracefully falls back to a standard EOA wallet signature. The user pays gas via standard testnet ETH (faucet-funded) so that operations never block.

---

## 🚀 Key Features

- **Gasless Onboarding**: Sign up via Privy using Email, Google, or Social login — no seed phrases or browser extensions required.
- **Account Abstraction (ERC-4337)**: Embedded Safe Smart Account infrastructure.
- **Sponsored Transactions**: 100% gas-free revenue distribution via Alchemy Paymaster.
- **Dark Premium Dashboard**: Visual analytics, milestone timelines, real-time activity logs.
- **Database Reconciliation**: Automated synchronization between on-chain blockchain states and local database ledgers.

---

## 🛠️ Local Development & Setup

### Prerequisites
- Node.js v18+
- npm

### 1. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 2. Environment Variables Configuration
Create a `.env.local` file in the root directory:
```bash
cp .env.example .env.local
```
Configure the following environment variables:
- `NEXT_PUBLIC_PRIVY_APP_ID`: Privy App ID for user authentication.
- `NEXT_PUBLIC_REVENUE_SPLITTER_ADDRESS`: Deployed `RevenueRights` contract address.
- `NEXT_PUBLIC_BASE_SEPOLIA_RPC`: Base Sepolia RPC endpoint (e.g. Alchemy RPC).
- `NEXT_PUBLIC_PAYMASTER_URL` / `NEXT_PUBLIC_BUNDLER_URL`: Alchemy bundler URLs.
- `NEXT_PUBLIC_ALCHEMY_GAS_POLICY_ID`: Gas Manager Policy ID for sponsored transactions.
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase API credentials.

---

## ⛓️ Smart Contract Operations (Hardhat)

The `RevenueRights` smart contract is situated under `contracts/RevenueRights.sol`.

### Compile Smart Contracts
```bash
npx hardhat compile
```

### Run Unit Tests
Verify contract behavior (basis points matching, correct splits, reentrancy guards, claim logic):
```bash
npx hardhat test
```

### Local Development Node
Start a local Hardhat network:
```bash
npx hardhat node
```

### Deploy to Base Sepolia
Deploy the contract to the Base Sepolia testnet:
```bash
npx hardhat run scripts/deploy-testnet.js --network baseSepolia
```

### Verify Contract on BaseScan
```bash
npx hardhat verify --network baseSepolia <DEPLOYED_CONTRACT_ADDRESS>
```

---

## 📦 Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, Framer Motion
- **Web3 Layer**: Privy (Auth & Embedded Wallets), Safe Accounts, Viem
- **Infrastructure**: Alchemy (Bundler & Gas Manager), Base Network
- **Database**: Supabase (PostgreSQL with Row Level Security)
