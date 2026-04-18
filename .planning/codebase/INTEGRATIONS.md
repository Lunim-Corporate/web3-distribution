# INTEGRATIONS.md

## Database & Authentication
- **Supabase**: 
  - Database provisioning and Auth service via `@supabase/supabase-js`.
  - Client connections configured to handle `users` table joins, indicating a direct relational approach bypassing traditional backend logic in many cases (used heavily in `/api/revenue/route.ts`).
  - Contains a `supabase/` root directory likely tracking migrations or schema definitions.

## Blockchain Services
- **Local Ethereum Network**: 
  - Served via `hardhat node` under the `npm run chain` command.
  - Development currently relies strictly on Hardhat's localized RPC endpoints rather than an external layer 2 like Polygon or external networks like Alchemy/Infura, although easily portable.
- **Smart Contracts**: 
  - Revenue distribution smart contracts. Code suggests interactions happen through `useRevenueContract.js` hook wrapping `ethers.js`.

## Analytics & Exporters
- **Chart.js**: Graph generation utilized natively within `RevenueSnapshot.tsx`.
- **jsPDF**: For generating user/client PDF reports on the fly during payment splitting views.
