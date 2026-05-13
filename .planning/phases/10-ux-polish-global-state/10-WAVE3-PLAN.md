# Wave 3: Visual Aesthetic Hardening (Light Mode)

Define and apply the Soft Tinted Indigo theme across the dashboard.

---
wave: 3
depends_on: ["Wave 2"]
files_modified:
  - "src/app/globals.css"
  - "src/app/dashboard/admin/page.tsx"
  - "src/app/dashboard/creator/page.tsx"
  - "src/app/components/dashboard/ChartsPanel.tsx"
  - "src/app/components/DistributeRevenuePanel.tsx"
autonomous: true
---

<tasks>
<task>
<read_first>["src/app/globals.css"]</read_first>
<action>
Implement light mode CSS variables in `:root`:
- --bg-main: #F8FAFC;
- --text-main: #0F172A;

Update `.glass-panel` to use `bg-white/70 backdrop-blur-xl border-white/40 shadow-soft` in light mode.
Ensure high-fidelity glows are softened for light backgrounds.
</action>
<acceptance_criteria>
- CSS variables for light mode and refined glass-panel styles.
</acceptance_criteria>
</task>

<task>
<read_first>["src/app/dashboard/admin/page.tsx", "src/app/dashboard/creator/page.tsx"]</read_first>
<action>
Remove local `useState` for `projectId` and `activeTab`.
Connect these components to `useUI` context.
Update hardcoded dark hexes in JSX to semantic Tailwind classes (e.g. `bg-slate-50 dark:bg-[#0B0C10]`).
</action>
<acceptance_criteria>
- Dashboard state managed by UIContext.
- Layouts look premium in Light mode.
</acceptance_criteria>
</task>

<task>
<read_first>["src/app/components/dashboard/ChartsPanel.tsx"]</read_first>
<action>
Update Chart.js/Recharts colors to be theme-aware.
Use light colors for axes and grids in Light mode.
</action>
<acceptance_criteria>
- Charts are readable and beautiful in both themes.
</acceptance_criteria>
</task>
</tasks>

# Verification Criteria
- [ ] Dashboards are beautiful in Light Mode (Soft Indigo).
- [ ] Active tabs and projects persist across theme changes.
- [ ] Charts update their color schemes automatically when theme toggles.
