# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

Moonstone (also branded as LUNIM) is a Web3 platform for creative rights management and automated revenue distribution. It enables transparent royalty splitting, real-time payment tracking, and smart-contract-backed financial operations for content businesses.

## Common Commands

```bash
# Development - runs all services concurrently (Hardhat node, Express server, Next.js client)
npm run dev

# Individual services
npm run chain        # Start Hardhat local node (Chain ID: 31337)
npm run server:dev  # Express server with nodemon
npm run client      # Next.js development server

# Build and deployment
npm run build              # Next.js production build
npm run start              # Start production Next.js server
npm run lint               # ESLint checking
npm run compile           # Compile Solidity contracts
npm run deploy:local       # Deploy contracts to local Hardhat node
npm run seed              # Seed database with demo data

# Full local setup
npm run demo:full          # compile + deploy:local + seed
```

## Architecture

### Stack
- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS, Framer Motion
- **Backend**: Express.js API server
- **Database & Auth**: Supabase (PostgreSQL)
- **Smart Contracts**: Solidity with Hardhat
- **Web3 Integration**: Ethers.js v6, Web3Modal v5, viem

### Directory Structure

```
src/app/                 # Next.js App Router pages and components
  ├── dashboard/         # Main dashboard (admin, creator views)
  ├── components/       # Reusable UI components
  ├── hooks/            # Custom React hooks (useSplits, useEnsResolver)
  ├── lib/              # Utilities, Supabase client, wallet logic
  └── profile/          # User profile page

server/                 # Express backend API
  ├── routes/           # API endpoints (transactions, projects)
  ├── middleware/       # Request validation
  └── lib/              # Supabase client, contract listener

contracts/              # Solidity smart contracts
  ├── RevenueSplitter.sol
  └── RevenueRights.sol

scripts/                # Deployment and seeding scripts
supabase/              # Database migrations
```

### Key Design Patterns

1. **Dual Wallet Modes**: The app supports both "Live Mode" (real wallets on Ethereum Mainnet/Polygon/Base Sepolia) and "Demo Mode" (local Hardhat node for development). Use the "Web3 Demo" button to connect to local chain.

2. **Supabase Auth**: Authentication uses Supabase with wallet address as an identifier. See `src/app/lib/auth.tsx` for auth logic.

3. **Revenue Distribution Flow**:
   - Payments sent to smart contract → held in escrow
   - Admin triggers `releasePayments()` → funds distributed to rights holders per their configured shares

4. **Server-Client Communication**: Express server (`server/index.js`) handles blockchain event listening and serves as API layer. Next.js frontend calls both Express API and Supabase directly.

5. **GSD Workflow**: Follow the GSD (Goal-Specify-Design) workflow: Discuss → Plan → Execute → Verify. Reference `.planning/` for project strategy, requirements, and roadmap.

### Database

Supabase (PostgreSQL) with tables in `supabase/migrations/001_initial.sql`:

- **projects**: id, name, description, contract_address, network, total_distributed, timestamps
- **rights_holders**: id, project_id, name, role, wallet_address, percentage, total_received, timestamps
- **transactions**: id, project_id, tx_hash, sender_address, total_amount, block_number, status, network, timestamps
- **transaction_splits**: id, transaction_id, rights_holder_id, wallet_address, name, role, percentage, amount_eth, timestamp

RLS policies allow public read, service_role full access. Triggers auto-update `updated_at` columns.

### Smart Contracts

Two main contracts in `contracts/`:
- `RevenueSplitter.sol`: Handles payment distribution to multiple recipients
- `RevenueRights.sol`: Manages rights allocation and tracking

Deploy locally with `npm run deploy:local` after starting Hardhat node.

### Configuration

- Network configuration in `src/app/lib/web3modal.ts` (Web3Modal v5)
- Supabase client in `src/app/lib/database.ts`
- Express routes in `server/routes/` for API endpoints

<claude-mem-context>
# Memory Context

# [web3-distribution] recent context, 2026-05-16 6:11am GMT+1

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision 🚨security_alert 🔐security_note
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 0 obs (0t read) | 0t work

### May 4, 2026
S2 Diagnostic health check on web3-distribution database and systematic fix for activities logging feature (May 4 at 6:34 AM)
S1 Initialize CLAUDE.md documentation and resolve 8 TypeScript compilation errors to achieve clean tsc --noEmit (May 4 at 6:34 AM)
S3 Attempt to deploy smart contracts locally; discovered Hardhat blockchain node not running (May 4 at 6:37 AM)
S4 Comprehensive system fix and local development environment setup for web3 revenue distribution platform (May 4 at 6:39 AM)
**Investigated**: Fixed 8 TypeScript errors across multiple files; ran comprehensive Supabase diagnostics on database schema, data integrity, and connection status; diagnosed activities table column mismatch; verified contract deployment integration; confirmed all three dev environment processes (Hardhat, Express, Next.js) running and communicating

**Learned**: TypeScript strictness enforcement catches runtime bugs early (role comparison case sensitivity). Activities table has actual schema (action, timestamp columns) that diverged from code expectations (activity_type, created_at), causing silent insert failures masked by query fallback pattern. Schema-as-code migrations critical for preventing drift. Smart contract deployment automatically syncs address to database enabling event listener initialization. Three-tier architecture (blockchain, backend listener, frontend) requires coordinated startup sequence but orchestrates well via npm concurrently. Database integrity across projects, transactions, holders, and splits is perfectly consistent. Financial calculations cascade correctly through system layers

**Completed**: Fixed 8 TypeScript errors (role comparisons, query selects, type annotations). Fixed activities schema mismatch across 4 API routes (/api/activities, /api/payments, /api/web3/auto-distribute, /api/web3/record-transaction) by remapping columns to actual database schema. Validated activities inserts now working end-to-end with test insert-delete cycle. Started full dev environment with all 3 processes operational (Hardhat node port 8545, Express backend port 4000 with contract listener attached, Next.js frontend port 3000). Deployed RevenueRights contract to Neon Requiem project on local Hardhat network (address 0x5FbDB2315678afecb367f032d93F642f64180aa3) with automatic database sync. Verified contract address persisted to projects table

**Next Steps**: System is fully operational. Next phase would be: (1) Test end-to-end transaction flow through contract to activity logging, (2) Deploy contracts for other 4 active projects if needed, (3) Simulate transactions to trigger event listener and verify activity feeds populate correctly, (4) Test admin dashboard and revenue reports with live contract data
</claude-mem-context>