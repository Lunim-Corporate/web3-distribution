---
phase: 10
phase_name: UX Polish & Global State
status: finalized
---

# Phase 10 Context: UX Polish & Global State

## Phase Goal
Harden the application's visual and mechanical reliability through global state persistence and a responsive theme switching system (Light/Dark mode).

## Decisions

### 1. Global Persistence Layer
- **Centralized Provider**: Implement a `UIProvider` (or `SettingsProvider`) that wraps the application. 
- **Persistence Scope**: The following states must be persisted in `localStorage`:
  - `activeProjectId`: Current project being viewed in Admin/Creator.
  - `isSidebarCollapsed`: Toggle state of the dashboard navigation.
  - `activeDashboardTab`: The ID of the currently active tab (e.g., 'overview', 'reports').
  - `theme`: User preference (light/dark/system).
- **User Locking**: All UI state settings are associated with the current `user.id`. Logging out must clear these settings to ensure a fresh experience for different users on the same browser.
- **Hydration Strategy**: Use a **High-Fidelity Branded Loader**.
  - During the initial read from `localStorage`, show a full-screen or component-level mesh gradient loader.
  - This prevents "UI Flickering" where defaults are shown for few milliseconds before the saved state arrives.

### 2. Immersive Theme Switching (UIX-02)
- **Engine**: Integrate `next-themes` with Tailwind's `class` dark mode strategy.
- **Toggle Placement**: A prominent Sun/Moon toggle button in the **Main Navbar** (next to User Profile).
- **Aesthetic Direction**:
  - **Dark Mode**: Preserve the existing "Moonstone" midnight/indigo glassmorphism ($#0B0C10 base).
  - **Light Mode**: Implement a **Soft Tinted Indigo** palette (e.g., `bg-slate-50` or `bg-indigo-50/30`). 
  - Glassmorphic panels in light mode should use `bg-white/70` with `backdrop-blur` and soft shadows (`shadow-soft`) instead of glowing borders.

## Specifics
- **Library**: `next-themes` is the approved library for handling theme persistence and SSR mismatches.
- **Context Integration**: The `useAuth` hook should remain the primary source for user-locking, but `useUI` will manage the transient UI states.

## Success Criteria
- [ ] Hard-reloading the page does not reset the active project selection.
- [ ] Switching between light and dark mode updates all dashboard panels instantly with high-fidelity styles.
- [ ] Initial page load in dark mode (at night) does not show a white flash.
- [ ] Sidebar state (collapsed/expanded) persists across sessions.

## Deferred Ideas
- *Cloud-Synced Settings*: Backend persistence for UI settings (ADM-XX) is deferred; `localStorage` is sufficient for v2.0.
- *Color Customization*: Advanced brand color overrides (e.g., changing indigo to emerald) is deferred to Milestone 3.
