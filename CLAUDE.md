# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
- **Web3 Integration**: Ethers.js, Web3Modal, viem

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

docs/superpowers/       # Planning documents
```

### Key Design Patterns

1. **Dual Wallet Modes**: The app supports both "Live Mode" (real wallets on Ethereum Mainnet/Polygon/Base Sepolia) and "Demo Mode" (local Hardhat node for development). Use the "Web3 Demo" button to connect to local chain.

2. **Supabase Auth**: Authentication uses Supabase with wallet address as an identifier. See `src/app/lib/auth.tsx` for auth logic.

3. **Revenue Distribution Flow**:
   - Payments sent to smart contract → held in escrow
   - Admin triggers `releasePayments()` → funds distributed to rights holders per their configured shares

4. **Server-Client Communication**: Express server (`server/index.js`) handles blockchain event listening and serves as API layer. Next.js frontend calls both Express API and Supabase directly.

### Database

Supabase is used for:
- User profiles and authentication
- Project/rights holder management
- Transaction history
- Revenue distribution records

### Smart Contracts

Two main contracts in `contracts/`:
- `RevenueSplitter.sol`: Handles payment distribution to multiple recipients
- `RevenueRights.sol`: Manages rights allocation and tracking

Deploy locally with `npm run deploy:local` after starting Hardhat node.