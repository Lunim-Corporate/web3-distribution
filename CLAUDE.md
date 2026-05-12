# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LUNIM is a creative rights and revenue distribution tracker for the entertainment industry. It manages revenue splits for media projects (films, music, etc.) using Ethereum smart contracts and a Supabase-backed dashboard. Think: royalty tracking with on-chain settlement.

## Development Commands

```bash
# Full dev environment (Hardhat chain + Express server + Next.js client)
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
npm run demo:full      # compile + deploy + seed + seed:users (full reset)

# Build & lint
npm run build          # Next.js production build
npm run lint           # ESLint (next lint)
```

No test suite is configured yet. Hardhat toolbox (chai/mocha) is installed for contract tests but no test files exist.

## Architecture

### Three-Process Stack

1. **Next.js 14 App Router** (`src/app/`) — Frontend + API routes. Port 3000.
2. **Express 5 API** (`server/`) — Backend for DB mutations, JWT-protected routes. Port 4000.
3. **Hardhat Node** — Local Ethereum chain. Port 8545.

The Next.js API routes (`src/app/api/`) handle read-heavy dashboard queries and auth flows. The Express server handles write operations (transactions, holder management) and listens to on-chain events.

### Auth Flow

- Supabase Auth handles signup/login with optional 2FA
- `src/app/lib/auth.tsx` — `AuthProvider` context wraps the app, exposes `useAuth()` hook
- User profile stored in `users_profile` table, merged with Supabase auth metadata
- `middleware.ts` — Route protection for `/dashboard` and `/admin` using `crt_user` cookie + Supabase auth tokens
- Express routes protected by `server/middleware/verifyJWT.js` (validates Supabase JWT)
- Roles: `admin`, `creator`, `contributor`, `viewer`

### Database (Supabase)

Core tables (see `supabase/migrations/001_schema.sql`):
- `projects` — Media projects with contract_address, status, total_distributed
- `rights_holders` — Per-project holders with wallet_address, percentage (basis points in contract, decimal in DB)
- `transactions` — On-chain revenue distributions with tx_hash, status
- `transaction_splits` — Per-holder split amounts for each transaction
- `users_profile` — App users (distinct from rights_holders)

RLS enabled on all tables. Service role used for server-side writes.

### Smart Contracts

- `contracts/RevenueRights.sol` — Solidity 0.8.20. Holds holder addresses/names/roles/basis points, emits `RevenueDistributed` events, handles `distributeRevenue()` payable function.
- `contracts/RevenueSplitter.sol` — Secondary contract.
- Deploy writes ABI + address to `src/contracts/RevenueRights.json` and updates `.env.local` with `CONTRACT_ADDRESS`.
- `server/lib/contractListener.js` — Listens for `RevenueDistributed` events via ethers.js `JsonRpcProvider` and syncs to Supabase.

### Key Path Aliases

`@/` maps to `src/app/` (configured in tsconfig.json). So `@/lib/supabaseClient` resolves to `src/app/lib/supabaseClient.ts`.

### Frontend Patterns

- Single-page dashboard at `src/app/dashboard/page.tsx` — large file with tabbed UI (overview, team, transactions, reports, distribute, contracts)
- Supabase realtime subscriptions for live transaction updates
- `BroadcastChannel` for cross-tab payment sync
- Demo mode toggle via `localStorage.getItem('demo_mode')`
- Styling: Tailwind CSS + `clsx`/`tailwind-merge` for conditional classes
- Charts: Chart.js via react-chartjs-2
- Animations: Framer Motion

### Environment Variables

Copy `.env.template` to `.env.local`. Required:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase project credentials
- `SUPABASE_SERVICE_ROLE_KEY` — Server-side Supabase admin access
- `CONTRACT_ADDRESS` — Auto-set by deploy script
- `HARDHAT_RPC_URL` — Default `http://127.0.0.1:8545`

### Express Server Route Map

All under `/api/` prefix:
- `/auth` — Login, signup, invite (rate-limited, no JWT)
- `/projects` — CRUD for projects (JWT required)
- `/transactions` — Revenue distribution records (JWT required)
- `/holders` — Rights holder management (JWT required)
- `/analytics` — Dashboard analytics (own auth per route)
- `/settings` — User settings (own auth per route)
- `/invites` — Team invitations (own auth per route)

### Build Notes

- `next.config.js` has `ignoreBuildErrors: true` for both TypeScript and ESLint — the codebase has known type issues
- Hardhat commands use `node --stack-size=10000` to avoid stack overflow
- Deployed to Vercel (see `vercel.json`) — the Express server runs separately
