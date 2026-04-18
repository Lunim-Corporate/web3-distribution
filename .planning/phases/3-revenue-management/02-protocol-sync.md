---
wave: 2
depends_on:
  - 01-roster-management.md
files_modified:
  - src/app/hooks/useRevenueContract.js
  - src/app/components/dashboard/SplitAdjustmentPanel.tsx
autonomous: true
---

# Plan: Mutable Split Protocol Sync

## Goal
Synchronize UI percentage adjustments with the 0xSplits protocol on-chain.

## Tasks

<task>
<read_first>
- src/app/hooks/useRevenueContract.js
</read_first>
<action>
Update `useRevenueContract.js` to support mutable split updates.
Implement an `updateRosterOnChain` function that takes the current active roster and calls the 0xSplits SDK `updateSplit` or equivalent factory method.
</action>
<acceptance_criteria>
- Function correctly formats recipient lists for the SDK.
- Handles "Pending" state in UI during the blockchain transaction.
</acceptance_criteria>
</task>

<task>
<action>
Implement "Draft Mode" for percentages.
Allow admins to tweak percentages in the UI (local state) before clicking a "Commit to Blockchain" button.
</action>
<acceptance_criteria>
- Total percentage must equal 100% (or less, depending on residue logic) before committing.
- Visual warning if the total is mismatched.
</acceptance_criteria>
</task>

<task>
<action>
Sync protocol state to Supabase.
On successful blockchain confirmation, update the `revenue_share` values in `project_contributors` to ensure database parity.
</task>

## Verification
- Adjust percentages for two members and commit.
- Verify the transaction hash is generated.
- Verify Supabase shares update after confirmation.
