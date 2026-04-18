# STRUCTURE.md

## Directory Layout
- **Root Level Scripts / Configs**:
  - `hardhat.config.js`: Controls Ethereum compilation and testing environments.
  - `scripts/`: Houses deployment (`deploy.js`) and database seed scripts (`seed.js`).
  - `server/`: Contains traditional Express.js app.
- **Web App Core (`src/`)**:
  - `src/app/`: Next.js App Router. Includes page directories for distinct modules (e.g., `admin/`, `dashboard/`, `profile/`, `project/`).
  - `src/app/components/`: Sub-components explicitly bound to specific app router boundaries (e.g., `dashboard/RevenueSnapshot.tsx`).
  - `src/hooks/`: Reusable React Hooks for abstracting logic (e.g., `useRevenueContract.js`).
  - `src/app/api/`: Edge and Serverless functions interacting with databases.
  - `src/components/`: Global components. (Contains legacy fragments like `TransactionHistory.jsx` that need deprecation supervision).
- **Contracts Environment (`contracts/`)**: Solidity smart contracts controlling business distribution.

## Key Boundaries
- `page.tsx` vs `layout.tsx`: `layout.tsx` owns the global Navbar housing the newly built Web3 Demo custom event listener dispatch logic that changes active views nested cleanly inside child `page.tsx` state. 

## Code Naming Conventions
- React components consistently use PascalCase (`RevenueSnapshot.tsx`, `Navbar.tsx`).
- Utility hooks and logical implementations use camelCase.
- Mixed `.js, .jsx, .ts, .tsx` extensions indicate a progressive migration to TypeScript.
