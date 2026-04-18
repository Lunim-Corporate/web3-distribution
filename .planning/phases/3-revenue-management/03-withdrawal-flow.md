---
wave: 3
depends_on:
  - 02-protocol-sync.md
files_modified:
  - src/app/dashboard/creator/page.tsx
  - src/app/hooks/useSplits.ts
autonomous: true
---

# Plan: Creator Withdrawal Flow

## Goal
Enable creators to claim their accumulated earnings from the protocol.

## Tasks

<task>
<read_first>
- src/app/hooks/useSplits.ts
</read_first>
<action>
Update `useSplits.ts` to include a `withdraw` method.
It should find the user's balance in `SplitMain` for the project split and execute the withdrawal transaction.
</action>
<acceptance_criteria>
- Hook returns `withdraw` function and `withdrawalStatus`.
</acceptance_criteria>
</task>

<task>
<read_first>
- src/app/dashboard/creator/page.tsx
</read_first>
<action>
Enhance the Creator Dashboard with a "Claimable Balance" display and a "Claim Earnings" button.
</action>
<acceptance_criteria>
- Displays the real-time balance waiting on the protocol.
- Button triggers the withdrawal transaction via MetaMask.
</acceptance_criteria>
</task>

## Verification
- Login as a Creator with a simulated/real balance.
- Click "Claim Earnings" and verify the transaction is initiated.
- Verify balance updates (to zero or reduced amount) after success.
