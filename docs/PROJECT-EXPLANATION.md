# LUNIM - Complete Project Explanation

> A comprehensive guide to understanding the LUNIM Creative Rights & Revenue Distribution Platform from scratch.

---

## Table of Contents

1. [What Does This Project Do?](#1-what-does-this-project-do)
2. [High-Level Architecture](#2-high-level-architecture)
3. [How Money Moves Through the System](#3-how-money-moves-through-the-system)
4. [Smart Contract Deep Dive](#4-smart-contract-deep-dive)
5. [Wallet Connections Explained](#5-wallet-connections-explained)
6. [Understanding Hardhat (Local Blockchain)](#6-understanding-hardhat-local-blockchain)
7. [Database & Data Flow](#7-database--data-flow)
8. [Complete Workflow Example](#8-complete-workflow-example)
9. [Smart Contract Deployment & Upgradability](#9-smart-contract-deployment--upgradability)
10. [Recommendations & Shortcomings](#10-recommendations--shortcomings)
11. [Quick Start Guide](#11-quick-start-guide)

---

## 1. What Does This Project Do?

**LUNIM** is a **Creative Rights & Revenue Distribution Platform** designed for the entertainment industry. Think of it as a "royalty tracking system" but powered by blockchain smart contracts.

### Core Functionality

- **Track media projects** (films, music, etc.) and their rights holders
- **Distribute revenue automatically** to all contributors based on pre-defined percentages
- **Provide transparency** - anyone can verify payments on the blockchain
- **Modern UX** - users sign in with Google/Email without needing crypto wallets

### Real-World Use Case

Imagine a film like "Neon Requiem" with 5 contributors:

| Contributor | Role | Percentage |
|-------------|------|------------|
| Aria Voss | Director | 28% |
| Marcus Delgado | Lead Actor | 22% |
| Priya Nair | Producer | 18% |
| Theo Harrington | Music Composer | 17% |
| Simone Okafor | Screenplay Writer | 15% |

When revenue (ETH) comes in, the smart contract automatically splits it according to these percentages and sends ETH to each person's wallet - no manual distribution needed.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE (Next.js)                    │
│  - Login/Signup Pages                                               │
│  - Dashboard (Projects, Transactions, Analytics)                    │
│  - Smart Contract Panel (Send ETH, Release Payments)              │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        AUTHENTICATION (Privy)                       │
│  - Google Login / Email OTP                                         │
│  - Embedded Wallet Creation (No MetaMask required!)               │
│  - Smart Account (Safe) for gas-free transactions                  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      BLOCKCHAIN (Base Network)                     │
│  - Smart Contract: RevenueRights.sol                              │
│  - Smart Account: Safe (ERC-4337)                                  │
│  - Gas Sponsorship: Alchemy Paymaster                             │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         DATABASE (Supabase)                        │
│  - Projects (name, genre, contract_address)                       │
│  - Rights Holders (name, role, wallet_address, percentage)        │
│  - Transactions (tx_hash, amount, status)                         │
│  - Transaction Splits (who got what)                               │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     BACKEND (Express Server)                       │
│  - API Routes (auth, projects, transactions)                      │
│  - Contract Listener (monitors blockchain events)                  │
│  - JWT Authentication                                              │
└─────────────────────────────────────────────────────────────────────┘
```

### The Three-Process Stack

| Process | Port | Purpose |
|---------|------|---------|
| **Next.js** | 3000 | Frontend + API routes |
| **Express** | 4000 | Backend for DB mutations, JWT-protected routes |
| **Hardhat Node** | 8545 | Local Ethereum blockchain |

---

## 3. How Money Moves Through the System

### The Two Modes

#### A. Local Development Mode (Hardhat)

```
User Dashboard → SmartContractPanel → Hardhat Node (localhost:8545)
                                                    │
                                                    ▼
                                         RevenueRights.sol
                                                    │
                          ┌─────────────────────────┼─────────────────────────┐
                          ▼                         ▼                         ▼
                    Aria Voss                Marcus Delgado            Priya Nair
                   (Wallet #1)               (Wallet #2)               (Wallet #3)
```

#### B. Production Mode (Base Network)

```
User Dashboard → SmartContractPanel → Base Mainnet/Sepolia
                                                    │
                                                    ▼
                                         RevenueRights.sol
                                                    │
                          ┌─────────────────────────┼─────────────────────────┐
                          ▼                         ▼                         ▼
                    Aria Voss                Marcus Delgado            Priya Nair
                   (EOA Wallet)              (EOA Wallet)              (EOA Wallet)
        (OR Smart Account via Safe)
```

### Step-by-Step Money Flow

1. **Money Enters the Contract**
   - Someone sends ETH to the `RevenueRights` smart contract
   - This can be done via the "Send ETH to contract" button in the Dashboard
   - OR by directly sending ETH to the contract address

2. **Distribution Triggered**
   - Admin clicks "Release Payments" button
   - This calls `distributeRevenue()` function on the smart contract

3. **Smart Contract Splits Money**
   ```solidity
   // For each holder:
   share = (totalAmount * basisPoints) / 10000
   holder.wallet.transfer(share)
   ```

4. **On-Chain Events Emitted**
   - `RevenueDistributed` event - total amount, sender, timestamp
   - `HolderPaid` event - each recipient's name, role, amount

5. **Backend Listens & Records**
   - The Express server's `contractListener.js` monitors these events
   - It writes the transaction to the Supabase database
   - Dashboard updates to show the distribution

---

## 4. Smart Contract Deep Dive

### RevenueRights.sol - The Main Contract

**Location:** `contracts/RevenueRights.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract RevenueRights {

    struct RightsHolder {
        address payable wallet;
        string fullName;
        string role;
        uint256 basisPoints; // out of 10000 (100% = 10000)
    }

    RightsHolder[] public rightsHolders;
    address public owner;
    uint256 public totalDistributed;

    event RevenueDistributed(
        address indexed sender,
        uint256 totalAmount,
        uint256 timestamp
    );

    event HolderPaid(
        address indexed recipient,
        string fullName,
        string role,
        uint256 amount,
        uint256 basisPoints
    );
}
```

### Key Functions

| Function | Description |
|----------|-------------|
| `constructor()` | Takes arrays of wallets, names, roles, percentages. Validates total = 10000 (100%) |
| `distributeRevenue()` | Main function - splits incoming ETH to all holders based on their basisPoints |
| `receive()` | Fallback - if someone sends ETH directly, it automatically triggers distribution |
| `getRightsHolders()` | Returns array of all holders |
| `getContractBalance()` | Returns current ETH balance in contract |
| `getTotalDistributed()` | Returns total ETH ever distributed |

### How Distribution Works (Line by Line)

```solidity
function distributeRevenue() external payable {
    require(msg.value > 0, "Must send ETH");  // Must send ETH
    uint256 remaining = msg.value;            // Track remaining to distribute

    for (uint i = 0; i < len; i++) {
        uint256 share;
        if (i == len - 1) {
            // Last holder gets whatever is left (avoids rounding errors)
            share = remaining;
        } else {
            // Calculate share: (total * basisPoints) / 10000
            share = (msg.value * rightsHolders[i].basisPoints) / 10000;
            remaining -= share;
        }
        // Transfer ETH to holder's wallet
        rightsHolders[i].wallet.transfer(share);

        // Emit event for backend to listen
        emit HolderPaid(
            rightsHolders[i].wallet,
            rightsHolders[i].fullName,
            rightsHolders[i].role,
            share,
            rightsHolders[i].basisPoints
        );
    }

    totalDistributed += msg.value;
    emit RevenueDistributed(msg.sender, msg.value, block.timestamp);
}
```

### Secondary Contract: RevenueSplitter.sol

**Location:** `contracts/RevenueSplitter.sol`

This is an alternative contract with a different pattern - it uses a "pull-based" mechanism where each recipient must call `release()` to claim their funds (more secure against reentrancy attacks).

```solidity
contract RevenueSplitter {
    mapping(address => uint256) public shares;
    mapping(address => uint256) public released;

    function addPayee(address account, uint256 shares_) external onlyOwner { ... }
    function release(address payable account) external { ... }
}
```

---

## 5. Wallet Connections Explained

### The Evolution of Wallets in This Project

#### Phase 1: Original (MetaMask Required)

```
User → Install MetaMask → Create/Import Wallet → Connect → Sign Transactions
```

#### Phase 2: Current (Embedded via Privy)

```
User → Login with Google/Email → Privy creates embedded wallet →
       Safe Smart Account created (optional) → No signature required (gas sponsored)
```

### Three Types of Wallets in This System

| Wallet Type | Description | Used For |
|-------------|-------------|----------|
| **Hardhat Wallets** | Local test wallets (Accounts 0-9) | Local development only |
| **EOA Wallets** | Externally Owned Accounts (MetaMask, etc.) | External holders receiving payments |
| **Embedded Wallets** | Privy-created wallets (MPC-secured) | Platform users (admin, etc.) |
| **Smart Accounts** | Safe accounts (ERC-4337) | Gas-free transactions |

### The Hardhat Wallets (Local Development)

When you run `npm run chain` (Hardhat node), it creates 20 test accounts. The deploy script uses accounts 1-5 for the initial rights holders:

```javascript
// From scripts/seed.js - generates deterministic addresses
const mnemonic = Mnemonic.fromPhrase('test test test test test test test test test test test junk');
const getWallet = (index) => HDNodeWallet.fromMnemonic(mnemonic, `m/44'/60'/0'/0/${index}`).address;

// Wallet[1] = Aria Voss (Director) - 28%
// Wallet[2] = Marcus Delgado (Lead Actor) - 22%
// Wallet[3] = Priya Nair (Producer) - 18%
// Wallet[4] = Theo Harrington (Music) - 17%
// Wallet[5] = Simone Okafor (Writer) - 15%
```

These are used in `scripts/deploy.js` to deploy the contract with initial holders.

### The Privy Embedded Wallets

When a user signs up via Google or Email:
1. Privy creates an embedded wallet automatically
2. User never sees a private key (MPC - Multi-Party Computation)
3. This wallet can sign transactions invisibly

### Smart Accounts (Safe)

- Wraps the embedded wallet in a Safe smart contract
- Enables ERC-4337 (Account Abstraction)
- Allows gas sponsorship via Alchemy
- Users don't need to hold ETH to make transactions

### Wallet Provider Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    src/app/layout.tsx                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Web3Providers (providers.tsx)           │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │     PrivyProvider                          │   │   │
│  │  │  - Login Methods: email, google            │   │   │
│  │  │  - Embedded Wallets: auto-create           │   │   │
│  │  │  - Default Chain: Base Sepolia            │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │     WagmiProvider (via Privy)              │   │   │
│  │  │  - Chains: Base, BaseSepolia, Hardhat      │   │   │
│  │  │  - Config: wagmiConfig.ts                  │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              AuthProvider (auth.tsx)                │   │
│  │  - Syncs Privy user to Supabase profile            │   │
│  │  - Manages wallet connection state                  │   │
│  │  - Handles logout/session expiry                    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Understanding Hardhat (Local Blockchain)

### What is Hardhat?

Hardhat is a local Ethereum development network. It's like having your own private blockchain running on your computer.

### Why Use It?

1. **No real money risk** - All test transactions are free
2. **Fast** - No waiting for block confirmations
3. **Debugging** - Detailed logs and error messages
4. **Development** - Perfect for building and testing

### How to Run

```bash
# Terminal 1: Start Hardhat node
npm run chain

# Terminal 2: Start Express backend (listens to Hardhat)
npm run server:dev

# Terminal 3: Start Next.js frontend
npm run client

# Or run all at once:
npm run dev
```

### Hardhat Configuration

**Location:** `hardhat.config.js`

```javascript
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
  },
};
```

### The Contract Listener Connection

**Location:** `server/lib/contractListener.js`

```javascript
const provider = new JsonRpcProvider('http://127.0.0.1:8545');
const contract = new Contract(contractAddress, abi, provider);

contract.on("RevenueDistributed", async (sender, totalAmount, timestamp, event) => {
    // When transaction happens on Hardhat, this runs automatically
    // It writes to Supabase database

    // 1. Check if tx already exists
    // 2. Find project by contract_address
    // 3. Insert transaction record
});
```

---

## 7. Database & Data Flow

### Database Schema

**Location:** `supabase/migrations/001_schema.sql`

#### Projects Table

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  genre TEXT,
  description TEXT,
  poster_url TEXT,
  contract_address TEXT,
  network TEXT DEFAULT 'localhost',
  status TEXT CHECK (status IN ('active','completed','upcoming')) DEFAULT 'active',
  total_distributed NUMERIC(20,8) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### Rights Holders Table

```sql
CREATE TABLE rights_holders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  percentage NUMERIC(5,2) NOT NULL,
  total_received NUMERIC(20,8) DEFAULT 0,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### Transactions Table

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  tx_hash TEXT UNIQUE NOT NULL,
  sender_address TEXT NOT NULL,
  total_amount_eth NUMERIC(20,8) NOT NULL,
  block_number BIGINT,
  status TEXT CHECK (status IN ('pending','confirmed','failed')) DEFAULT 'pending',
  network TEXT DEFAULT 'localhost',
  created_at TIMESTAMPTZ DEFAULT now(),
  confirmed_at TIMESTAMPTZ
);
```

#### Transaction Splits Table

```sql
CREATE TABLE transaction_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  rights_holder_id UUID REFERENCES rights_holders(id),
  wallet_address TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  percentage NUMERIC(5,2) NOT NULL,
  amount_eth NUMERIC(20,8) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Data Flow Diagram

```
Smart Contract (on-chain)
        │
        │ emits RevenueDistributed event
        │ emits HolderPaid event (x5)
        ▼
Express contractListener.js
        │
        │ Listens for events via JsonRpcProvider
        │ Filters duplicate transactions
        ▼
Supabase Database
  ├── transactions table (tx_hash, amount, status)
  └── transaction_splits table (who got what amount)
        │
        │ Supabase Realtime subscription
        ▼
Next.js Dashboard (react-hot-toast notifications)
        │
        │ displays
        ▼
User sees: "Aria Voss received 0.14 ETH"
```

---

## 8. Complete Workflow Example

### Scenario: Admin releases 0.5 ETH to "Neon Requiem" team

#### Step-by-Step Flow

```
1. ADMIN LOGIN
   └─ User visits /login
   └─ Clicks "Continue with Email or Google"
   └─ Privy authenticates (Google/Email OTP)
   └─ Privy creates embedded wallet (if first login)
   └─ AuthProvider syncs user to Supabase

2. NAVIGATE TO DASHBOARD
   └─ Dashboard loads projects list
   └─ SmartContractPanel shows contract balance

3. INITIATE DISTRIBUTION
   └─ Admin enters: 0.5 ETH
   └─ Admin clicks: "Release Payments"
   └─ SmartContractPanel.handleReleasePayments() called

4. SMART ACCOUNT TRANSACTION (useRevenueSplitter)
   └─ Find embedded wallet (Privy)
   └─ Create Safe Smart Account (if not exists)
   └─ Build UserOperation (ERC-4337)
   └─ Sign with embedded wallet (invisible to user)
   └─ Send to Alchemy Bundler

5. BLOCKCHAIN EXECUTION
   └─ Alchemy Bundler includes UserOperation
   └─ Safe Smart Account calls RevenueRights.distributeRevenue({value: 0.5 ETH})

6. CONTRACT LOGIC EXECUTES
   └─ RevenueRights distributes:
      - Aria Voss: 0.14 ETH (28%)
      - Marcus Delgado: 0.11 ETH (22%)
      - Priya Nair: 0.09 ETH (18%)
      - Theo Harrington: 0.085 ETH (17%)
      - Simone Okafor: 0.075 ETH (15%)

   └─ Events emitted:
      - RevenueDistributed(sender, 0.5 ETH, timestamp)
      - HolderPaid(x5) - one for each recipient

7. BACKEND LISTENS
   └─ contractListener.js catches RevenueDistributed
   └─ Writes to transactions table
   └─ Writes to transaction_splits table (x5)

8. FRONTEND UPDATES
   └─ CustomEvent('payment-recorded') dispatched
   └─ Dashboard re-fetches transaction data
   └─ User sees success toast: "Release transaction submitted!"

9. COMPLETE
   └─ Contract balance updated
   └─ Total distributed updated
   └─ All holders have received their ETH
```

---

## 9. Smart Contract Deployment & Upgradability

### Current Deployment Status

| Network | Chain ID | Status | Contract Address |
|---------|----------|--------|------------------|
| Hardhat (localhost) | 31337 | Deployed (RevenueRights.sol) | 0x5FbDB2315678afecb367f032d93F642f64180aa3 |
| Hardhat (localhost) | 31337 | Deployed (RevenueRightsUpgradeable.sol) | Via UUPS proxy |
| Base Sepolia | 84532 | Configured | Needs deployment |
| Base Mainnet | 8453 | Not deployed | Needs deployment |

### Deployment Process

#### Step 1: Deploy to Local Hardhat

```bash
# Compile contracts
npm run compile

# Deploy to local
npm run deploy:local

# This:
# 1. Deploys RevenueRights.sol with initial holders
# 2. Saves ABI to src/contracts/RevenueRights.json
# 3. Updates CONTRACT_ADDRESS in .env.local
# 4. Updates contract_address in Supabase projects table
```

#### Step 2: Deploy to Base Sepolia (Testnet)

First, update `hardhat.config.js`:

```javascript
networks: {
  localhost: { url: "http://127.0.0.1:8545" },
  baseSepolia: {
    url: process.env.BASE_SEPOLIA_RPC,
    accounts: [process.env.PRIVATE_KEY],
    chainId: 84532
  }
}
```

Then run:

```bash
npx hardhat run scripts/deploy-testnet.js --network baseSepolia
```

#### Step 3: Deploy to Base Mainnet (Production)

```bash
npx hardhat run scripts/deploy-mainnet.js --network base
```

#### Step 4: Deploy Upgradeable Contract (UUPS Proxy)

```bash
npm run deploy:upgradeable
```

This deploys `RevenueRightsUpgradeable.sol` via a UUPS proxy pattern, allowing future implementation upgrades without changing the contract address.

### Can You Update/Modify the Contract After Deployment?

**Short Answer: It depends on the contract.**

#### Non-Upgradeable Contracts

`RevenueRights.sol` and `RevenueSplitter.sol` have **no upgrade mechanism**. To change holders or percentages, you must:

1. Deploy a **new** contract with new parameters
2. Update the contract address in your config
3. Migrate any remaining funds to the new contract

#### Upgradeable Contract (Implemented)

For production, `RevenueRightsUpgradeable.sol` implements the **UUPS Proxy Pattern** (`contracts/RevenueRightsUpgradeable.sol`):

```
┌─────────────────────────────────────────────────────────────┐
│                    Proxy Contract (immutable)               │
│  - Stores the address of implementation                    │
│  - Delegates all calls to implementation                   │
│  - Can be upgraded by owner                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ delegates to
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               Implementation Contract (upgradeable)          │
│  - RevenueRightsUpgradeable                                 │
│  - All business logic                                       │
│  - Can be replaced without changing Proxy                  │
└─────────────────────────────────────────────────────────────┘
```

The upgradeable contract uses OpenZeppelin's UUPS pattern:

```solidity
contract RevenueRightsUpgradeable is
    Initializable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    function initialize(...) initializer public {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}
}
```

Deploy via `scripts/deploy-upgradeable.js`:

```bash
npm run deploy:upgradeable
```

---

## 10. Recommendations & Shortcomings

### Critical Issues to Address

| # | Issue | Severity | Impact | Recommendation |
|---|-------|----------|--------|----------------|
| 1 | **Upgradeability implemented** | LOW | UUPS proxy available via `RevenueRightsUpgradeable.sol` / `deploy-upgradeable.js` | Use upgradeable contract for production |
| 2 | **Base Mainnet deploy script ready** | MEDIUM | `scripts/deploy-mainnet.js` exists but not yet deployed | Set `DEPLOYER_PRIVATE_KEY` and Base RPC, then deploy |
| 3 | **Single point of failure** | MEDIUM | If contract listener stops, on-chain events not recorded | Add redundancy or use The Graph |
| 4 | **No contract verification** | MEDIUM | Cannot verify code on Block Explorer | Add verification to deployment |
| 5 | **Demo mode logic mixed with production** | MEDIUM | Could accidentally write test data to production | Separate environments completely |

### Architecture Improvements

| # | Improvement | Why | How |
|---|-------------|-----|-----|
| 1 | **Multi-sig for admin** | Currently single admin can drain contract | Implement Safe multi-sig |
| 2 | **Pausable contract** | Emergency stop capability | Add Pausable role |
| 3 | **Access control** | Only authorized addresses can trigger distribution | Add access control |
| 4 | **Events indexing** | Faster queries than scanning blocks | Use The Graph or Subgraphs |
| 5 | **Off-chain price feed** | Convert USD to ETH for user-friendly amounts | Use Chainlink price feeds |

### UX/Gap Analysis

| # | Gap | Current Behavior | Ideal Behavior |
|---|-----|------------------|----------------|
| 1 | **No wallet export UI** | Hidden in Profile | Clear "Export Wallet" button with security warnings |
| 2 | **Transaction history** | Basic list | Filterable by date, project, status |
| 3 | **Recipient management** | Only via hardcoded deploy | Add/remove holders via admin UI |
| 4 | **Gas estimation** | Hidden (sponsored) | Show "Free" badge prominently |
| 5 | **Network switching** | Manual env config | Dropdown to switch Base Sepolia/Mainnet |

### Security Considerations

| # | Finding | Recommendation |
|---|---------|----------------|
| 1 | No input validation on contract addresses | Add checksums and validation |
| 2 | `receive()` can be front-run | Add access controls |
| 3 | No emergency withdraw function | Add owner-only rescue function |
| 4 | Private keys in env (potential) | Use hardware wallet or secrets manager |

### Technical Debt

| # | Item | Location | Fix |
|---|------|----------|-----|
| 1 | Hardcoded 2FA bypass | src/app/lib/auth.tsx (old) | Removed in Phase 6 |
| 2 | Demo mode mixed with production | hooks/useRevenueContract.js | Refactor to separate mode |
| 3 | Ignores TS/ESLint errors | next.config.js | Enable for production builds |
| 4 | No test suite | project root | Add Jest + Hardhat tests |

---

## 11. Quick Start Guide

### For New Developers

#### 1. Install Dependencies

```bash
npm install
```

#### 2. Set Up Environment

```bash
cp .env.example .env.local
```

Add the following required variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Privy (get from https://dashboard.privy.io)
NEXT_PUBLIC_PRIVY_APP_ID=your-app-id
PRIVY_APP_SECRET=your-app-secret

# Alchemy (get from https://dashboard.alchemy.com)
NEXT_PUBLIC_ALCHEMY_API_KEY=your-api-key
NEXT_PUBLIC_ALCHEMY_GAS_POLICY_ID=your-policy-id
```

#### 3. Start Local Development

```bash
npm run dev
```

This starts:
- Hardhat node on port 8545
- Express backend on port 4000
- Next.js frontend on port 3000

#### 4. Deploy Contracts Locally

```bash
npm run deploy:local
```

#### 5. Seed Database

```bash
npm run seed
```

#### 6. Access the App

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Express API | http://localhost:4000 |
| Hardhat | http://localhost:8545 |
| Supabase Dashboard | https://supabase.com |

### Project Commands Reference

```bash
# Full dev environment
npm run dev

# Individual processes
npm run chain          # Hardhat local blockchain (port 8545)
npm run server:dev     # Express API with nodemon (port 4000)
npm run client         # Next.js dev server (port 3000)

# Smart contracts
npm run compile        # Compile Solidity contracts
npm run deploy:local   # Deploy RevenueRights to local Hardhat

# Database seeding
npm run seed           # Seed projects + holders
npm run seed:users     # Seed user accounts
npm run demo:full     # compile + deploy + seed + seed:users (full reset)

# Build & lint
npm run build          # Next.js production build
npm run lint           # ESLint (next lint)
```

---

## File Structure Reference

```
/
├── contracts/              # Smart contracts (Solidity)
│   ├── RevenueRights.sol   # Main distribution contract
│   ├── RevenueSplitter.sol # Alternative splitter pattern
│   └── RevenueRightsUpgradeable.sol # UUPS upgradeable variant
├── src/
│   ├── app/
│   │   ├── lib/
│   │   │   ├── auth.tsx           # Auth provider (Privy)
│   │   │   ├── apiSecurity.ts     # Server-side auth/role guards
│   │   │   ├── rateLimit.ts       # Rate limiting
│   │   │   ├── validation.ts      # Zod schemas
│   │   │   ├── requestCache.ts    # Request deduplication
│   │   │   ├── demoAccess.ts      # Demo mode helpers
│   │   │   ├── web3.ts            # Smart account hooks
│   │   │   ├── web3/              # Wagmi + Viem config
│   │   │   │   ├── providers.tsx  # Privy + Wagmi wrapper
│   │   │   │   ├── wagmiConfig.ts # Wagmi configuration
│   │   │   │   └── config.ts      # Chain configs
│   │   │   └── database.ts        # DB helpers
│   │   ├── components/
│   │   │   ├── Navbar.tsx         # Global nav (live/demo toggle)
│   │   │   └── dashboard/
│   │   │       ├── LiveDashboard.tsx  # Live network dashboard
│   │   │       ├── SmartContractPanel.tsx  # Blockchain UI
│   │   │       ├── DistributePanel.tsx
│   │   │       ├── PaymentSplitter.tsx
│   │   │       ├── EditRightsHolderModal.tsx # Inline editing
│   │   │       └── AddRightsHolderModal.tsx
│   │   ├── admin/page.tsx     # Admin control center
│   │   └── api/               # Next.js API routes (15 groups)
│   ├── contracts/           # ABI + addresses (generated)
│   └── __tests__/           # Frontend unit tests (Vitest)
├── scripts/
│   ├── deploy-demo.js       # Deploy demo contract (7 holders)
│   ├── deploy-live.js       # Deploy live contract (10 holders)
│   ├── deploy-testnet.js    # Deploy to Base Sepolia
│   ├── deploy-mainnet.js    # Deploy to Base Mainnet
│   ├── deploy-upgradeable.js# Deploy UUPS upgradeable
│   ├── seed.js              # Database seeding
│   └── verify-e2e.js        # End-to-end verification
├── vitest.config.ts         # Frontend test config
├── supabase/
│   └── migrations/          # Database schema (11 migrations)
└── hardhat.config.js       # Hardhat configuration
```

---

## Glossary

| Term | Definition |
|------|------------|
| **Basis Points** | A unit of measure equal to 1/100th of 1% (10000 bp = 100%) |
| **EOA** | Externally Owned Account - a standard Ethereum wallet |
| **ERC-4337** | Account Abstraction standard enabling smart contract wallets |
| **Gas** | Fee paid to execute transactions on Ethereum |
| **Hardhat** | Local Ethereum development network |
| **MPC** | Multi-Party Computation - cryptographic method for key management |
| **Paymaster** | Entity that sponsors gas fees for user transactions |
| **Safe** | Smart contract wallet providing multi-sig and account abstraction |
| **UserOperation** | ERC-4337 transaction structure for smart accounts |
| **Viem** | TypeScript Ethereum library (replaces ethers.js) |
| **Wagmi** | React hooks library for Ethereum |

---

*Document Version: 1.0*
*Last Updated: 2026-05-12*
*Project: LUNIM Creative Rights & Revenue Distribution Platform*
*Maintainer: Jeevesh Singale*