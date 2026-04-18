# Wave 1: Context & Persistence Architecture

Implementation of the foundational UI state management and persistence logic.

---
wave: 1
depends_on: []
files_modified:
  - "src/app/layout.tsx"
  - "src/app/context/UIContext.tsx"
  - "src/app/components/dashboard/LoadingScreen.tsx"
  - "package.json"
autonomous: true
---

<tasks>
<task>
<read_first>["package.json", "src/app/layout.tsx"]</read_first>
<action>
Install `next-themes`.
Update package.json and run npm install.
</action>
<acceptance_criteria>
- package.json contains next-themes.
- node_modules/next-themes exists.
</acceptance_criteria>
</task>

<task>
<read_first>["src/app/lib/auth.tsx"]</read_first>
<action>
Create `src/app/context/UIContext.tsx`.
Implement `UIProvider` with state persistence in `localStorage` under `crt_ui_${user.id}`.
Manage `activeProjectId`, `activeDashboardTab`, and `isSidebarCollapsed`.
Expose `isUIHydrated` to prevent flash.
</action>
<acceptance_criteria>
- UIContext.tsx implemented.
- Persistence logic tied to user.id is functional.
</acceptance_criteria>
</task>

<task>
<read_first>["src/app/layout.tsx", "src/app/context/UIContext.tsx"]</read_first>
<action>
Create `src/app/components/dashboard/LoadingScreen.tsx` with high-fidelity mesh gradient and logo.
Wrap `RootLayout` with `UIProvider`.
Conditionally render `LoadingScreen` if `!isUIHydrated`.
</action>
<acceptance_criteria>
- RootLayout uses UIProvider.
- Loading screen shows during initial hydration on refresh.
</acceptance_criteria>
</task>
</tasks>

# Verification Criteria
- [ ] Select a specific project, reload page -> project remains selected.
- [ ] Loading screen appears briefly on hard refresh.
- [ ] UI state is cleared/reset correctly on logout.
