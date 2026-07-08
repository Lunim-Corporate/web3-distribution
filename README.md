# LUNIM — Web3 Creative Rights & Revenue Distribution Platform

A cinematic-grade Web3 platform for creative rights management and automated revenue distribution. Built for modern digital production studios — transparent royalty splitting, real-time milestone tracking, and smart-contract-backed financial operations.

**Live:** [web3-freedom-upgrade.vercel.app](https://web3-freedom-upgrade.vercel.app)

---

## Web3 Freedom Upgrade Highlights

This branch contains the following major features and usability improvements:

- **USD-Denominated Distributions**: All distribution inputs are denominated in USD rather than raw ETH, using real-time price feeds (`useEthPrice`) to calculate and display exact USD/ETH conversions per holder (e.g. `$25.00 (0.0083 Ξ)`).
- **Cinematic Multi-Stage Progress Modal**: The distribution execution popup sequentially animates through each rights holder — Step 4 "Reconciling ledger" now renders the full holder transfer table for maximum real-time feedback during the longest phase of distribution.
- **User Identity Stability (Security Fix)**: Switching between Demo ↔ Live modes no longer swaps the logged-in user's display name. The session identity is stable and isolated from mode toggles — `auth.tsx` no longer re-derives user from `isDemo` state.
- **Demo Mode Accrued Earnings Claims**: Connected wallets dynamically receive a mock accrued balance of `0.2500 ETH` on the Profile page to demonstrate the Solidity Pull-Payment claiming flow end-to-end.
- **EVM Revert Prevention**: The claim pipeline checks on-chain balances beforehand; if balance is zero, it gracefully falls back to a simulated secure claim, preventing MetaMask transaction reverts.
- **Clean Profile Names**: Admin/bypass users resolve to clean display names (e.g. `Demo Admin`, `Jeevesh Admin`) instead of raw usernames.
- **Project CRUD Stability**: Fixed a Supabase schema cache error on `PATCH /api/projects/:id` that caused 500 responses when updating project details.
- **Comprehensive API Verification Suite**: `scripts/pm-api-verify.js` — 19-check smoke test covering every API endpoint (projects, holders, revenue, ETL, reports, admin, diagnostics). Run with `node scripts/pm-api-verify.js`.
- **E2E Test Suites**: Playwright browser automation tests verifying distribution flows and profile claim pipelines.

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
│  ├── Admin Panel (/admin) — Project & rights holder management  │
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
│  ├── /api/etl/*             — Ingest, aggregate, reconcile      │
│  ├── /api/milestones        — Milestone tracking                │
│  ├── /api/admin/users       — Admin user management             │
│  └── /api/diagnostics       — System health check               │
│                                                                 │
│  WEB3 LAYER                                                     │
│  ├── Privy — Auth + Embedded Wallets (EOA)                      │
│  ├── Wagmi + Viem — Ethereum interaction                        │
│  ├── Safe Smart Account — ERC-4337 Account Abstraction          │
│  ├── Alchemy Paymaster — Gas sponsorship                        │
│  ├── RevenueRights.sol — On-chain revenue splitting             │
│  └── RevenueRightsUpgradeable.sol — UUPS upgradeable variant    │
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

# Optional: Privy auth (required for production login)
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id
PRIVY_APP_SECRET=your-privy-app-secret
```

### 3. Run (All-in-one)

```bash
npm run demo:full   # compile → deploy demo contract → seed DB
npm run dev         # starts Hardhat node + Next.js dev server
```

Opens at **http://localhost:3000** with 6 projects, 39 rights holders, and 15 demo transactions pre-loaded, plus 5 ETH distributed on-chain.

> Enable **Demo Mode** (toggle in navbar) to bypass Privy auth and use simulated accounts.
> Or click **Launch Sandbox Bypass** on the login page for instant admin access.

### Manual Steps

```bash
npm run compile          # Compile Solidity contracts
npm run deploy:demo      # Deploy demo contract (7 holders, Hardhat)
npm run deploy:live      # Deploy live contract (10 holders)
npm run seed             # Populate Supabase with demo data
npx hardhat node         # Start Hardhat blockchain only
npm run build            # Production build
npm run start            # Start production server
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
| **Testing** | Playwright (E2E), Vitest (unit), Hardhat (contract) |

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

### Auto-Deploy on Roster Completion

When a project's rights holders reach exactly **100% allocation**, the backend automatically deploys a new `RevenueRights` contract instance via `syncContractWithDatabase()` — no manual deployment needed.

### Test Suite

```bash
npx hardhat test    # 44 tests across 2 test files
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
├── scripts/                      # Deploy, seed, verify scripts
│   ├── deploy-demo.js            # Deploy demo contract (7 holders, Hardhat)
│   ├── deploy-live.js            # Deploy live contract (10 holders)
│   ├── deploy-testnet.js         # Deploy to Base Sepolia
│   ├── deploy-mainnet.js         # Deploy to Base Mainnet
│   ├── deploy-upgradeable.js     # Deploy UUPS upgradeable contract
│   ├── seed.js                   # Populate demo data (6 projects, 39 holders, 15 txs)
│   ├── api-smoke-test.js         # API endpoint smoke tests
│   └── pm-api-verify.js          # Comprehensive 19-check API verification suite
├── test/                         # Hardhat contract unit tests (44 tests, 2 files)
├── tests/                        # Playwright E2E browser tests
│   ├── verify-distribution.spec.js   # Distribution flow verification
│   ├── verify-deployment.spec.js     # Contract deployment verification
│   └── pm-verify-all.spec.js         # Full PM feature verification
├── src/
│   └── app/
│       ├── page.tsx              # Landing page
│       ├── layout.tsx            # Root layout (providers, auth)
│       ├── login/                # Login page (Privy + Sandbox Bypass)
│       ├── signup/               # Signup page
│       ├── dashboard/            # Main dashboard (5 tabs)
│       ├── web3-demo/            # Web3 distribution simulator
│       ├── admin/                # Admin panel (projects + rights holders)
│       ├── profile/              # User profile & earnings claim
│       ├── project/[id]/         # Individual project page
│       ├── api/                  # 15 API route groups
│       │   ├── auth/             # Signup, sync, invite
│       │   ├── dashboard/        # Project data aggregation
│       │   ├── web3/             # Record tx, auto-distribute
│       │   ├── reports/          # Generate & export reports
│       │   ├── projects/         # Project CRUD (add, list, [id] PATCH/GET)
│       │   ├── rights/           # Holder management (add, manage)
│       │   ├── payments/         # Payment records
│       │   ├── stripe/           # Stripe checkout & webhooks
│       │   ├── activities/       # Activity feed
│       │   ├── revenue/          # Revenue analytics
│       │   ├── etl/              # Ingest, aggregate, reconcile
│       │   ├── milestones/       # Milestone tracking
│       │   ├── admin/users       # Admin user list
│       │   └── diagnostics/      # System health check
│       ├── components/           # React components
│       │   ├── auth/             # LoginComponent, SignupComponent
│       │   ├── dashboard/        # Charts, Revenue, Activity, Reports, TxModal
│       │   └── ui/               # TxModal (multi-step progress modal)
│       └── lib/                  # Shared utilities
│           ├── web3/             # Privy, Wagmi, contract hooks, deployHelper
│           ├── auth.tsx          # Auth context & provider (identity stability fix)
│           ├── supabaseClient.ts # Supabase browser client
│           ├── supabaseServer.ts # Supabase server/admin client
│           ├── database.ts       # Database query helpers
│           ├── demoData.ts       # In-memory demo data (no-DB fallback)
│           ├── demoAccess.ts     # Demo mode access control
│           ├── validation.ts     # Zod schemas (input validation)
│           ├── rateLimit.ts      # Rate limiting (4-tier sliding window)
│           ├── apiSecurity.ts    # requireAuth, requireAdmin, getVerifiedUser
│           └── requestCache.ts   # Request deduplication & caching
├── supabase/
│   └── migrations/               # 11 SQL migration files (run in order)
├── .env.example                  # Environment variable template
├── package.json
├── hardhat.config.js
├── tsconfig.json
├── vercel.json
├── playwright.config.ts          # Playwright test configuration
└── vitest.config.ts              # Vitest unit test configuration
```

---

## Available Scripts

| Command | Description |
|---------|------------|
| `npm run dev` | Start Hardhat node + Next.js dev server concurrently |
| `npm run compile` | Compile Solidity contracts |
| `npm run deploy:demo` | Deploy demo contract (7 holders, Hardhat) |
| `npm run deploy:live` | Deploy live contract (10 holders) |
| `npm run seed` | Seed database with demo data |
| `npm run demo:full` | compile + deploy:demo + seed (all-in-one) |
| `npm run test:api` | API smoke tests |
| `npx hardhat test` | Smart contract unit tests (44 tests) |
| `npx playwright test` | Run all Playwright E2E tests |
| `node scripts/pm-api-verify.js` | Run 19-check API verification suite |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint (next/core-web-vitals) |

---

## Environment Variables

### Required (Local Dev)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `JWT_SECRET` | JWT signing secret (min 32 chars) |

### Optional (Web3 Features)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_PRIVY_APP_ID` | Privy app ID for social/email login |
| `PRIVY_APP_SECRET` | Privy server-side secret |
| `NEXT_PUBLIC_ALCHEMY_API_KEY` | Alchemy API key for Base Sepolia RPC |
| `NEXT_PUBLIC_ALCHEMY_GAS_POLICY_ID` | Gas Manager policy for sponsored txs |
| `NEXT_PUBLIC_CHAIN_ID` | `84532` (Base Sepolia), `31337` (Hardhat), `8453` (Base Mainnet) |
| `NEXT_PUBLIC_DEMO_CONTRACT_ADDRESS` | Deployed demo RevenueRights address |
| `NEXT_PUBLIC_LIVE_CONTRACT_ADDRESS` | Deployed live RevenueRights address |
| `STRIPE_SECRET_KEY` | Stripe secret key for payments |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |

See `.env.example` for the complete list with descriptions.

---

## Deployment

### Frontend (Vercel)

```bash
vercel --prod
```

Or connect the `web3-freedom-upgrade` branch in Vercel dashboard for automatic deploys on push.

**Live URL:** https://web3-freedom-upgrade.vercel.app

### Contracts (Base Sepolia)

```bash
npx hardhat run scripts/deploy-testnet.js --network baseSepolia
npx hardhat verify --network baseSepolia <CONTRACT_ADDRESS>
```

Requires `DEPLOYER_PRIVATE_KEY` in `.env.local`.

---

## Security

- **Rate limiting** — 4-tier sliding window (read, write, auth, sensitive)
- **Input validation** — Zod schemas with Ethereum address checksum validation
- **Auth** — Privy + JWT, server-side role verification via `requireAuth()` / `requireAdmin()`
- **Middleware** — Protects `/dashboard/*` and `/admin/*` routes
- **Admin role** — Server-side only, never trusted from client cookies
- **Identity isolation** — User session identity is stable across Demo/Live mode toggles
- **Security headers** — CSP, clickjacking DENY, HSTS
- **No secrets in git** — All sensitive values in `.env.local` (gitignored)

---

## API Verification

Run the full 19-check API suite against a running local server:

```bash
npm run start          # Start production server on :3000
node scripts/pm-api-verify.js
```

Verifies: dashboard, revenue, activities, ETH price, projects CRUD, rights holders CRUD + delete, ETL reconcile, reports, admin users, milestones, and diagnostics — all with demo auth cookies.

---

## License

Proprietary — Lunim Corporation.
