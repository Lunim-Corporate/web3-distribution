# LUNIM — Local Demo Guide

Run the full platform locally with zero cost, zero real crypto, and zero external services required (except Supabase for the database).

---

## Prerequisites

- **Node.js v18+** (check: `node -v`)
- **npm** (check: `npm -v`)
- **MetaMask** browser extension (for Web3 demo)
- **Supabase project** (free tier works) — [supabase.com](https://supabase.com)

---

## Step-by-Step Demo Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in these required values:

```env
# Supabase (from your Supabase project dashboard → Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT (any random string works for local dev)
JWT_SECRET=any-random-secret-at-least-32-chars-long
```

**Everything else can stay as defaults** — the local demo uses Hardhat (localhost chain) and doesn't need Privy/Alchemy/Stripe for the sandbox.

### 3. Run the One-Command Demo

```bash
npm run demo:full
```

This single command does all of the following:

| Step | What it does |
|------|-------------|
| `compile` | Compiles Solidity contracts (`RevenueRights.sol`, `RevenueSplitter.sol`) |
| `deploy:local` | Deploys contracts to Hardhat localhost (chain ID 31337) |
| `seed` | Populates Supabase with 5 projects, 28 rights holders, ~12 transactions, 15 activities |

You'll see output like:

```
✓ Compiled 2 Solidity files successfully
✓ Deployed RevenueRights to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
✓ Seeded 5 projects with 28 rights holders
✓ Seeded 12 demo transactions with 84 splits
✓ Seeded 15 activity entries
```

> **Note:** If `demo:full` fails because Hardhat node isn't running separately, run the steps manually:

```bash
# Terminal 1: Start Hardhat node
npx hardhat node

# Terminal 2: Deploy + seed + start frontend
npx hardhat run scripts/deploy.js --network localhost
npm run seed
npm run client
```

### 4. Open the App

Visit: **http://localhost:3000**

You'll see the landing page.

---

## Demo Walkthrough

### A. Enable Demo Mode (No Login Required)

1. Click the **"Demo Mode"** toggle in the navigation bar (top right)
2. The toggle turns amber — you're now in Demo Mode
3. You'll see a pre-seeded admin account (`Demo Admin` role)

> Demo Mode bypasses Privy authentication and uses simulated Hardhat accounts.

### B. Explore the Dashboard

Navigate to **/dashboard** — you'll see:

| Tab | What it shows |
|-----|--------------|
| **Overview** | Charts, recent activity feed, top rights holders |
| **Revenue** | Revenue breakdown by project, ETH price tracking |
| **Rights Holders** | All 28 seeded holders across 5 projects with roles, percentages, wallets |
| **Reports** | Generate revenue reports per project |
| **Distribute** | (Admin only) Send revenue distributions on-chain |

### B2. Admin Control Center (/admin)

Navigate to **/admin** (requires admin role or Demo Mode active) to manage projects and rights allocations:
- **Create New Project**: Set project name and genre.
- **Edit Project Details**: Update name and genre for user-created projects (system demo projects containing admins are protected from edits).
- **Assign Rights Holder**: Add contributor names, roles, wallet addresses, and royalty split percentages (which must sum to 100.00% to successfully activate smart contracts).
- **Manage Roster**: Update or delete existing rights holders' details and split percentages.
- **User Management Tab**: Promote other users to ADMIN or demote to RIGHTS_HOLDER to delegate production management access.

### C. Run a Web3 Distribution

Navigate to **/web3-demo**:

1. **Select a Demo Account** — click one of the 3 sandbox accounts:
   - Admin Account (100 ETH)
   - Creator Account (50 ETH)
   - Contributor Account (25 ETH)

2. **Select a Project** — pick one of the 5 seeded projects:
   - Neon Requiem (Sci-Fi Thriller)
   - Dust & Dynasty (Historical Drama)
   - Glass Republic (Political Thriller)
   - The Salt Coast (Crime Drama)
   - Binary Fault (Tech Thriller)

3. **Set an Amount** — choose how much ETH to distribute (e.g., 0.01 ETH)

4. **Review the Split Preview** — see exactly how much each rights holder receives

5. **Click "Distribute"** — the transaction is simulated (no real blockchain, no real ETH)

6. **See the Result** — the dashboard updates in real-time with the new transaction

### D. View the Smart Contracts

The platform includes two Solidity contracts:

- **`RevenueRights.sol`** — Manages rights holders, distributes revenue proportionally, supports claim-based withdrawal (Pull Payment pattern)
- **`RevenueSplitter.sol`** — Extended version with dynamic share management and owner controls

Test them:

```bash
npx hardhat test
```

Runs 35 unit tests covering:
- Correct basis point allocation (must sum to 10000)
- Revenue distribution calculations
- Reentrancy guards
- Claim/pull payment logic
- Edge cases (zero amounts, single holder)

### E. Check the API Routes

15 API endpoints at `src/app/api/`:

| Route | Purpose |
|-------|---------|
| `/api/dashboard` | Project + holder + transaction data |
| `/api/web3/record-transaction` | Record on-chain transactions to Supabase |
| `/api/web3/auto-distribute` | Trigger smart contract distribution |
| `/api/auth/sync` | Sync Privy auth with Supabase profile |
| `/api/auth/signup` | Create user account |
| `/api/reports` | Generate revenue reports |
| `/api/reports/export` | Export reports as CSV |
| `/api/activities` | Activity feed |
| `/api/revenue` | Revenue data |
| `/api/rights` | Rights holder management |
| `/api/projects` | Project CRUD |
| `/api/payments` | Payment records |
| `/api/stripe/checkout` | Stripe integration |
| `/api/diagnostics` | System health check |

Test with:

```bash
npm run test:api
```

---

## Demo Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    LOCAL DEMO STACK                       │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Browser (localhost:3000)                                │
│  ├── Next.js 14 Frontend (App Router)                    │
│  ├── Demo Mode Toggle (no auth needed)                   │
│  └── MetaMask (optional, for real Web3 demo)             │
│                                                          │
│  Backend                                                 │
│  ├── Next.js API Routes (15 endpoints)                   │
│  └── Supabase Client (PostgreSQL)                        │
│                                                          │
│  Blockchain                                              │
│  ├── Hardhat Node (localhost:8545, Chain 31337)           │
│  ├── RevenueRights Contract                              │
│  └── 10 Pre-funded Test Accounts (100 ETH each)          │
│                                                          │
│  Database                                                │
│  └── Supabase (cloud-hosted PostgreSQL)                  │
│      ├── projects (5 seeded)                             │
│      ├── rights_holders (28 seeded)                      │
│      ├── transactions (12 seeded)                        │
│      ├── transaction_splits (84 seeded)                  │
│      └── activities (15 seeded)                          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Quick Reference Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start Hardhat + Next.js dev server |
| `npm run chain` | Start only Hardhat node |
| `npm run client` | Start only Next.js dev server |
| `npm run compile` | Compile Solidity contracts |
| `npm run deploy:local` | Deploy contracts to Hardhat |
| `npm run seed` | Seed database with demo data |
| `npm run demo:full` | compile + deploy + seed (all-in-one) |
| `npm run test:api` | Run API smoke tests |
| `npx hardhat test` | Run smart contract unit tests |
| `npm run build` | Production build (lint + typecheck + compile) |
| `npm run lint` | Run ESLint |

---

## Hardhat Pre-funded Accounts

These accounts have 100 ETH each on the local Hardhat chain:

| # | Address | Role in Demo |
|---|---------|-------------|
| 0 | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | Admin / Sender |
| 1 | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | Creator |
| 2 | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | Contributor |
| 3 | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` | — |
| 4 | `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65` | — |
| 5 | `0x9965507D1a55bcC2695C58ba16FB37d819C0049d` | — |
| 6 | `0x976EA74026E726554dB657fA54763abd0C3a0aa9` | — |
| 7 | `0x14dC79964da2C08daa49e8e080e1832A1bDdbc05` | — |
| 8 | `0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f` | — |
| 9 | `0xa0Ee7A142d267C1f36714E4a8F75612F20a79720` | — |

To import into MetaMask: use the mnemonic `test test test test test test test test test test test junk`.

---

## Troubleshooting

| Issue | Solution |
|-------|---------|
| `Privy provider` error | Enable Demo Mode (toggle in navbar) — bypasses auth |
| Database empty | Run `npm run seed` |
| Hardhat not running | Run `npx hardhat node` in a separate terminal |
| Wrong network in MetaMask | Switch to "Localhost 8545" or click "Switch to Hardhat" in the Web3 demo page |
| Port 3000 in use | Kill the process: `lsof -ti:3000 \| xargs kill` |
| Seed fails | Check `.env.local` has valid `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` |
