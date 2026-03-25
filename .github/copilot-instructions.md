# Creative Rights Tracker - AI Coding Agent Instructions

## Project Overview
A web3-enabled Next.js 14 dashboard for managing creative rights and revenue distribution. **Now fully integrated** with Supabase (PostgreSQL) backend, MetaMask wallet connection, smart contracts (Solidity RevenueSplitter.sol), and real-time analytics. **Purpose**: Automate payment splitting between contributors based on revenue shares with transparent tracking and optional blockchain execution.

**Status**: ✅ **FULLY FUNCTIONAL** - Build succeeds, dev server runs, all features integrated and working.

---

## Architecture & Data Flow

### Core Stack
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Database**: Supabase (PostgreSQL) with real-time subscriptions
- **Web3**: Ethers.js v6, MetaMask wallet connection, Solidity contracts (RevenueSplitter.sol)
- **Charts**: Chart.js with react-chartjs-2
- **Auth**: localStorage (client-side) + cookies + middleware-based route protection
- **Path Alias**: `@/` → `src/app/`
- **Smart Contracts**: Located in `web3-distribution/smart-contracts/` (symlinked to `smart-contracts/`)

### Key Data Entities
See [src/app/lib/types.ts](src/app/lib/types.ts):
- **Users**: `id`, `name`, `email`, `role` (`'admin'`|`'creator'`|`'contributor'`), `walletAddress`, `totalEarnings`
- **Projects**: `id`, `name`, `description`, `status` (`'Active'`|`'In Progress'`|`'Completed'`|`'Paused'`), `totalRevenue`, `contributors[]`, `contractAddress` (optional)
- **Contributors**: Nested in projects with `revenueShare` (%), `totalEarned`, `role`
- **CreativeRights**: `id`, `projectId`, `rightsType`, `owner`, `status`, `expirationDate`, `revenueShare`
- **Revenue**: `id`, `projectId`, `amount`, `date`, `source`, `contributor`
- **Milestones**: `id`, `projectId`, `title`, `date` (⚠️ NOT `target_date`), `status`

### Authentication Flow
1. User logs in via [src/app/login/page.tsx](src/app/login/page.tsx) → `useAuth().login()` stores user in localStorage as `crt_user` (JSON) + cookie
2. Middleware at [middleware.ts](middleware.ts) protects `/dashboard` and `/admin` routes based on `crt_user` cookie
3. All components use `useAuth()` hook from [src/app/lib/auth.tsx](src/app/lib/auth.tsx) to access user context
4. **Demo Logins**: Available in [src/app/components/DemoSetup.tsx](src/app/components/DemoSetup.tsx) (pre-seeded admin/creator/contributor test accounts)
5. **Wallet Integration**: `connectUserWallet()`/`disconnectUserWallet()` in auth context for MetaMask connection

### Database Layer (Supabase)
- [src/app/lib/database.ts](src/app/lib/database.ts) exports async CRUD functions: `getProjects()`, `getProjectById(id)`, `createProject()`, `addContributor()`, `getPayments()`, etc.
- **Automatic Payment Distribution**: `recordPayment()` automatically calculates and distributes revenue to contributors based on `revenue_share` percentages, updating both `payments` and `project_contributors.total_earned`
- Real-time subscriptions available via Supabase client for live updates
- Admin operations use `supabaseAdmin` from [src/app/lib/supabaseServer.ts](src/app/lib/supabaseServer.ts) (server-side with service role key)
- **Schema**: Updated via [SUPABASE_MIGRATIONS.sql](SUPABASE_MIGRATIONS.sql) - includes milestones, payments, creative_rights, activities tables
- **Analytics Views**: `project_revenue_summary` and `contributor_earnings` views for aggregated analytics
- **Important**: `milestones.date` column exists (not `target_date`) - migration ensures correct schema

### Web3 Integration (Fully Functional)
- **Wallet Provider**: [src/app/lib/wallet.tsx](src/app/lib/wallet.tsx) provides `useWallet()` hook with MetaMask EIP-1193 calls (provider from window.ethereum)
- **RevenueSplitter Service**: [src/app/lib/web3.ts](src/app/lib/web3.ts) contains `RevenueSplitterService` class for smart contract interaction
- **Smart Contract**: [smart-contracts/contracts/RevenueSplitter.sol](smart-contracts/contracts/RevenueSplitter.sol) receives payments, distributes to `payees[]` based on `shares[]` (must sum to 100)
- **UI Integration**: [src/app/components/dashboard/SmartContractPanel.tsx](src/app/components/dashboard/SmartContractPanel.tsx) connects wallet, displays balance, calls `release()` function
- **Config**: Requires `NEXT_PUBLIC_RPC_URL`, `NEXT_PUBLIC_REVENUE_SPLITTER_ADDRESS`, `NEXT_PUBLIC_CHAIN_ID` in `.env.local`

---

## Critical Developer Workflows

### Development
```bash
npm install                    # Install dependencies
npm run dev                    # Start Next.js dev server (http://localhost:3000)
npm run build                  # Production build (✅ now succeeds)
npm run lint                   # ESLint check
```

### Smart Contracts (in web3-distribution/smart-contracts/)
```bash
cd web3-distribution/smart-contracts
npm install && npx hardhat compile    # Compile Solidity → artifacts/
npx hardhat test                      # Run Solidity tests
npx hardhat run scripts/deploy.js     # Deploy RevenueSplitter to local network
```

### Database Setup
- **Migrations**: Run [SUPABASE_MIGRATIONS.sql](SUPABASE_MIGRATIONS.sql) in Supabase SQL Editor
- **Connection**: Client in [src/app/lib/supabaseClient.ts](src/app/lib/supabaseClient.ts) (public key), Admin in [src/app/lib/supabaseServer.ts](src/app/lib/supabaseServer.ts) (service role)
- **Schema**: Includes `users`, `projects`, `project_contributors`, `payments`, `creative_rights`, `milestones`, `activities` tables
- **Views**: `project_revenue_summary`, `contributor_earnings` for analytics queries

---

## Code Patterns & Conventions

### Role-Based Access Control (RBAC)
- **Check role**: `if (user?.role !== 'admin') { return; }` pattern in [src/app/components/dashboard/PaymentSplitter.tsx](src/app/components/dashboard/PaymentSplitter.tsx)
- **Roles**: `'admin'` (full access), `'creator'` (manage projects), `'contributor'` (view only)
- **Middleware Protection**: Routes `/admin/*` and `/dashboard/*` protected by [middleware.ts](middleware.ts) cookie verification

### API Routes Pattern
Located at [src/app/api/](src/app/api/):
- Structure: `export async function GET(request, { params })` and `export async function POST(request)`
- Return: `NextResponse.json(data)` or error with `{ status: 500 }`
- Server-side auth: Use `supabaseAdmin` for privileged operations
- **Example**: [src/app/api/projects/[id]/route.ts](src/app/api/projects/%5Bid%5D/route.ts) fetches project with all related data via joins

### UI Component Library
Located at [src/app/components/ui/](src/app/components/ui/):
- Files: `Button.tsx`, `Card.tsx`, `Modal.tsx`, `Input.tsx`, `Select.tsx`, `Badge.tsx`
- Pattern: `export const ComponentName: React.FC<Props> = ({ prop }) => {...}`
- Styling: Tailwind classes with `cn()` utility from [src/app/lib/utils.ts](src/app/lib/utils.ts#L4) (uses `clsx` + `tailwind-merge`)
- **Available Variants**: Button supports `primary | secondary | danger | success | ghost` variants

### Data Formatting Utilities ([src/app/lib/utils.ts](src/app/lib/utils.ts))
- `cn(...inputs)` → Tailwind class merging utility (clsx + tailwind-merge)
- `formatCurrency(amount, currency='GBP')` → "£1,234.56" (default: GBP)
- `formatPercentage(value, decimals=1)` → "45.2%"
- `formatDate(date, format='short'|'long'|'relative')` → "Jan 16, 2026" or relative
- `getStatusColor(status)` → returns badge color variant for status types
- `calculatePaymentSplit(totalAmount, contributors)` → array of split amounts per contributor
- `truncateAddress(address)` → "0x5FbD...78aB"
- `generateId()` → UUID-like string for new entity creation

### Toast Notifications
- Library: **react-hot-toast** (configured in [src/app/layout.tsx](src/app/layout.tsx))
- Usage: `import { toast } from 'react-hot-toast'` → `toast.success()`, `toast.error()`, `toast.loading()`, `toast.dismiss()`

### Theme & Persistence
- Dark/Light mode: Toggle via SidebarNav, stored in localStorage and applied via Tailwind `dark:` classes
- Persistence: Theme preference auto-restored on page reload
- Provider: Wrap theme state in custom Context (see [src/app/components/ClientLayout.tsx](src/app/components/ClientLayout.tsx) for example)

### Payment Splitting Logic
- **Calculation**: See [src/app/components/dashboard/PaymentSplitter.tsx](src/app/components/dashboard/PaymentSplitter.tsx)
- **Formula**: Split amount = (contributor.revenueShare / 100) * totalAmount
- **Storage**: Recent splits cached in localStorage as `crt_recent_splits` for offline reference
- **Web3 Integration**: Uses `revenueSplitterService.releasePayments()` for blockchain execution
- **Auto-Distribution**: Database `recordPayment()` function automatically distributes payments to contributors on payment recording

### Charts & Analytics
- **Demo Fallback**: [ChartsPanel.tsx](src/app/components/dashboard/ChartsPanel.tsx) shows demo data when no revenue exists
- **Aggregation**: Monthly bucketing by year-month key, supports 6/12 months and YTD timeframes
- **Cumulative Mode**: Toggle for cumulative vs. monthly revenue trends
- **Source Breakdown**: Doughnut chart groups top 5 sources, combines others as "Other"
- **Formatting**: All tooltips and axes use `formatCurrency()` with GBP default

### Additional Dashboard Components
- **TraditionalContractsPanel**: Manages non-blockchain contracts for projects (localStorage-backed)
- **NotifyWidget**: Displays alerts for approaching rights expiration and milestone deadlines with severity levels
- **UpcomingMilestones**: Shows timeline of project milestones with date and status tracking
- **RecentActivity**: Logs user actions and project events for audit trails

---

## Project Structure Reference

```
/src
  /app
    /api              # API routes (projects, revenue, rights, payments, milestones, users)
    /components
      /dashboard      # Dashboard-specific components (charts, payment splitter, activity log, smart contract panel)
      /ui             # Reusable UI library (Button, Card, Modal, etc.)
    /lib
      auth.tsx        # useAuth hook & AuthProvider with wallet connection methods
      database.ts     # Supabase CRUD functions with auto-distribution logic
      supabaseClient.ts   # Client-side Supabase instance
      supabaseServer.ts   # Server-side admin Supabase instance
      types.ts        # TypeScript interfaces
      utils.ts        # Formatting & utility functions
      wallet.tsx      # Web3 wallet provider (MetaMask) with useWallet hook
      web3.ts         # RevenueSplitterService for smart contract interaction
    /pages            # Next.js App Router pages (dashboard, login, admin, etc.)
/web3-distribution   # Monorepo subdirectory with smart contracts
  /smart-contracts
    /contracts        # Solidity contracts (RevenueSplitter.sol, Lock.sol)
    /test            # Hardhat tests
    /scripts         # Deploy, test release scripts
/smart-contracts     # Symlink to web3-distribution/smart-contracts
```

---

## Key Integration Points

1. **Supabase → Frontend**: `getProjects()` → components fetch & render; real-time subscriptions auto-update UI
2. **Auth → Routes**: Login sets `crt_user` cookie → middleware validates → route renders
3. **Web3 → SmartContractPanel**: MetaMask connects via `useWallet()` → ethers.js reads contract state → `release()` distributes payments
4. **Payment Splitting**: UI form collects contributors & amounts → `calculatePaymentSplit()` → display results and save to localStorage
5. **Charts**: Chart.js renders revenue data from Supabase → real-time updates via subscriptions
6. **Smart Contract**: `revenueSplitterService` handles all Web3 interactions (balance, release, payee info)
7. **Auto-Distribution**: `recordPayment()` in database.ts automatically splits payments to contributors
8. **Analytics Views**: Query `project_revenue_summary` and `contributor_earnings` for aggregated data

---

## Environment Setup
Create `.env.local` with:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

NEXT_PUBLIC_CHAIN_ID=31337                           # Local Hardhat (31337), mainnet (1), Sepolia (11155111)

# Optional
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key
```
**Note**: Currency defaults to GBP in `formatCurrency()` utility—adjust if needed for other regions.

---

## Common Tasks

| Task | Location | Pattern |
|------|----------|---------|
| Add a new data type | [src/app/lib/types.ts](src/app/lib/types.ts) | Export interface with fields |
| Create a new API endpoint | [src/app/api/](src/app/api/) | Create route.ts with GET/POST |
| Build a UI component | [src/app/components/ui/](src/app/components/ui/) | Export React.FC with `cn()` styling |
| Add a dashboard widget | [src/app/components/dashboard/](src/app/components/dashboard/) | Use existing UI components + chart/data logic |
| Query database | [src/app/lib/database.ts](src/app/lib/database.ts) | Add async function using Supabase client |
| Update theme | [src/app/components/ClientLayout.tsx](src/app/components/ClientLayout.tsx) | Extend context provider |
---

## Common Tasks

| Task | Location | Pattern |
|------|----------|---------|
| Add a new data type | [src/app/lib/types.ts](src/app/lib/types.ts) | Export interface with fields |
| Create a new API endpoint | [src/app/api/](src/app/api/) | Create route.ts with GET/POST |
| Build a UI component | [src/app/components/ui/](src/app/components/ui/) | Export React.FC with `cn()` styling |
| Add a dashboard widget | [src/app/components/dashboard/](src/app/components/dashboard/) | Use existing UI components + chart/data logic |
| Query database | [src/app/lib/database.ts](src/app/lib/database.ts) | Add async function using Supabase client |
| Update theme | [src/app/components/ClientLayout.tsx](src/app/components/ClientLayout.tsx) | Extend context provider |
| Connect wallet | [src/app/lib/auth.tsx](src/app/lib/auth.tsx) | Use `connectUserWallet()` / `disconnectUserWallet()` |
| Call smart contract | [src/app/lib/web3.ts](src/app/lib/web3.ts) | Use `revenueSplitterService` methods |
| Record payment with auto-distribution | [src/app/lib/database.ts](src/app/lib/database.ts) | Use `recordPayment()` function |
| Query analytics views | [SUPABASE_MIGRATIONS.sql](SUPABASE_MIGRATIONS.sql) | Query `project_revenue_summary` or `contributor_earnings` |

---

## Testing & Debugging

- **UI Testing**: Use DemoSetup for quick multi-user testing (pre-seeded test accounts)
- **Database**: Use Supabase Dashboard (Tables editor, SQL editor, real-time subscriptions)
- **Web3**: Use local Hardhat node (on port 8545) or Sepolia testnet
- **Logs**: Check browser console (client) and terminal (server) for errors
- **Types**: TypeScript strict mode enabled; use `npm run lint` to catch type errors
- **Build**: Run `npm run build` to verify production build succeeds (✅ currently working)

---

## Recently Fixed Issues ✅

1. ✅ **Smart Contract Integration**: RevenueSplitterService now properly handles Web3 calls
2. ✅ **Database Schema**: Milestones table now uses `date` column (not `target_date`)
3. ✅ **Build Errors**: All TypeScript errors resolved, build succeeds
4. ✅ **Dev Server**: Dev server starts successfully at http://localhost:3000
5. ✅ **Type Issues**: Fixed Button variant types and Web3 provider access
6. ✅ **Web3-Distribution**: Excluded from main build to prevent React version conflicts
7. ✅ **Charts Implementation**: ChartsPanel aggregates data by month, supports timeframes/cumulative mode, falls back to demo data
8. ✅ **Auto-Distribution**: Payment recording automatically splits revenue to contributors based on shares
9. ✅ **Analytics Views**: Database views provide aggregated revenue and earnings data

---

## Quick Start Checklist

1. ✅ Install dependencies: `npm install`
2. ✅ Update `.env.local` with Supabase credentials
3. ✅ Run database migrations in Supabase SQL Editor
4. ✅ (Optional) Set up Hardhat and deploy RevenueSplitter contract
5. ✅ Start dev server: `npm run dev`
6. ✅ Visit http://localhost:3000
7. ✅ Use demo login to test all features

