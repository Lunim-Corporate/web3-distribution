# AGENTS.md — LUNIM

Creative rights & revenue distribution tracker on Ethereum (ERC-4337 AA) + Supabase.

## Dev Commands

| Command | What |
|---|---|
| `npm run dev` | Starts all three: Hardhat chain (8545) + Express (4000) + Next.js (3000) |
| `npm run chain` | Hardhat node only (`node --stack-size=10000`) |
| `npm run server:dev` | Express with nodemon |
| `npm run client` | Next.js dev server |
| `npm run compile` | Solidity contracts |
| `npm run deploy:local` | Deploys RevenueRights to localhost Hardhat |
| `npm run seed` | Seeds 5 projects + holders (reads `.env.local`) |
| `npm run demo:full` | `compile -> deploy:local -> seed` (full reset) |
| `npm run lint` | `next lint` |
| `npm run build` | Next.js prod build |

No test suite exists. Hardhat toolbox is installed but no test files.

## Architecture

**Three processes**, must all run for full stack:
- **Next.js 14 App Router** (`src/app/`) — frontend + read-heavy API routes on port 3000
- **Express 5** (`server/`) — write operations (transactions, holders), on-chain event listener on port 4000
- **Hardhat** — local Ethereum chain on port 8545

**Deployment**: Next.js deploys to Vercel; Express runs separately.

## Auth (Single Path — Demo Uses Mock Privy User)

**Auth is now unified**: there is only one auth path — Privy. Demo mode works by having `AuthProvider` (`auth.tsx`) create a mock admin user when `localStorage.getItem('demo_mode') === 'true'` and `privyUser` is null. No Supabase Auth session is needed for demo mode.

### How Demo Mode Works

1. User clicks **"Launch Demo Mode"** on `/login` → sets `localStorage.demo_mode=true`, writes `crt_user` cookie with mock user data, navigates to `/dashboard`
2. `middleware.ts` sees `crt_user` cookie → passes through
3. `AuthProvider` mounts, detects `demo_mode` in localStorage, creates mock `User`:
   `{ id: 'demo-admin-id', email: 'demo@lunim.io', name: 'Demo Admin', isAdmin: true, role: 'admin', isDemo: true }`
4. `apiSecurity.ts` detects `userData.isDemo === true` and returns user directly (skips DB verification)
5. Toggling demo mode in Navbar dispatches `demo-mode-changed` custom event for reactive state

### Server-Side Verification (apiSecurity.ts)

Verification chain (first match wins):

1. **Supabase SSR session** (`sb-*` httpOnly cookies) — uses `@supabase/ssr` `createServerClient` to verify session. Authenticated user's profile is fetched from `users_profile` DB.
2. **`crt_user` cookie (non-demo)** — user ID from cookie is cross-referenced against `users_profile` table. Role/identity comes from DB, not cookie.
3. **`crt_user` cookie (demo)** — `isDemo: true` flag bypasses DB verification. Acceptable because demo users access only seed data.

### Key Files

| File | Role |
|---|---|
| `auth.tsx` | Core `AuthProvider` — listens for demo mode, creates mock user |
| `apiSecurity.ts` | Server-side — Supabase SSR first, cookie fallback, demo bypass |
| `middleware.ts` | Route protection — passes through for `crt_user` cookie |
| `LoginComponent.tsx` | Has **"Launch Demo Mode"** button that sets cookie + localStorage |
| `Navbar.tsx` | Toggles `demo_mode` in localStorage, dispatches `demo-mode-changed` |

### Legacy (Can Remove)

- `DemoSetup.tsx`, `adminSetup.ts` — old Supabase Auth path for demo, no longer needed
- Express routes use `server/middleware/verifyJWT.js` (validates Supabase JWT)
- Roles: `admin`, `creator`, `contributor`, `viewer` (stored in `users_profile` table)

**Path alias**: `@/` → `src/app/` and `src/*` (tsconfig.json)

**Build notes**:
- Build passes cleanly — no TypeScript errors (ESLint warnings only, set to `"warn"` in `.eslintrc.json`)
- `.env.local` is the primary env source; copy from `.env.example`

## AB Contract

- `contracts/RevenueRights.sol` — Solidity 0.8.20, uses basis points (10000 = 100%)
- Deploy writes ABI + address to `src/contracts/RevenueRights.json`
- `server/lib/contractListener.js` listens for `RevenueDistributed` events via ethers.js

## DB

Core tables: `projects`, `rights_holders`, `transactions`, `transaction_splits`, `users_profile`, `activities`
RLS enabled on all; service role used for server-side writes.

Seeding: `HARDHAT_MNEMONIC` env var (defaults to Hardhat standard `test test... junk`). Set in `.env.local` to override wallet derivation.

### Migrations (run in order)

| File | Purpose |
|---|---|
| `001_initial.sql` | Legacy — old schema, mostly superseded |
| `001_schema.sql` | Active base schema: projects, rights_holders, transactions, transaction_splits |
| `003_align_schema.sql` | Adds `is_demo` column to transactions, align types |
| `003b_rls_fix.sql` | RLS policy fixes |
| `004_wallet_address.sql` | wallet_address column on users_profile |
| `20260512000000_privy_migration.sql` | Privy user ID migration (id type change) |
| `005_activities_table.sql` | Activities table for dashboard activity feed |

## Style

Tailwind CSS + `clsx`/`tailwind-merge`, Chart.js via react-chartjs-2, Framer Motion.
Demo mode: `localStorage.getItem('demo_mode')`.
