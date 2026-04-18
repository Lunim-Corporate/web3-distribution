# ARCHITECTURE.md

## High Level Pattern
The application follows a primarily **Serverless + Smart Contract Distributed** architecture, bridged by Next.js App Router for the main client and a supplemental Express JS server.
- The web app is built on a distributed monolith Next.js system (App Router) bridging Web2 components and Web3 integrations.
- There is a hybrid state approach where transactional financial state belongs to smart contracts (Web3 state machine) and user identity/reporting metrics belong to Supabase (Web2 database).

## Subsystems
1. **Frontend App Router (`src/app`)**: Main interaction hub. Routes exist for `dashboard`, `login`, `signup`, `admin`, `project`, and `profile`.
2. **Next.js API Routes (`src/app/api`)**: Used for data mediation. Route handles operations like fetching revenue data from Supabase DB.
3. **Smart Contracts (`contracts/`)**: Contains Solidity files managing Web3 payment splits and dynamic royalties capture.
4. **Express Node Server (`server/`)**: Existing secondary server setup; its exact boundary vs Next.js API Routes must be monitored to avoid overlapping responsibilities.

## Data Flow
- User interacts with the UI in `dashboard` -> Next.js components invoke `src/hooks/useRevenueContract.js` -> connects to local Hardhat node or injected web3 wallet (MetaMask) -> transaction processed -> results synchronized with Supabase DB / Next.js API fetched to update UI.
- UI elements heavily use `framer-motion` to handle reactive UI updates conditionally via React Context or state management.
