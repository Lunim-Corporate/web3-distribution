# Creative Rights & Revenue Tracker — Project Overview

## A) Executive Summary

**What this product is**
- A Next.js 14 App Router web app that lets creative teams manage rights and revenue splits, connect wallets, and distribute payments through mock/testnet/production flows.
- Primary UI surfaces are role-based dashboards for Admins, Creators, and Contributors.

**Who it’s for**
- Creators: project owners who define revenue splits and distribute funds.
- Contributors: collaborators who receive revenue and track payout history.
- Admins: platform operators who oversee all projects, distributions, and contract interactions.

**Problem it solves**
- Centralizes rights, contributions, and revenue distributions with a clear audit trail.
- Reduces friction in split payments through smart-contract or direct wallet flows.
- Gives admins a single dashboard to manage roles, distribution mode, and platform-wide insights.

**Core features (as implemented)**
- Creator onboarding and role-based login: `src/app/login/page.tsx`, `src/app/signup/page.tsx`, `src/app/lib/auth.tsx`.
- Contributions & revenue splits: creator revenue distribution UI and admin payment splitter.
  - Creator flow: `src/app/creator/revenue/page.tsx`.
  - Admin flow: `src/app/components/dashboard/PaymentSplitter.tsx`.
- Payment distribution and split recording:
  - Distribution engine: `src/app/lib/services/RevenueDistributionService.ts`.
  - Distribution records: `src/app/api/distributions/route.ts` + SQLite `data/app.db` via `src/app/lib/db.ts`.
- Admin controls and audit logs:
  - Distribution mode and system controls: `src/app/admin/dashboard/page.tsx`.
  - Transaction history (localStorage): `src/app/lib/services/TransactionService.ts`.
  - Admin aggregate view: `src/app/api/admin/revenue/route.ts`.

---

## B) User Roles & Permissions

### Roles
- **Admin**: platform-wide access and control.
- **Creator**: owns projects, manages contributors, distributes revenue.
- **Contributor**: views assigned projects and personal payouts.

### Permissions Matrix

| Capability | Admin | Creator | Contributor | Enforcement Points |
|---|---|---|---|---|
| View Admin Dashboard | ✅ | ❌ | ❌ | `src/app/admin/layout.tsx`, `src/middleware.ts` |
| View Creator Dashboard | ✅ | ✅ | ❌ | `src/app/creator/layout.tsx`, `src/middleware.ts` |
| View Contributor Dashboard | ✅ | ❌ | ✅ | `src/app/contributor/layout.tsx`, `src/middleware.ts` |
| View All Projects | ✅ | ❌ | ❌ | `src/app/admin/projects/page.tsx` |
| View Own Projects | ✅ | ✅ | ❌ | `src/app/creator/projects/page.tsx` |
| View Contributor’s Projects | ✅ | ❌ | ✅ | `src/app/contributor/projects/page.tsx` |
| Create Projects | ✅ | ✅ | ❌ | `src/app/admin/projects/page.tsx`, `src/app/creator/projects/page.tsx` |
| Edit Project Contributors | ✅ | ✅ | ❌ | `src/app/creator/projects/page.tsx` |
| Distribute Revenue | ✅ | ✅ (creator flow) | ❌ | `src/app/creator/revenue/page.tsx`, `src/app/components/dashboard/PaymentSplitter.tsx` |
| Manage Distribution Mode | ✅ | ❌ | ❌ | `src/app/admin/dashboard/page.tsx`, `src/app/lib/services/RevenueDistributionService.ts` |
| Wallet Connect/Disconnect | ✅ | ✅ | ✅ | `src/app/lib/wallet.tsx`, role layouts |
| View Payout History | ✅ | ✅ | ✅ | `src/app/contributor/payouts/page.tsx`, `src/app/creator/payouts/page.tsx` |

### Role Enforcement (where and how)
- **Middleware RBAC**: `src/middleware.ts` uses `src/app/lib/rbac.ts` and cookie `crt_user`.
- **Server-side layout guards**:
  - Admin: `src/app/admin/layout.tsx`
  - Creator: `src/app/creator/layout.tsx`
  - Contributor: `src/app/contributor/layout.tsx`
- **Client-side guards (soft)**: role checks return `null` in layouts/pages if role mismatch.
  - Example: `src/app/components/layouts/CreatorLayout.tsx`.

### Role Storage & Sync
- **Stored locally**: `localStorage` key `crt_user` in `src/app/lib/auth.tsx`.
- **Stored in cookie**: `crt_user` cookie set via `src/app/lib/authCookieClient.ts`.
- **Sync approach**:
  - AuthProvider loads `crt_user` from localStorage and writes it back to cookie on initial load (`src/app/lib/auth.tsx`).
  - Login/Signup functions also update both localStorage and cookie.
- **No server-side user DB**: roles are not persisted in a backend database in this repo.

---

## C) End-to-End Business Flow (MOST IMPORTANT)

### High-Level Happy Path

```
[Login/Signup] -> [Role Dashboard] -> [Wallet Connect] -> [Project Setup]
        -> [Add Contributions/Splits] -> [Revenue Created]
        -> [Distribution Mode Applied] -> [Payout History]
```

### Detailed Flow

1) **User signs up / logs in**
   - Signup: `src/app/signup/page.tsx` -> `signup()` in `src/app/lib/auth.tsx`.
   - Login: `src/app/login/page.tsx` -> `login()` in `src/app/lib/auth.tsx`.
   - User stored in `localStorage` (`crt_user`) + cookie `crt_user`.

2) **Wallet connect prompt**
   - Wallet context provided by `src/app/lib/wallet.tsx` via `WalletProvider` in `src/app/layout.tsx`.
   - Connect UI appears in:
     - Creator layout: `src/app/components/layouts/CreatorLayout.tsx`
     - Admin layout: `src/app/components/layouts/AdminLayout.tsx`
     - Contributor layout: `src/app/components/layouts/ContributorLayout.tsx`
   - Specific page prompts (e.g. top up, withdraw) also call `connectWallet()`.

3) **Creator creates Project**
   - Project creation is handled via API `POST /api/projects`:
     - Route: `src/app/api/projects/route.ts`.
     - Persistence: SQLite (`data/app.db`) via `src/app/lib/db.ts`.
   - Creator’s project list is filtered by `creatorId`.

4) **Creator adds Contributions (splits)**
   - Contributor data is stored in `project_contributors` table via `/api/projects` create/update.
   - `revenueShare` percentages are validated in UI during distribution.

5) **Payments are created/split**
   - Admin: `PaymentSplitter` uses `RevenueDistributionService`.
     - `src/app/components/dashboard/PaymentSplitter.tsx`
     - `src/app/lib/services/RevenueDistributionService.ts`
   - Creator: direct distribution flow in `src/app/creator/revenue/page.tsx`.

6) **Distribution runs based on Distribution Mode**
   - Distribution mode stored in localStorage `distribution_mode` and managed by:
     - `src/app/lib/services/RevenueDistributionService.ts`
     - Admin UI: `src/app/admin/dashboard/page.tsx`
   - **Modes**:
     - Mock: simulated entries and history
     - Testnet: attempts smart contract or direct wallet transfers
     - Production: real mainnet transfers (if configured)

7) **Contributors can view payouts + history**
   - `src/app/contributor/payouts/page.tsx` and `src/app/contributor/revenue/page.tsx`
   - Distribution history is fetched from `/api/distributions`.

### Key Edge Cases (Observed in Code)

- **Missing wallet**:
  - Wallet connect is required before distribution or top-up; errors shown via `toast`.
  - `src/app/creator/revenue/page.tsx`, `src/app/creator/topup/page.tsx`.
- **Wrong network**:
  - Network mismatch is not strictly enforced; warnings are shown on chain changes via `useWallet`.
  - `src/app/lib/wallet.tsx` uses `setWarning()` on `chainChanged`.
- **Incomplete splits**:
  - Creator distribution requires splits to total 100%.
  - `src/app/creator/revenue/page.tsx` validates `totalShare === 100`.
- **Unauthorized access**:
  - Middleware redirects to `/unauthorized` or `/login`.
  - `src/middleware.ts`, `src/app/unauthorized/page.tsx`.

---

## D) System Architecture

### High-Level Architecture Diagram

```
┌──────────────────────────────────────────────────────────┐
│                     Next.js 14 UI                        │
│  Routes: /admin/* /creator/* /contributor/* /login        │
└─────────────────────────┬────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│                Client State + Service Layer              │
│  AuthContext (localStorage + cookie)                     │
│  WalletContext (MetaMask via ethers v6)                  │
│  Revenue/Contract/Payment services                       │
└─────────────────────────┬────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │                               │
          ▼                               ▼
┌───────────────────────────────┐   ┌──────────────────────────────┐
│ Next.js API Routes            │   │ Ethereum-compatible network  │
│ /api/projects, /api/topups    │   │ MetaMask + RPC URLs           │
│ /api/distributions, /api/rev  │   └──────────────────────────────┘
└───────────────┬───────────────┘
                │
                ▼
┌──────────────────────────────────────────────────────────┐
│ SQLite DB (local)                                        │
│ data/app.db — projects, contributors, topups, payouts    │
└──────────────────────────────────────────────────────────┘
```

### Frontend Pages & Layouts
- Root layout + providers: `src/app/layout.tsx`.
- Public pages: `/login` (`src/app/login/page.tsx`), `/signup` (`src/app/signup/page.tsx`), `/unauthorized`.
- Role dashboard areas:
  - Admin: `src/app/admin/*`
  - Creator: `src/app/creator/*`
  - Contributor: `src/app/contributor/*`
- Shared UI components: `src/app/components/*`.

### API Routes (Next.js App Router)
- Projects: `src/app/api/projects/route.ts`
- Revenue: `src/app/api/revenue/route.ts` (in-memory store)
- Rights: `src/app/api/rights/route.ts` (in-memory store)
- Users: `src/app/api/users/route.ts` (in-memory store)
- Milestones: `src/app/api/milestones/route.ts` (mock data)
- Distributions: `src/app/api/distributions/route.ts` (SQLite)
- Top-ups: `src/app/api/topups/route.ts` (SQLite)
- Admin revenue aggregation: `src/app/api/admin/revenue/route.ts`

### External Services (Actual in repo)
- **MetaMask / Wallet provider**: `window.ethereum` in `src/app/lib/wallet.tsx`.
- **Ethereum RPC**: configured via `src/app/lib/contracts.ts` and `NEXT_PUBLIC_*` env vars.
- **No Supabase in code**: Data is local (SQLite + in-memory + localStorage).

### State Management
- Auth state: `React Context` in `src/app/lib/auth.tsx` + localStorage + cookie.
- Wallet state: `React Context` in `src/app/lib/wallet.tsx` + sessionStorage (wallet snapshot).
- UI state: local component state (`useState`/`useEffect`).

---

## E) Codebase Map

### Important Directories
- `src/app/` — Next.js App Router pages, layouts, and components.
- `src/app/api/` — API routes for CRUD and distribution data.
- `src/app/lib/` — Auth, wallet, DB, services, utilities.
- `middleware.ts` — global route guard logic.

### Auth-Related Modules
- `src/app/lib/auth.tsx` — AuthContext, login/signup/logout, localStorage.
- `src/app/lib/authCookies.ts` — cookie parsing and validation.
- `src/app/lib/authCookieClient.ts` — client-side cookie set/clear.
- `src/app/lib/rbac.ts` — URL-based RBAC rules.
- `src/middleware.ts` — redirects based on cookie role.

### Wallet-Related Modules
- `src/app/lib/wallet.tsx` — MetaMask connection, chain listeners, sendTransaction.
- `src/app/lib/contracts.ts` — network + contract config.
- `src/app/lib/services/ContractService.ts` — smart contract calls.
- `src/app/lib/services/PaymentService.ts` — direct wallet payments.

### Distribution & Payment Modules
- `src/app/lib/services/RevenueDistributionService.ts` — mode-based distribution.
- `src/app/lib/services/TransactionService.ts` — transaction tracking history.
- `src/app/creator/revenue/page.tsx` — creator distribution flow.
- `src/app/components/dashboard/PaymentSplitter.tsx` — admin distribution flow.

---

## F) Authentication & Session

### How Login Works
- Client-only login with email or signup form.
- `login()` and `signup()` in `src/app/lib/auth.tsx`:
  - Create user object (`id`, `name`, `email`, `role`).
  - Store in `localStorage` (`crt_user`).
  - Set cookie `crt_user` via `setAuthCookie()`.

### Session Persistence
- `AuthProvider` loads `crt_user` and user settings on mount.
- `crt_user` cookie is set on load for server-side middleware and layouts.

### Cookies Used
- `crt_user` (JSON-encoded user object)
  - Set in `src/app/lib/authCookieClient.ts`.
  - Read in `src/middleware.ts` and server layouts (`src/app/*/layout.tsx`).

### Access Denied Origins
- **Redirect from middleware**:
  - `src/middleware.ts` redirects to `/login` or `/unauthorized`.
- **Server layout guard**:
  - `src/app/admin/layout.tsx`, `src/app/creator/layout.tsx`, `src/app/contributor/layout.tsx`.
- **Client page guard**:
  - Role mismatch returns `null` (e.g. `src/app/components/layouts/CreatorLayout.tsx`).

---

## G) Wallet Integration

### Where MetaMask connection is prompted
- Global layout connect buttons:
  - `src/app/components/layouts/AdminLayout.tsx`
  - `src/app/components/layouts/CreatorLayout.tsx`
  - `src/app/components/layouts/ContributorLayout.tsx`
- Specific flows:
  - Creator top-up: `src/app/creator/topup/page.tsx`
  - Creator withdraw: `src/app/creator/withdraw/page.tsx`
  - Creator revenue distribution: `src/app/creator/revenue/page.tsx`

### Detecting account, chainId, network
- `useWallet()` context in `src/app/lib/wallet.tsx`:
  - Uses `ethers.BrowserProvider`.
  - Listens for `accountsChanged`, `chainChanged`, and `disconnect`.

### Network switching
- `switchNetwork(chainId)` uses `wallet_switchEthereumChain` in `src/app/lib/wallet.tsx`.

### Disconnect & lock flows
- `disconnectWallet()` clears state and session storage.
- No server-side locking; purely client-managed session reset.

### Current Issues & Risks
- No automatic wallet rehydration on reload (sessionStorage saved but not read).
- No strict chain enforcement (only warnings). Users can distribute on wrong network.
- Smart contract address validation is minimal; missing contracts fall back to direct transfers.

---

## H) Distribution / Escrow Logic

### Distribution Modes
- **Mock Mode**
  - Simulates distribution and records mock history.
  - `src/app/lib/services/RevenueDistributionService.ts`.
- **Testnet Mode**
  - Attempts contract distribution or direct wallet payments on testnet.
- **Production Mode**
  - Executes mainnet transactions if configured.

### “No project contract address set. Sending to your wallet as escrow.”

- **Where generated**:
  - `src/app/creator/topup/page.tsx`.
- **Fallback logic**:
  - If project has no `contractAddress`, the top-up transaction is sent to the creator’s own wallet address.
- **Risks**:
  - Funds are not locked in an escrow contract; they remain under the creator’s control.
  - No on-chain audit trail that funds are dedicated to the project.
- **Safer alternative**:
  - Require a project contract address before top-up or create a managed escrow contract.

---

## I) Data Model

### Persistence Overview
- **SQLite (local)**: `data/app.db` via `src/app/lib/db.ts`.
- **In-memory stores**: rights, revenue, users, milestones via API routes.
- **LocalStorage**: auth users, distribution mode, transaction history.

### SQLite Tables (from `src/app/lib/db.ts`)

**projects**
- Fields: `id`, `name`, `type`, `status`, `description`, `total_revenue`, `pending_payments`, `creator_id`, `created_date`, `last_updated`, `contract_address`, `cover_image`, `progress`.

**project_contributors**
- Fields: `id`, `project_id`, `contributor_id`, `name`, `email`, `avatar`, `revenue_share`, `total_earned`, `role`, `wallet_address`.
- Relationship: many contributors per project.

**topups**
- Fields: `id`, `project_id`, `project_name`, `creator_user_id`, `amount`, `currency`, `chain_id`, `tx_hash`, `created_at`.

**distributions**
- Fields: `id`, `project_id`, `project_name`, `creator_user_id`, `total_amount`, `chain_id`, `tx_hash`, `created_at`.

**distribution_items**
- Fields: `id`, `distribution_id`, `project_id`, `project_name`, `contributor_user_id`, `contributor_wallet`, `amount`, `created_at`, `tx_hash`, `chain_id`.
- Relationship: distribution has many items.

### In-Memory Stores (API routes)
- **Revenue**: `src/app/api/revenue/route.ts` (array in module scope).
- **Rights**: `src/app/api/rights/route.ts` (array in module scope).
- **Users**: `src/app/api/users/route.ts` (array in module scope).
- **Milestones**: `src/app/api/milestones/route.ts` (static mock data).

### Other Client-Side Stores
- `localStorage`:
  - `crt_user`, `crt_users`, user settings `crt_settings_{id}` (`src/app/lib/auth.tsx`).
  - `distribution_mode` (`src/app/lib/services/RevenueDistributionService.ts`).
  - `distribution_history`, `web3_transactions`.
- `sessionStorage`:
  - `crt_wallet` snapshot (`src/app/lib/wallet.tsx`).

---

## J) Environment Variables & Configuration

### Referenced in Code
- `ADMIN_EMAILS` — admin access list for `/api/admin/revenue`.
  - `src/app/api/admin/revenue/route.ts`.
- `NEXT_PUBLIC_MAINNET_RPC_URL`
- `NEXT_PUBLIC_POLYGON_RPC_URL`
- `NEXT_PUBLIC_AMOY_RPC_URL`
- `NEXT_PUBLIC_MUMBAI_RPC_URL`
- `NEXT_PUBLIC_MAINNET_PROJECT_REGISTRY`
- `NEXT_PUBLIC_MAINNET_REVENUE_DISTRIBUTOR`
- `NEXT_PUBLIC_POLYGON_PROJECT_REGISTRY`
- `NEXT_PUBLIC_POLYGON_REVENUE_DISTRIBUTOR`
- `NEXT_PUBLIC_AMOY_PROJECT_REGISTRY`
- `NEXT_PUBLIC_AMOY_REVENUE_DISTRIBUTOR`
- `NEXT_PUBLIC_MUMBAI_PROJECT_REGISTRY`
- `NEXT_PUBLIC_MUMBAI_REVENUE_DISTRIBUTOR`
- `NEXT_PUBLIC_USE_SMART_CONTRACT`
- `NEXT_PUBLIC_ENABLE_BATCH_PAYMENTS`
- `NEXT_PUBLIC_ENABLE_GAS_ESTIMATION`
- `NEXT_PUBLIC_DEFAULT_NETWORK`

### Hardhat / Contract Deployment
- `MUMBAI_RPC_URL`
- `POLYGON_RPC_URL`
- `PRIVATE_KEY`
- `POLYGONSCAN_API_KEY`

### `.env.example` (snippet to include in your local env)

```bash
# Admin access
ADMIN_EMAILS="admin@risidio.com"

# Frontend (Next.js) RPC config
NEXT_PUBLIC_MAINNET_RPC_URL="https://mainnet.infura.io/v3/YOUR_KEY"
NEXT_PUBLIC_POLYGON_RPC_URL="https://polygon-rpc.com/"
NEXT_PUBLIC_AMOY_RPC_URL="https://rpc-amoy.polygon.technology/"
NEXT_PUBLIC_MUMBAI_RPC_URL="https://rpc-mumbai.maticvigil.com/"

# Frontend contract addresses
NEXT_PUBLIC_MAINNET_PROJECT_REGISTRY="0x..."
NEXT_PUBLIC_MAINNET_REVENUE_DISTRIBUTOR="0x..."
NEXT_PUBLIC_POLYGON_PROJECT_REGISTRY="0x..."
NEXT_PUBLIC_POLYGON_REVENUE_DISTRIBUTOR="0x..."
NEXT_PUBLIC_AMOY_PROJECT_REGISTRY="0x..."
NEXT_PUBLIC_AMOY_REVENUE_DISTRIBUTOR="0x..."
NEXT_PUBLIC_MUMBAI_PROJECT_REGISTRY="0x..."
NEXT_PUBLIC_MUMBAI_REVENUE_DISTRIBUTOR="0x..."

# Feature flags
NEXT_PUBLIC_USE_SMART_CONTRACT="true"
NEXT_PUBLIC_ENABLE_BATCH_PAYMENTS="true"
NEXT_PUBLIC_ENABLE_GAS_ESTIMATION="true"
NEXT_PUBLIC_DEFAULT_NETWORK="mumbai"

# Hardhat
MUMBAI_RPC_URL="https://rpc-mumbai.maticvigil.com/"
POLYGON_RPC_URL="https://polygon-rpc.com/"
PRIVATE_KEY="0xYOUR_PRIVATE_KEY"
POLYGONSCAN_API_KEY="YOUR_KEY"
```

### Deployment Assumptions
- Local development assumes SQLite on disk in `data/app.db`.
- Next.js deployment targets (e.g., Vercel) will not persist local SQLite across deploys.
- Any production environment needs persistent DB and server-side auth.

---

## K) How to Run Locally

### Prerequisites
- Node.js 18+ / npm 9+
- MetaMask browser extension

### Install
```bash
npm install
```

### Run (Development)
```bash
npm run dev
```

### Build / Start
```bash
npm run build
npm run start
```

### Common Errors & Fixes
- **Access Denied everywhere**: ensure `crt_user` cookie is set (log in via `/login`).
- **Wallet not detected**: verify MetaMask installed and unlocked.
- **DB errors**: ensure `data/` is writable; SQLite uses `data/app.db`.
- **RPC/network mismatch**: set correct RPC URLs and contract addresses in `.env.local`.

---

## L) Known Issues & Fix Plan

### Current Issues (Based on Code)
- **Access Denied loops**
  - Server layouts rely on `crt_user` cookie; if login only sets localStorage, middleware denies access on refresh.
- **Role sync drift**
  - Role changes in localStorage may not sync to server until cookie is updated.
- **Wallet prompt inconsistency**
  - Some pages prompt on action; others expect a global connection.
- **Hook conditional rendering errors**
  - Multiple pages return `null` when `!isReady` or role mismatch, which can look like a broken render and makes hook-related issues harder to trace.

### Fix Plan (priority order)

**P0 — Authentication & RBAC**
1) Move auth to server-side session (signed cookies or JWT).
2) Centralize role checks in API routes and SSR layouts.

**P1 — Wallet State**
1) Rehydrate wallet from `sessionStorage` on load.
2) Add chain enforcement rules per distribution mode.

**P2 — Distribution Reliability**
1) Require contract address for on-chain distributions.
2) Add server-side validation for split totals and wallet addresses.

**Quick Wins**
- Read `crt_wallet` from sessionStorage on load.
- Show explicit “not authorized” UI instead of returning `null`.

**Risky Areas**
- Local-only auth and cookie tampering.
- In-memory stores for revenue/rights/users (data loss on restart).

---

## M) Security & Compliance Notes

### Threat Model
- **Wallet spoofing**: `window.ethereum` can be injected or replaced.
- **Role escalation**: `crt_user` cookie is unsigned and client-controlled.
- **Tampered localStorage**: user and role data can be modified manually.

### Best Practice Recommendations
- Server-side user DB + role validation.
- Signed session tokens or JWT with rotation.
- Enforce wallet ownership via signature-based auth.
- Restrict admin-only APIs (e.g. `/api/admin/revenue`) by server-side checks.
- Least privilege: enforce RBAC on server routes, not only UI.

---

## Next Steps (Checklist)

- [ ] Add server-side authentication and session signing.
- [ ] Replace in-memory API stores with persistent DB tables.
- [ ] Add chain enforcement + wallet rehydration.
- [ ] Move split validation to backend.
- [ ] Document contract deployment + address configuration workflow.
