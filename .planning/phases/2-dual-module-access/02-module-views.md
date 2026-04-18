---
wave: 2
depends_on:
  - 01-routing-access.md
files_modified:
  - src/app/dashboard/admin/page.tsx
  - src/app/dashboard/creator/page.tsx
  - src/components/dashboard/SetupWizard.tsx
  - src/components/dashboard/WelcomeCard.tsx
autonomous: true
---

# Plan: Module Views & Empty States

## Goal
Populate the new sub-paths with their respective interfaces and implement first-run experiences.

## Tasks

<task>
<read_first>
- src/app/dashboard/page.tsx
</read_first>
<action>
Migrate existing dashboard logic to `src/app/dashboard/admin/page.tsx`.
Refactor the current multi-tab dashboard into the Admin-specific view, removing Creator-only focuses if any.
</action>
<acceptance_criteria>
- `/dashboard/admin` displays the full suite of management tools.
</acceptance_criteria>
</task>

<task>
<read_first>
- src/app/dashboard/page.tsx
</read_first>
<action>
Create `src/app/dashboard/creator/page.tsx`.
Implement a simplified, read-only version of the dashboard focusing on personal metrics (Revenue Snapshot, Personal Splitting details).
</action>
<acceptance_criteria>
- `/dashboard/creator` does NOT show Admin buttons like "Distribute" (if applicable in context of future phases).
- Primary focus is on the individual's "Your Share" metrics.
</acceptance_criteria>
</task>

<task>
<action>
Create `src/components/dashboard/SetupWizard.tsx`.
A high-fidelity empty state for admins. Use a "Step-by-step" checklist UI:
1. Connect Wallet
2. Import Project
3. Add First Creator
</action>
<acceptance_criteria>
- Displays when `projectsCount === 0`.
- Offers a clear path to get started.
</acceptance_criteria>
</task>

<task>
<action>
Create `src/components/dashboard/WelcomeCard.tsx`.
A beautiful, informative card for new creators explaining how 0xSplits works and where their revenue comes from.
</action>
<acceptance_criteria>
- Displays when a creator has logged in but has no historic payouts yet.
- Premium aesthetic with micro-animations.
</acceptance_criteria>
</task>

## Verification
- Verify that a fresh user sees the appropriate empty state.
- Verify that both Admin and Creator views are functional and consistent with the new routing.
