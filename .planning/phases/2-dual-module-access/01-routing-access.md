---
wave: 1
depends_on: []
files_modified:
  - src/app/dashboard/page.tsx
  - src/app/dashboard/layout.tsx
  - src/app/dashboard/admin/layout.tsx
  - src/components/dashboard/Sidebar.tsx
autonomous: true
---

# Plan: Routing & Access Foundation

## Goal
Securely separate Admin and Creator workspaces using sub-paths and an intelligent redirect gateway.

## Tasks

<task>
<read_first>
- src/app/dashboard/page.tsx
- src/app/lib/auth.tsx
</read_first>
<action>
Modify `src/app/dashboard/page.tsx`.
Convert it into a "Gateway" component. It should check `user.role` from `useAuth` and immediately redirect (using `next/navigation`) to `/dashboard/admin` or `/dashboard/creator`.
</action>
<acceptance_criteria>
- Accessing `/dashboard` automatically redirects to the correct sub-path based on role.
- Loading state is shown until the user role is resolved.
</acceptance_criteria>
</task>

<task>
<read_first>
- src/app/dashboard/page.tsx
</read_first>
<action>
Create `src/app/dashboard/admin/layout.tsx` and `src/app/dashboard/creator/layout.tsx` (if needed).
Implement a layout guard that checks the user role. If a Creator tries to access `/dashboard/admin`, they should be redirected back to their own dashboard.
</action>
<acceptance_criteria>
- Unauthorized users are booted from the `/admin` workspace.
- Middleware or Layout-level logic prevents "Role bypassing".
</acceptance_criteria>
</task>

<task>
<read_first>
- src/app/components/Navbar.tsx
</read_first>
<action>
Create `src/components/dashboard/Sidebar.tsx`.
A premium, dark-themed vertical sidebar for the Admin workspace.
Include items for Overview, Project Management (Future), Roster (Future), and Settings.
</action>
<acceptance_criteria>
- `src/components/dashboard/Sidebar.tsx` exists.
- Uses Framer Motion for smooth hover/active states.
- Responsively hides or collapses on mobile.
</acceptance_criteria>
</task>

<task>
<read_first>
- src/app/dashboard/admin/layout.tsx
</read_first>
<action>
Apply the `Sidebar` to the Admin workspace.
Update `src/app/dashboard/admin/layout.tsx` to include the sidebar on the left and a content area on the right.
</action>
<acceptance_criteria>
- Admin sub-pages consistently display the vertical sidebar.
</acceptance_criteria>
</task>

## Verification
- Login as an Admin and verify redirect to `/dashboard/admin`.
- Login as a Creator and verify redirect to `/dashboard/creator`.
- Verify the sidebar is visually distinct and premium.
