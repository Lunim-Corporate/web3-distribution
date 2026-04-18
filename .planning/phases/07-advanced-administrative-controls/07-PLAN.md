---
wave: 0
depends_on: []
files_modified:
  - "src/app/components/dashboard/CsvImportModal.tsx"
  - "src/app/components/dashboard/MultiSigConfig.tsx"
  - "src/app/dashboard/admin/roster/page.tsx"
  - "src/app/lib/csvParser.ts"
autonomous: true
---

# Phase 07 Plan: Advanced Administrative Controls

This plan implements bulk CSV roster imports (ADM-05) and multi-sig configuration UI (ADM-07) for split controllers.

## Prerequisites
- Phase 6 complete (wallet infrastructure available).
- Existing `AddMemberModal.tsx` pattern for single-member Supabase upserts.

## Tasks

```xml
<task id="csv-parser-util">
  <title>Create CSV Parser Utility</title>
  <type>execute</type>
  <read_first>
    - src/app/components/dashboard/AddMemberModal.tsx
    - src/app/lib/types.ts
  </read_first>
  <action>
    Create `src/app/lib/csvParser.ts`.

    Export a function `parseCsvRoster(csvText: string): { rows: CsvRow[]; errors: string[] }`.

    `CsvRow` type: `{ name: string; wallet_address: string; role: string; revenue_share: number }`.

    The parser must:
    1. Accept raw CSV text (first row = header: `name,wallet_address,role,revenue_share`).
    2. Validate each row:
       - `wallet_address` starts with `0x` and is exactly 42 chars.
       - `revenue_share` is a positive integer 0–100.
       - `name` is non-empty.
    3. Collect all validation errors with line numbers.
    4. Return both valid rows AND errors so the UI can show inline feedback.
    5. Also export `generateCsvTemplate(): string` that returns a downloadable CSV header with 2 example rows.
  </action>
  <acceptance_criteria>
    - `src/app/lib/csvParser.ts` exports `parseCsvRoster` and `generateCsvTemplate`
    - `parseCsvRoster` returns `{ rows, errors }` object
    - Wallet addresses that don't match `0x` + 40 hex chars produce errors
    - `generateCsvTemplate()` returns a string starting with `name,wallet_address,role,revenue_share`
  </acceptance_criteria>
</task>

<task id="csv-import-modal">
  <title>Build CSV Import Modal Component</title>
  <type>execute</type>
  <read_first>
    - src/app/components/dashboard/AddMemberModal.tsx
    - src/app/lib/csvParser.ts
    - src/app/lib/supabaseClient.ts
  </read_first>
  <action>
    Create `src/app/components/dashboard/CsvImportModal.tsx`.

    Props: `{ projectId: string | null; onClose: () => void; onSuccess: () => void }`.

    The modal must:
    1. Provide a "Download Template" button that triggers a `.csv` file download using `generateCsvTemplate()`.
    2. Accept file upload via drag-and-drop zone OR file input (`.csv` only).
    3. On file selection, call `parseCsvRoster()`. Show:
       - A preview table of valid rows (name, wallet, role, share).
       - An error list for invalid rows (red text, line numbers).
       - A summary bar: "X valid rows, Y errors. Total share: Z%".
    4. "Import All" button (disabled if errors > 0 or total share > 100):
       - For each valid row, upsert user by wallet_address (same logic as AddMemberModal).
       - Insert into `project_contributors`.
       - Show toast per-row success/failure.
    5. Use the same dark glassmorphism styling as AddMemberModal.
    6. Animate with framer-motion (same entrance/exit as AddMemberModal).
  </action>
  <acceptance_criteria>
    - `src/app/components/dashboard/CsvImportModal.tsx` exists
    - It imports `parseCsvRoster` and `generateCsvTemplate` from `@/lib/csvParser`
    - It renders a drag-and-drop upload zone
    - It shows a preview table of parsed rows
    - The "Import All" button inserts rows into Supabase
  </acceptance_criteria>
</task>

<task id="multisig-config-panel">
  <title>Build Multi-Sig Configuration Panel</title>
  <type>execute</type>
  <read_first>
    - src/app/components/dashboard/SmartContractPanel.tsx
    - src/app/components/dashboard/RosterTable.tsx
  </read_first>
  <action>
    Create `src/app/components/dashboard/MultiSigConfig.tsx`.

    This is a collapsible panel that sits below the RosterTable on the admin roster page.

    Features:
    1. **Toggle switch** — "Require multi-sig for split changes" (stored in project settings via Supabase `projects` table `settings` JSONB column).
    2. **Signer list** — When enabled, show a list of authorized signer addresses (pulled from project settings).
    3. **Add signer** — Input field to add a new signer address (validated as 0x + 40 hex).
    4. **Threshold selector** — "Require N of M signers" dropdown (e.g., 2 of 3).
    5. **Save Configuration** button — Persists the multi-sig config to the project's `settings` JSONB column in Supabase.
    6. **Visual indicator** — When multi-sig is active, show a shield icon badge on the roster page header.

    This is a UI/database-only feature for v2.0. Actual on-chain multi-sig enforcement is deferred to v3.0.
    Add a subtle info banner: "Multi-sig consensus is configured for off-chain tracking. On-chain enforcement coming in v3.0."
  </action>
  <acceptance_criteria>
    - `src/app/components/dashboard/MultiSigConfig.tsx` exists
    - It renders a toggle switch for multi-sig mode
    - It shows an address input for adding signers
    - It has a threshold selector (N of M)
    - It persists config to Supabase `projects.settings` JSONB
    - It displays a "v3.0" info banner about on-chain enforcement
  </acceptance_criteria>
</task>

<task id="integrate-roster-page">
  <title>Integrate CSV Import & Multi-Sig into Roster Page</title>
  <type>execute</type>
  <read_first>
    - src/app/dashboard/admin/roster/page.tsx
    - src/app/components/dashboard/CsvImportModal.tsx
    - src/app/components/dashboard/MultiSigConfig.tsx
  </read_first>
  <action>
    Update `src/app/dashboard/admin/roster/page.tsx`:

    1. Add an "Import CSV" button next to the existing "Add Member" button in the roster header. Style it with a spreadsheet icon and the same gradient border treatment.
    2. Wire it to open `CsvImportModal` (same AnimatePresence pattern as AddMemberModal).
    3. Below the RosterTable, render `MultiSigConfig` in a collapsible section with a "Security Settings" header.
    4. When multi-sig is active (from project settings), add a small shield badge next to the page title.
  </action>
  <acceptance_criteria>
    - Roster page has both "Add Member" and "Import CSV" buttons
    - Clicking "Import CSV" opens the CsvImportModal
    - MultiSigConfig renders below RosterTable
    - Shield badge appears when multi-sig is enabled
  </acceptance_criteria>
</task>
```
