# Phase 2 Context: Dual-Module Access

## Phase Goal
Implement core Admin and Creator module routing, authentication-based access control, and high-fidelity dashboard layouts with isolated workspaces.

## Decisions
- **Routing Architecture**: 
  - A gateway component at `/dashboard` will detect user roles and redirect accordingly.
  - Admin module will reside at `/dashboard/admin`.
  - Creator module will reside at `/dashboard/creator`.
- **Admin Access Control**: "Admin-ness" is tied strictly to the **Supabase role**. If a user's record in the `users` table has `role: 'admin'`, they gain access to management modules.
- **Navigation Model**: The Admin module will transition from a top-tab layout to a **vertical sidebar navigation**, providing better ergonomics for managing project settings and rosters.
- **First-Run Experience**:
  - **Admin**: A "Setup Wizard" empty state that guides the user to add their first creator split.
  - **Creator**: A high-fidelity "Welcome" card explaining the 0xSplits protocol and current share status.

## Specifics
- **Security**: Middleware or Layout-level guards must prevent Creators from accessing `/dashboard/admin` sub-paths.
- **State Management**: The `useAuth` hook and existing Supabase session logic should be the source of truth for module toggling.

## Deferred Ideas
- *Wallet-Whitelist Auth*: Deferred in favor of Supabase role-based auth (ADM-01 is satisfied by Supabase session persistence).
- *Mobile-First Sidebar*: Sidebar will focus on desktop/tablet ergonomics first; mobile layout will likely use a bottom bar or hamburger menu (to be refined in Phase 4).
