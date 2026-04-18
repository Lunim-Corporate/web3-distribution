---
wave: 1
depends_on: []
files_modified:
  - src/app/dashboard/admin/roster/page.tsx
  - src/app/components/dashboard/RosterTable.tsx
  - src/app/components/dashboard/AddMemberModal.tsx
autonomous: true
---

# Plan: Roster Management UI

## Goal
Build a high-fidelity roster management interface for admins to manage project contributors and their statuses.

## Tasks

<task>
<action>
Create `src/app/dashboard/admin/roster/page.tsx`.
A dedicated page for managing project members. It should fetch and display all contributors for the current active project.
</action>
<acceptance_criteria>
- Navigation to `/dashboard/admin/roster` displays a list of contributors.
- Uses the Sidebar we created in Phase 2.
</acceptance_criteria>
</task>

<task>
<action>
Create `src/app/components/dashboard/RosterTable.tsx`.
A premium table component showing:
1. Member Name & Role
2. Wallet Address (Truncated)
3. Share Percentage
4. Status Badge (Active/Inactive)
5. Action Buttons (Edit, Mark Inactive)
</action>
<acceptance_criteria>
- Table is responsive and follows the Moonstone aesthetic.
- Clicking "Mark Inactive" updates the status in Supabase.
</acceptance_criteria>
</task>

<task>
<action>
Create `src/app/components/dashboard/AddMemberModal.tsx`.
A modal for adding new members via Direct Entry (Name, Role, Wallet, Initial %).
</action>
<acceptance_criteria>
- Validates wallet address format.
- Adds row to `project_contributors` with `status='Active'`.
</acceptance_criteria>
</task>

## Verification
- Add a new member and verify they appear in the table.
- Mark a member as "Inactive" and verify they are visually greyed out or tagged differently.
