# CONCERNS.md

## Technical Debt
- **Mixed File Types**: A prominent transitional debt where `.js` and `.ts` co-mingle across identical component directories. The `src/` directory requires structured consolidation towards rigid `.ts/.tsx` configurations.
- **Dual Server Layers**: Both Next.js API Routes and a standalone Express.js server exist concurrently. Unless intentionally mapped into distinct microservices, their duplicated responsibility surfaces technical drift vulnerabilities over identical tasks.
- **Redundant Components**: Components like `TransactionHistory.jsx` have been visually deprecated in favor of `RevenueSnapshot.tsx`, yet still remain floating in the `src/components` tree causing cognitive overhead for new developers.

## Web3 Concerns
- Mutable architecture plans involving updating historic balances and share percentages will require stringent audit oversight before hitting the mainnet Ethereum branch. Re-evaluating 0xSplits SDK vs custom OpenZeppelin splitters must proceed with security precision.

## Performance/Fragile areas
- Client side dependency on large UI libraries (Chart.js + Framer Motion + Web3 dependencies) combined with real-time UI state refreshes via local React components might struggle under heavy Web3 callback loops.
