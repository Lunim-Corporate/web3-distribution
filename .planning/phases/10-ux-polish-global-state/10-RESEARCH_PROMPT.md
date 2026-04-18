<objective>
Research how to implement Phase 10: UX Polish & Global State.
Answer: "What do I need to know to PLAN this phase well?"
Focus on:
1. next-themes integration: How to migrate from the hardcoded 'dark' class in RootLayout to a dynamic theme provider without causing a white flash on initial load.
2. Global Persistence Pattern: How to structure the UIProvider to handle localStorage persistence for activeProjectId, sidebar state, and tabs, ensuring it syncs with the AuthProvider session.
3. Light Mode Aesthetic: Map out specific color tokens for a "Soft Tinted Indigo" palette that preserves the premium Moonstone feel.
</objective>

<files_to_read>
- .planning/phases/10-ux-polish-global-state/10-CONTEXT.md (USER DECISIONS)
- .planning/REQUIREMENTS.md (Project requirements)
- .planning/STATE.md (Project decisions and history)
- src/app/layout.tsx (Root layout with current theme class)
- src/app/lib/auth.tsx (Existing auth logic to sync settings)
- tailwind.config.ts (Theme configuration)
</files_to_read>

<additional_context>
**Phase description:** Seal the final application mechanics for universal reliability.
**Phase requirement IDs (MUST address):** UIX-01, UIX-02
**Project instructions:** Read ./GEMINI.md if exists — follow project-specific guidelines
</additional_context>

<output>
Write to: .planning/phases/10-ux-polish-global-state/10-RESEARCH.md
</output>
