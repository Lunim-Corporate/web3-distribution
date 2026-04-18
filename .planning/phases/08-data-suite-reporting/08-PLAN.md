---
wave: 0
depends_on: []
files_modified:
  - "src/app/components/dashboard/RevenueAnalytics.tsx"
  - "src/app/components/dashboard/ReportGenerator.tsx"
  - "src/app/dashboard/admin/page.tsx"
  - "src/app/dashboard/creator/page.tsx"
  - "src/app/lib/reporting.ts"
autonomous: true
---

# Phase 08 Plan: Data Suite & Reporting

This phase introduces visual analytics and data export capabilities for both admins and creators.

## Prerequisites
- `chart.js` and `react-chartjs-2` are already in `package.json`.

## Tasks

```xml
<task id="reporting-utils">
  <title>Create Reporting Utilities</title>
  <type>execute</type>
  <action>
    Create `src/app/lib/reporting.ts`.

    Export functions:
    1. `exportToCsv(data: any[], filename: string)`: Converts a JSON array to CSV and triggers a browser download.
    2. `formatCurrency(val: number)`: Utility for standardizing currency display in reports.
    3. `getProjectRevenueStats(projectId: string)`: Fetches historical payment events/deposits (from Supabase or 0xSplits events proxy if available). 
       *Note: Since we are using an MVP schema, we might need to aggregate from an 'activities' table or similar.*
  </action>
  <acceptance_criteria>
    - `src/app/lib/reporting.ts` exists.
    - `exportToCsv` correctly handles escaping and headers.
  </acceptance_criteria>
</task>

<task id="revenue-analytics-component">
  <title>Build Revenue Analytics Component</title>
  <type>execute</type>
  <action>
    Create `src/app/components/dashboard/RevenueAnalytics.tsx`.

    Features:
    - Use `react-chartjs-2` to render a Line Chart showing monthly revenue.
    - Props: `{ data: any[], title: string }`.
    - Style: Dark mode optimized with semi-transparent area gradients (indigo/purple).
    - Responsive height.
    - Legend and Tooltips styled to match the premium dashboard aesthetic.
  </action>
  <acceptance_criteria>
    - `RevenueAnalytics.tsx` renders a functional chart.
    - Matches the dark glassmorphism design system.
  </acceptance_criteria>
</task>

<task id="report-generator-component">
  <title>Build Report Generator Component</title>
  <type>execute</type>
  <action>
    Create `src/app/components/dashboard/ReportGenerator.tsx`.

    Features:
    - A simple panel with "Download Tax Report (CSV)" and "Download Payout History (CSV)" buttons.
    - Date range selectors (Optional for MVP, defaults to "All Time").
    - Integration with `reporting.ts` utilities.
    - Loading states for data fetching.
  </action>
  <acceptance_criteria>
    - `ReportGenerator.tsx` triggers CSV downloads with valid data.
  </acceptance_criteria>
</task>

<task id="ui-integration">
  <title>Integrate Analytics & Reporting into Dashboards</title>
  <type>execute</type>
  <action>
    Update `src/app/dashboard/admin/page.tsx` and `src/app/dashboard/creator/page.tsx`:

    - Admin: Add a "Revenue Trends" section with the `RevenueAnalytics` component.
    - Creator: Add a "Earnings History" section with both `RevenueAnalytics` (Line chart) and `ReportGenerator`.
    - Ensure layouts remain clean (use grid or card-based layout).
  </action>
  <acceptance_criteria>
    - Admin dashboard shows revenue influx chart (ADM-06).
    - Creator dashboard shows historic tracking (CRE-07) and report downloaders (CRE-05).
  </acceptance_criteria>
</task>
```
