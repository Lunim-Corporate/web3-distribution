---
wave: 2
depends_on:
  - 01-protocol-setup.md
files_modified:
  - src/app/api/revenue/route.ts
  - src/app/components/dashboard/RevenueSnapshot.tsx
autonomous: true
---

# Plan: Revenue Data Bridge

## Goal
Transition the existing revenue display logic to pull from the 0xSplits Subgraph, enabling real-world tracking on Sepolia.

## Tasks

<task>
<read_first>
- src/app/api/revenue/route.ts
- src/lib/web3/subgraph.ts
</read_first>
<action>
Modify `src/app/api/revenue/route.ts`.
Update the GET handler to:
1. Accept an optional `address` query parameter.
2. If `address` is provided and the environment is set to Live/Sepolia, fetch data from the `getUserEarnings` service in `src/lib/web3/subgraph.ts`.
3. Standardize the response format to match the existing UI expectations (grouping by split/recipient).
</action>
<acceptance_criteria>
- API route successfully imports `getUserEarnings`.
- Local tests (or manual verification) show the endpoint returning data from the subgraph when requested.
</acceptance_criteria>
</task>

<task>
<read_first>
- src/app/components/dashboard/RevenueSnapshot.tsx
- src/hooks/useSplits.ts
</read_first>
<action>
Update `RevenueSnapshot.tsx`.
Inject the `useSplits` hook to conditionally load real 0xSplits data when a live wallet is connected on Sepolia, while maintaining fallback/demo logic for non-connected states.
</action>
<acceptance_criteria>
- Dashboard shows a "Live" indicator when pulling from 0xSplits.
- Earnings values on the dashboard match the values returned by the SDK/Subgraph.
</acceptance_criteria>
</task>

## Verification
- Verify that navigating to the Transactions tab in the dashboard correctly triggers the Subgraph fetch when on Sepolia.
- Confirm split details are still visible and correctly formatted using the integrated data.
