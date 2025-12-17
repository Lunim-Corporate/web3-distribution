## Repo snapshot & purpose
This repository is a Next.js (App Router) frontend + Hardhat smart-contract project for a Creative Rights & Revenue Tracker. Key pieces:
- Frontend: `src/app/*` (app router), React + TypeScript, TailwindCSS. Auth and role-routing live in `src/app/lib/auth.tsx` and `middleware.ts`.
- Service layer: `src/app/lib/services/*` (singleton services like `ContractService`, `PaymentService`, `WalletService`). Prefer using those service singletons instead of direct ethers calls from components.
- Smart contracts: `contracts/` (ProjectRegistry.sol, RevenueDistributor.sol) compiled by Hardhat; artifacts in `artifacts/` and tests in `test/`.
- Contract config / ABIs: `src/app/lib/contracts.ts` — update this file after any deploy.

## Quick commands (from `package.json`)
- Install: `npm install`
- Dev server: `npm run dev` (Next.js)
- Build: `npm run build` (Next.js build)
- Lint: `npm run lint`
- Compile contracts: `npm run compile` (Hardhat)
- Run tests: `npm run test` (Hardhat tests)
- Deploy to Mumbai: `npm run deploy:mumbai`
- Deploy locally (hardhat): `npm run deploy:local`

When you deploy contracts, `scripts/deploy.js` writes JSON files to `deployments/` and prints addresses — then update `src/app/lib/contracts.ts` with the new addresses.

## Big-picture architecture for code edits
- UI components should not call ethers.Contract directly. Instead, call service-layer methods in `src/app/lib/services/` (example: `ContractService.getInstance().distributeRevenue(...)`). This centralizes caching, gas-estimation, and error handling.
- `src/app/lib/contracts.ts` contains NETWORK_CONFIG, CONTRACT_ADDRESSES, ABIs (ProjectRegistry, RevenueDistributor). Use `getContractAddress(...)` and `getNetworkConfig(...)` helpers when writing code.
- Authentication is client-side for demo/test accounts: `src/app/lib/auth.tsx` persists users in localStorage and sets a `crt_user` cookie used by `middleware.ts` for route protection. Tests and local flows rely on these demo accounts — don't assume server-side auth unless adding an API integration.
- Role-based routing: routes under `/admin/*`, `/creator/*`, `/contributor/*` are protected by middleware and expect user roles defined by the `AuthUser.role` type in `auth.tsx`.

## Project-specific conventions & patterns
- Singleton services: service constructors follow a getInstance() pattern. Favor singletons so state (e.g., contract caching) is shared across the app.
- Feature flags & defaults: `src/app/lib/contracts.ts` exports `FEATURE_FLAGS` (e.g., `USE_SMART_CONTRACT`, `DEFAULT_NETWORK`). Respect those flags in code paths (e.g., mock vs on-chain flows).
- Contracts & ABIs live in `src/app/lib/contracts.ts` — this file is authoritative for the frontend. After compiling/deploying, update addresses here (or wire environment variables referenced by the file).
- Ethers.js v6+ idioms are used (note `ethers.formatEther` in scripts). Use v6 docs when writing blockchain code.

## Tests, debugging, and common pitfalls
- Smart contract tests live in `test/` and run via `npm run test`. Use `REPORT_GAS=true npm run test` to measure gas where helpful.
- Local flow: to debug end-to-end locally you can either
  1) run `npm run dev` and use the in-memory hardhat network via `npm run deploy:local`, or
  2) run `npx hardhat node` (or `npm run node` if you add a script) and deploy to `localhost`/`hardhat` then point `NEXT_PUBLIC_MUMBAI_RPC_URL` / contract addresses accordingly.
- After `npm run compile` and `npm run deploy:*`, check `deployments/` for JSON with addresses and timestamps.
- If UI behaves as if not logged-in, check `localStorage` (`crt_user`, `crt_users`) and the `crt_user` cookie which middleware reads.
- When updating ABIs or contract signatures: update `src/app/lib/contracts.ts` and run `npm run build` (Next.js) or restart `npm run dev` — Next's app router caches server-built modules.

## Integration points & external dependencies
- Blockchain: Hardhat + Ethers.js; networks configured in `hardhat.config.js` (mumbai, polygon, hardhat).
- Fiat: the README and `src/app/api/*` reference Stripe, Plaid, MoonPay. Credentials are environment variables (see `.env.local.example` in README). Do not commit secrets.
- Block explorer verification: `scripts/verify.js` and `npm run verify:mumbai` use etherscan/polygonscan API keys from env.

## Examples & concrete snippets to follow
- Use `getContractAddress('ProjectRegistry')` from `src/app/lib/contracts.ts` when instantiating contracts in services.
- Auth cookie example: `document.cookie = 'crt_user=...; path=/';` — middleware expects this cookie for role checks (see `middleware.ts`).
- Deployment flow: `npm run compile` → `npm run deploy:mumbai` → copy addresses from `deployments/*.json` → update `src/app/lib/contracts.ts` or set env vars referenced in that file.

## What not to do
- Avoid adding raw private keys or API keys to committed files. Use `.env.local` and the repo's env references.
- Don't bypass the service layer for on-chain interactions in UI components — this causes duplicated gas logic and scattered error handling.

If any of these points are unclear or you want more examples (e.g., a sample service method or a test to follow), tell me which area you'd like expanded and I will iterate.
