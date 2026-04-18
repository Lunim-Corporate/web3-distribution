# Phase 3 Context: Revenue Management

## Phase Goal
Implement roster management (Add/Remove members), split percentage adjustment logic using Mutable Splits, and the withdrawal flow for creators.

## Decisions
- **Member Status**: Use an `status` field (Active/Inactive) in `project_contributors` to handle member removal without data loss.
- **Split Type**: **Mutable Splits** (0xSplits SDK).
  - Admin wallet is the Controller of the split.
  - Updates to roster percentages trigger an on-chain transaction.
- **Withdrawal Pattern**: 
  - Creator dashboard features a "Claim Earnings" button.
  - Logic: Check `SplitMain` balance -> `withdraw` transaction (User pays gas).
- **UI Entry**:
  - Admin -> Roster Tab: Management dashboard for members.
  - Inline editing of percentages with a "Commit Changes" on-chain trigger.

## Technical Scope
- **Next.js**: Build `/dashboard/admin/roster` page.
- **0xSplits SDK**: Implement `updateSplit` and `withdraw` integrations.
- **Supabase**: Update contributor rows and statuses.

## Success Criteria
- Admin can add a member and see it reflected in the database and protocol.
- Admin can adjust percentages and trigger a successful on-chain update.
- Creator can see their "Claimable" balance and successfully withdraw funds.
- Inactive members are filtered out of active distribution logic but visible in history.
