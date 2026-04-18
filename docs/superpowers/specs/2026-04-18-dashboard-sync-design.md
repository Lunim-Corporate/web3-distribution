# Design Spec - Unified Admin Dashboard & Isolated Web3 Demo

## Overview
This design unifies the project-level state across the admin dashboard and isolates the Web3 simulation (Demo) to its own dedicated section. This resolves navigation mismatches, eliminates repeated UI elements, and ensures data consistency across all views.

## Architecture

### 1. Global Project Context (`ProjectContext`)
- **Location**: `src/app/lib/projectContext.tsx`
- **Responsibility**:
    - Manage the `selectedProjectId` (UUID).
    - **Visibility**: Fetch **all projects** from Supabase for all authenticated users to provide a company-wide overview.
    - **Relationship Check**: For the selected project, check if the current user is a contributor.
    - Provide `selectedProject`, `projectsList`, and `userRoleInProject` (Admin, Contributor, or Viewer) to all consumers.

### 2. UI Re-organization & Personalization
- **Top Header (`DashboardHeader`)**:
    - Persistent across all admin and creator sub-pages.
    - Always visible **Project Selector Dropdown**.
- **The Dashboard View**:
    - **Summary Section**: Shows project-wide stats (total revenue, source breakdown).
    - **Personalized Section**: *Conditionally visible* if the user is a contributor. Shows "Your Revenue Received" and "Claim Earnings" buttons.
- **Sidebar**:
    - Links stay consistent, but the content they lead to respects the selected project.
    - Fix 404s by ensuring Sidebar links point to valid routes like `/dashboard/admin` and `/dashboard/settings`.

### 3. Isolated Web3 Demo
- **Context**: Real dashboard components (Overview, Transactions) will use live data.
- **The Demo Tab**: 
    - Houses the `RevenueDistribution` (Moonstone Web3 Splitter) component.
    - This component uses simulated balances and deterministic wallets for demonstration purposes.
    - Triggered by the global "Web3 Demo" button in the `Navbar`.

## Data Flow
1. User signs up/in and lands on the dashboard.
2. `ProjectContext` fetches all company projects.
3. User selects a project; Context checks if they are a contributor to that project.
4. Dashboard shows project-wide stats.
5. If the user is a contributor, a "My Performance" card appears with their specific earnings data.
6. "Web3 Demo" remains as a separate tab for simulation, accessible to everyone for testing.

## Routes to be Created/Fixed
- `/dashboard/admin/projects`: Redirects to or displays project management.
- `/dashboard/admin/roster`: Ensure it points to `src/app/dashboard/admin/roster/page.tsx`.
- `/dashboard/admin/settings`: Create simple settings stub to prevent 404.

## Success Criteria
- [ ] No 404s when clicking Sidebar items.
- [ ] Changing project in the header updates the "Management" and "Transactions" views instantly.
- [ ] "Web3 Demo" button navigates to the Demo tab.
- [ ] Demo content is removed from the main "Overview" tab.
