---
wave: 2
depends_on:
  - 01-page-transitions.md
files_modified:
  - src/app/components/dashboard/TransactionIndicator.tsx
  - src/app/hooks/useRevenueContract.js
autonomous: true
---

# Plan: Transaction Command Center

## Goal
Create a visually stunning, persistent transaction feedback system for Web3 interactions.

## Tasks

<task>
<action>
Create `src/app/components/dashboard/TransactionIndicator.tsx`.
A glowing, glass-morphic "pill" that appears at the bottom-right of the screen during ANY on-chain transaction (Distribution, Sync, or Withdrawal).
It should show:
- Transaction Type
- Real-time status (Pulse for pending, Success icon for confirmed)
- View on Explorer link
</action>
<acceptance_criteria>
- Component is visually premium and does not block content.
</acceptance_criteria>
</task>

<task>
<action>
Connect the global indicator to the revenue hooks.
Ensure the indicator triggers automatically whenever `txStatus` becomes `pending`.
</action>
<acceptance_criteria>
- Initiating a distribution trial shows the indicator instantly.
</acceptance_criteria>
</task>

## Verification
- Trigger a "Demo" distribution and verify the command center indicator appears with a pulse animation.
- Verify it transitions to "Success" after confirmation.
