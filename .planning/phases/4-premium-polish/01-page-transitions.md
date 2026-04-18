---
wave: 1
depends_on: []
files_modified:
  - src/app/dashboard/layout.tsx
  - src/app/components/dashboard/Sidebar.tsx
autonomous: true
---

# Plan: Liquid Page Transitions

## Goal
Implement seamless page transitions across the entire dashboard to create a fluid, one-workspace feel.

## Tasks

<task>
<read_first>
- src/app/dashboard/layout.tsx
</read_first>
<action>
Wrap the dashboard content in an `AnimatePresence` and `motion.div`.
Ensure that each route change triggers a slide-up (20px) and fade-in animation.
</action>
<acceptance_criteria>
- Moving between the Admin Dashboard and the Roster page is smooth and non-abrupt.
</acceptance_criteria>
</task>

<task>
<action>
Enhance Sidebar Hover & Active states.
Add a floating background bubble that follows the cursor (or transition between active items) in the sidebar for a premium navigation feel.
</action>
<acceptance_criteria>
- Navigation feels physical and responsive.
</acceptance_criteria>
</task>

## Verification
- Click through all sidebar links and observe smooth animations.
