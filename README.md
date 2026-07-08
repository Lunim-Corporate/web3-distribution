# LUNIM — Web3 Creative Rights & Revenue Distribution Platform

A cinematic-grade Web3 platform for creative rights management and automated revenue distribution. Built for modern digital production studios — transparent royalty splitting, real-time milestone tracking, and smart-contract-backed financial operations.

**Live:** [web3-distribution.vercel.app](https://web3-distribution.vercel.app)

---

## Web3 Freedom Upgrade Highlights

This branch contains the following major features and usability improvements:
- **USD-Denominated Distributions**: All distribution inputs are denominated in USD (dollars) rather than Raw Ether, utilizing real-time price feeds (`useEthPrice`) to calculate and display exact USD/ETH conversions for every rights holder share (e.g. `$25.00 (0.0083 Ξ)`).
- **Cinematic Multi-Stage Progress Modal**: The distribution execution popup sequentially animates circular loaders through each individual rights holder, providing granular real-time feedback for each transfer step.
- **Demo Mode Accrued Earnings Claims**: Custom MetaMask/connected wallets dynamically receive a mock accrued balance of `0.2500 ETH` on the Profile page to fully demonstrate the Solidity Pull-Payment claiming flow.
- **EVM Revert Prevention**: The claim pipeline checks on-chain balances beforehand; if the balance is zero, it gracefully falls back to the simulated secure claim process, preventing MetaMask transaction reverts.
- **Clean Profile Names**: Bypassed/admin users now resolve to clean display names like `Demo Admin` and `Jeevesh Admin` instead of raw usernames like `admin`.
- **E2E Test Suites**: Integrated Playwright browser automation tests to verify the distribution flows and profile claim pipelines locally.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         LUNIM PLATFORM                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FRONTEND (Next.js 14 App Router)                               │
│  ├── Landing Page (/)                                           │
│  ├── Auth: Login / Signup (Privy — Email, Google, Social)       │
│  ├── Dashboard (/dashboard) — Overview, Revenue, Holders, Tabs  │
│  ├── Web3 Demo (/web3-demo) — On-chain distribution simulator   │
│  ├── Admin Panel (/admin) — User management                     │
│  └── Profile (/profile) — User settings & wallet management     │
│                                                                 │
│  API LAYER (15 Route Handlers)                                   │
│  ├── /api/dashboard         — Project + holder + tx data        │
│  ├── /api/web3/*            — Record transactions, distribute   │
│  ├── /api/auth/*            — Signup, sync, invite              │
│  ├── /api/reports/*         — Generate & export revenue reports │
│  ├── /api/projects/*        — Project CRUD                      │
│  ├── /api/rights/*          — Rights holder management          │
│  ├── /api/payments          — Payment records                   │
│  ├── /api/stripe/checkout   — Stripe integration                │
│  ├── /api/activities        — Activity feed                     │
│  ├── /api/revenue           — Revenue analytics                 │
│  └── /api/diagnostics       — System health check               │
│                                                                 │
│  WEB3 LAYER                                                     │
│  ├── Privy — Auth + Embedded Wallets (EOA)                      │
│  ├── Wagmi + Viem — Ethereum interaction                        │
│  ├── Safe Smart Account — ERC-4337 Account Abstraction          │
│  ├── Alchemy Paymaster — Gas sponsorship                        │
│  ├── RevenueRights.sol — On-chain revenue splitting             │
  └── RevenueRightsUpgradeable.sol — UUPS upgradeable variant    │
│                                                                 │
│  DATABASE (Supabase PostgreSQL)                                  │
│  ├── projects           — Production projects                   │
│  ├── rights_holders     — Revenue recipients with % splits      │
│  ├── transactions       — On-chain tx records                   │
│  ├── transaction_splits — Per-holder ETH amounts per tx         │
│  ├── activities         — Event feed                            │
│  └── users_profile      — User accounts & wallet addresses      │
│                                                                 │
│  BLOCKCHAIN (Hardhat Local / Base Sepolia)                       │
│  ├── RevenueRights.sol — Basis-point revenue distribution       │
│  ├── RevenueSplitter.sol — Dynamic share management             │
│  └── RevenueRightsUpgradeable.sol — UUPS upgradeable variant    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Prerequisites

- Node.js v18+
- npm
- Supabase project (free tier works)
- MetaMask (for Web3 demo)

### 1. Install

```bash
git clone https://github.com/Lunim-Corporate/web3-distribution.git
cd web3-distribution
git checkout web3-freedom-upgrade
npm install
```

### 2. Configure

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Required for local dev
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=any-random-secret-32-chars-minimum
```

### 3. Run

```bash
npm run demo:full
```

Opens at **http://localhost:3000** with 5 projects, 28 rights holders, and ~12 demo transactions pre-loaded.

> Enable **Demo Mode** (toggle in navbar) to bypass auth and use simulated accounts.

### Manual Steps

```bash
npm run compile          # Compile Solidity contracts
npm run deploy:local     # Deploy to Hardhat localhost
npm run seed             # Populate Supabase with demo data
npm run client           # Start Next.js dev server only
npx hardhat node         # Start Hardhat blockchain only
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router), React 18, Tailwind CSS, Framer Motion |
| **Auth** | Privy (email/social login, embedded wallets) |
| **Web3** | Wagmi, Viem, Safe Smart Account (ERC-4337), Alchemy Paymaster |
| **Database** | Supabase (PostgreSQL, Row Level Security) |
| **Smart Contracts** | Solidity 0.8.20, Hardhat, OpenZeppelin |
| **Payments** | Stripe (Checkout, Webhooks) |
| **Hosting** | Vercel (frontend), Base Sepolia (contracts) |

---

## Smart Contracts

### RevenueRights.sol

Core revenue distribution contract with Pull Payment pattern:

- **Constructor** — Sets rights holders with wallet addresses, names, roles, and basis points (must sum to 10000 = 100%)
- **`distributeRevenue()`** — Splits incoming ETH proportionally across all holders
- **`claim()`** — Holders withdraw their accumulated balance
- **`getRightsHolders()`** — Returns all holders with allocations
- Security: ReentrancyGuard, owner-only functions, basis point validation

### RevenueSplitter.sol

Extended version with dynamic share management:

- Add/remove/update holders post-deployment
- Owner-controlled share adjustments
- Same Pull Payment claim pattern

### Test Suite

```bash
npx hardhat test    # 35 tests passing
```

Covers: compilation, distribution math, reentrancy, claim logic, edge cases, basis point validation.

---

## Project Structure

```
web3-freedom-upgrade/
├── contracts/                    # Solidity source
│   ├── RevenueRights.sol
│   ├── RevenueSplitter.sol
│   └── RevenueRightsUpgradeable.sol
├── scripts/                      # Deploy, seed, verify, test scripts
│   ├── deploy.js                 # Deploy to Hardhat localhost
│   ├── deploy-demo.js            # Deploy demo contract (7 holders)
│   ├── deploy-live.js            # Deploy live contract (10 holders)
│   ├── deploy-testnet.js         # Deploy to Base Sepolia
│   ├── deploy-mainnet.js         # Deploy to Base Mainnet
│   ├── deploy-upgradeable.js     # Deploy UUPS upgradeable contract
│   ├── seed.js                   # Populate demo data
│   ├── verify-demo.js            # System verification
│   ├── verify-e2e.js             # End-to-end verification
│   └── api-smoke-test.js         # API endpoint tests
├── test/                         # Hardhat unit tests (44 tests)
├── src/
│   └── app/
│       ├── page.tsx              # Landing page
│       ├── layout.tsx            # Root layout (providers, auth)
│       ├── login/                # Login page
│       ├── signup/               # Signup page
│       ├── dashboard/            # Main dashboard (5 tabs)
│       ├── web3-demo/            # Web3 distribution simulator
│       ├── admin/                # Admin panel
│       ├── profile/              # User profile
│       ├── project/[id]/         # Individual project page
│       ├── api/                  # 15 API route groups
│       │   ├── auth/             # Signup, sync, invite
│       │   ├── dashboard/        # Project data aggregation
│       │   ├── web3/             # Record tx, auto-distribute
│       │   ├── reports/          # Generate & export reports
│       │   ├── projects/         # Project CRUD
│       │   ├── rights/           # Holder management
│       │   ├── payments/         # Payment records
│       │   ├── stripe/           # Stripe checkout
│       │   ├── activities/       # Activity feed
│       │   ├── revenue/          # Revenue analytics
│       │   ├── etl/              # Ingest, aggregate, reconcile
│       │   └── diagnostics/      # Health check
│       ├── components/           # React components
│       │   ├── auth/             # Login, Signup components
│       │   ├── dashboard/        # Charts, Revenue, Activity, Reports
│       │   └── Navbar.tsx        # Navigation with demo accounts
│       └── lib/                  # Shared utilities
│           ├── web3/             # Privy, Wagmi, contract hooks
│           ├── auth.tsx          # Auth context & provider
│           ├── supabaseClient.ts # Supabase client
│           ├── validation.ts     # Zod schemas
│           ├── rateLimit.ts      # Rate limiting
│           ├── apiSecurity.ts    # Security headers
│           └── requestCache.ts   # Request deduplication & caching
├── supabase/
│   └── migrations/               # 11 SQL migration files
├── package.json
├── hardhat.config.js
├── tsconfig.json
├── vercel.json
├── AGENTS.md                     # Agent guidance
├── DEMO.md                       # Local demo walkthrough
└── VERCEL_DEPLOY.md              # Vercel deployment guide
```

---

## Available Scripts

| Command | Description |
|---------|------------|
| `npm run dev` | Start Hardhat + Next.js concurrently |
| `npm run client` | Start Next.js dev server only |
| `npm run chain` | Start Hardhat node only |
| `npm run compile` | Compile Solidity contracts |
| `npm run deploy:local` | Deploy contracts to Hardhat |
| `npm run deploy:demo` | Deploy demo contract (7 holders, Hardhat) |
| `npm run deploy:live` | Deploy live contract (10 holders) |
| `npm run seed` | Seed database with demo data |
| `npm run demo:full` | compile + deploy:demo + seed (all-in-one) |
| `npm run test:api` | API smoke tests |
| `npm run test:dist` | Run Playwright E2E test for distribution flow |
| `npm run test:claim` | Run Playwright E2E test for accrued earnings claiming flow |
| `npx hardhat test` | Smart contract unit tests (44 tests) |
| `npm run build` | Production build (lint + typecheck + static gen) |
| `npm run lint` | ESLint (zero warnings) |

---

## Environment Variables

### Required (Local Dev)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `JWT_SECRET` | JWT signing secret |

### Optional (Web3 Features)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_PRIVY_APP_ID` | Privy app ID for social/email login |
| `PRIVY_APP_SECRET` | Privy server-side secret |
| `NEXT_PUBLIC_ALCHEMY_API_KEY` | Alchemy API key for Base Sepolia RPC |
| `NEXT_PUBLIC_ALCHEMY_GAS_POLICY_ID` | Gas Manager policy for sponsored txs |
| `NEXT_PUBLIC_REVENUE_SPLITTER_ADDRESS` | Deployed RevenueRights contract address |
| `NEXT_PUBLIC_CHAIN_ID` | `84532` (Base Sepolia), `31337` (Hardhat), or `8453` (Base Mainnet) |
| `STRIPE_SECRET_KEY` | Stripe secret key for payments |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |

See `.env.example` for the full list.

---

## Deployment

### Frontend (Vercel)

```bash
vercel --prod
```

See [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) for detailed instructions (Option A: fork, Option B: direct link).

### Contracts (Base Sepolia)

```bash
npx hardhat run scripts/deploy-testnet.js --network baseSepolia
npx hardhat verify --network baseSepolia <CONTRACT_ADDRESS>
```

Requires `DEPLOYER_PRIVATE_KEY` in `.env.local`.

---

## Security

- **Rate limiting** — 4-tier sliding window (read, write, auth, sensitive)
- **Input validation** — Zod schemas with Ethereum checksum validation
- **Auth** — Privy + JWT, server-side role verification
- **Middleware** — Protects `/dashboard/*` and `/admin/*` routes
- **Admin role** — Server-side only, never trusted from client cookies
- **Security headers** — CSP, clickjacking DENY, HSTS

---

## License

Proprietary — Lunim Corporation.
