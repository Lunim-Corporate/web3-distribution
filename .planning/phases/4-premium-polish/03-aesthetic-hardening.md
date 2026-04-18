---
wave: 3
depends_on:
  - 02-transaction-indicator.md
files_modified:
  - src/app/globals.css
  - src/app/dashboard/admin/page.tsx
  - src/app/dashboard/creator/page.tsx
autonomous: true
---

# Plan: Aesthetic Hardening

## Goal
Final visual sweep of colors, gradients, and component densities.

## Tasks

<task>
<action>
Update `src/app/globals.css`.
Add a custom background mesh gradient (Deep Blue -> Deep Purple -> Black) to the dashboard body.
Refine glassmorphism utility classes.
</action>
<acceptance_criteria>
- Background has subtle, slow-moving glows.
</acceptance_criteria>
</task>

<task>
<action>
Staggered entry for main dashboard components.
Apply `variants` to the Charts, Activity, and Snapshot components so they pop in one-by-one with a bounce effect.
</action>
<acceptance_criteria>
- Initial dashboard load feels like "opening a dashboard" rather than just a static render.
</acceptance_criteria>
</task>

## Verification
- Refresh the page and observe the staggered component entry.
- Verify global contrast and readability in the new mesh background.
