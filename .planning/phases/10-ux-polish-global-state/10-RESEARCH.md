# Phase 10 Research: UX Polish & Global State

## 1. Theme Implementation (UIX-02)

### Technical Choice: `next-themes`
- **Why**: Specifically designed for Next.js, handles system preference vs user override, and suppresses the "white flash" during server-side rendering of client themes.
- **Integration**:
    - Wrap `AuthProvider` / `WalletProvider` in `RootLayout` with `<ThemeProvider attribute="class" defaultTheme="dark" enableSystem>`.
    - Add `suppressHydrationWarning` to the `html` tag in `RootLayout`.
- **Navbar Toggle**: A `ThemeToggle` component using `useTheme()` hook.

### Light Mode Aesthetic tokens
- **Background**: `bg-[#F8FAFC]` (Slate 50) with a subtle indigo mesh gradient `rgba(99, 102, 241, 0.05)`.
- **Panels**: `bg-white/70 backdrop-blur-xl border-white/40 shadow-soft`.
- **Text**: `text-slate-900` for headings, `text-slate-600` for body.
- **Accents**: Maintain `indigo-600` for buttons and primary actions for brand consistency.

## 2. Global State Persistence (UIX-01)

### Pattern: Centralized `UIProvider`
- **Location**: `src/app/context/UIContext.tsx`.
- **State Schema**:
  ```typescript
  {
    activeProjectId: string | null;
    isSidebarCollapsed: boolean;
    activeTab: string; // e.g., 'overview' | 'history' | 'reports'
  }
  ```
- **Syncing with Auth**: 
    - The `useEffect` inside `UIProvider` should listen to the `user` state from `useAuth`.
    - When `user.id` changes, reload specific keys for that user from `localStorage`.
    - Key format: `crt_ui_${userId}`.

### Hydration Strategy
- **Prevention of Flash**: Initialize state with `null` or `undefined`.
- **Branded Loader**:
    - Create a `LoadingScreen` component with an animated indigo logo and mesh gradient.
    - Show this screen while `isUIHydrated` is false.
    - This ensures that when the user hard-reloads, they don't see the "All Projects" view for 200ms before it snaps to their last active project.

## 3. Codebase Analysis Summary
- **Navbar**: Currently static role links; needs theme toggle integrated.
- **Layouts**: Dashboard layouts (Admin/Creator) should consume `isSidebarCollapsed`.
- **Auth Hook**: Already handles `settings` (notify hours), can be extended or kept adjacent to `UIContext`.

## Implementation Risk: Hydration Mismatch
- **Mitigation**: Ensure all `localStorage` reads are wrapped in `useEffect` or handled by `next-themes` inherent logic to avoid SSR errors.
