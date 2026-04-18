# STACK.md

## Languages
- **TypeScript**: Used via `tsconfig.json` for Next.js codebase. Core type-safety layer.
- **JavaScript**: Explicitly used for backend server (`server/index.js`) and Hardhat scripts.
- **Solidity**: Used for Smart Contracts development inside `contracts/`.

## Frameworks & Runtimes
- **Next.js (v14.2)**: Core web application framework operating on the App Router model (`src/app`).
- **React (v18.2)**: Frontend rendering layer.
- **Express.js (v5.2)**: Supplemental backend server located at `server/index.js`.
- **Node.js**: Underlying runtime.

## Core Dependencies
- **Styling**: `tailwindcss` (v3.3.3) for utility-first styling with `@tailwindcss/forms` plugin.
- **Animations**: `framer-motion` (v10.16.4) for layout transitions.
- **Web3 / Blockchain**: 
  - `ethers` (v6.16) for modern blockchain interactions inside Next.js components/hooks.
  - `web3` (v4.2) is present, meaning there's some dual implementation happening.
- **Hardhat**: Development environment for compiling, deploying, and testing smart contracts locally.
- **Supabase JS**: `@supabase/supabase-js` (v2.103.0) for database and user management.
- **Data Viz**: `chart.js` and `react-chartjs-2` for dashboard graphs.

## Configuration Files
- `package.json`: Main registry of node scripts driving dev servers (Next client + Express server + Hardhat node concurrently).
- `hardhat.config.js`: Configuration for EVM environments and local node logic.
- `next.config.js`: Core Next.js routing and configuration variables.
