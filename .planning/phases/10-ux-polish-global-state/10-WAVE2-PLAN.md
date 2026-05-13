# Wave 2: Immersive Theme Engine

Integrate `next-themes` and migrate to dynamic theme switching.

---
wave: 2
depends_on: ["Wave 1"]
files_modified:
  - "src/app/layout.tsx"
  - "src/app/components/Navbar.tsx"
  - "src/app/globals.css"
  - "tailwind.config.ts"
autonomous: true
---

<tasks>
<task>
<read_first>["src/app/layout.tsx"]</read_first>
<action>
Wrap children in `RootLayout` with `<ThemeProvider attribute="class" defaultTheme="dark" enableSystem>`.
Remove hardcoded `className="dark"` from `html` and `bg-[#0B0C10]` from `body`.
Add `suppressHydrationWarning` to `html`.
</action>
<acceptance_criteria>
- ThemeProvider integrated in RootLayout.
- suppressHydrationWarning added.
</acceptance_criteria>
</task>

<task>
<read_first>["src/app/components/Navbar.tsx"]</read_first>
<action>
Create `src/app/components/ThemeToggle.tsx`.
Use Sun/Moon icons with Framer Motion animations.
Place it in the `Navbar` component next to the profile menu.
</action>
<acceptance_criteria>
- ThemeToggle component exists.
- Toggle is visible in Navbar.
- Theme changes on click (verify html.class changes).
</acceptance_criteria>
</task>
</tasks>

# Verification Criteria
- [ ] Toggle theme to light -> html class becomes "light".
- [ ] Theme selection persists in localStorage (via next-themes).
- [ ] No white flash on reload when in Dark mode.
