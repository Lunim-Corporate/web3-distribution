---
wave: 0
depends_on: []
files_modified:
  - "src/app/lib/database.ts"
  - "src/app/lib/notifications.ts"
  - "src/app/api/notifications/route.ts"
  - "src/app/dashboard/admin/page.tsx"
  - "src/app/dashboard/creator/page.tsx"
autonomous: true
---

# Phase 09 Plan: Web3 Automations

This phase focuses on automated notifications for revenue events and optimizing the distribution flow with batching improvements.

## Tasks

```xml
<task id="notification-system">
  <title>Implement Notification System</title>
  <type>execute</type>
  <action>
    1. Create `src/app/lib/notifications.ts`:
       - `sendRevenueNotification(userId: string, amount: number, projectName: string)`:
         - Inserts into a new `notifications` table in Supabase.
         - Simulates an email dispatch by logging to console.
    2. Create `src/app/api/notifications/route.ts`:
       - `GET`: Fetch notifications for a specific user.
       - `PATCH`: Mark notification as read.
  </action>
  <acceptance_criteria>
    - `notifications` table structure is defined (in code/seeding).
    - `api/notifications` returns user-specific notifications.
  </acceptance_criteria>
</task>

<task id="automation-hooks">
  <title>Hook Notifications into Revenue Flow</title>
  <type>execute</type>
  <action>
    Update `src/app/lib/database.ts` -> `recordPayment` function:
    - After successfully recording a payment and updating project revenue, call `sendRevenueNotification` for every contributor in the project.
    - Ensure this is non-blocking or handled gracefully in the loop.
  </action>
  <acceptance_criteria>
    - Recording a payment successfully generates notification records for all project members.
  </acceptance_criteria>
</task>

<task id="transaction-batching">
  <title>Implement Transaction Batching UI/UX</title>
  <type>execute</type>
  <action>
    Improve the "Distribute Revenue" UI (likely in `DistributeRevenuePanel.tsx` or similar).
    - Allow selecting multiple projects to receive a proportional split of a single deposit (if using a central gateway contract) OR simply optimizing the loop to reduce redundant calls.
    *Self-Correction: Given the current RevenueRights.sol architecture, each project has its own contract. Batching across projects would require a new 'RevenueAggregator' contract. For v2.0, we will implement "Recipient Batching" - allowing the admin to queue multiple payouts and send them in one transaction using a mock 'Multisend' logic for Demo Mode and preparing the UI for a real Batcher contract.*
  </action>
  <acceptance_criteria>
    - Admin can "Batch Select" projects for distribution.
  </acceptance_criteria>
</task>

<task id="notification-ui">
  <title>Add Notifications Widget to Dashboard</title>
  <type>execute</type>
  <action>
    1. Create `src/app/components/dashboard/NotifyWidget.tsx`.
    2. Integrate it into the Main Navbar or Sidebar for both Admin and Creator.
    3. Show "Unread" count and a dropdown list of recent revenue alerts.
  </action>
  <acceptance_criteria>
    - Bell icon appears in dashboard.
    - Renders list of recent revenue deposits with project names and amounts.
  </acceptance_criteria>
</task>
```
