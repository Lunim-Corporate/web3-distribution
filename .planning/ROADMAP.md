# Roadmap: Creative Rights Tracker

## Milestones

- ✅ **v1.0 Production 0xSplits Integration** — Phases 1-5 (shipped 2026-04-18)
- ✅ **v2.0 Platform Maturation & Advanced Tooling** — Phases 6-10 (shipped 2026-04-18)

## Phases

<details>
<summary>✅ v1.0 Production 0xSplits Integration (Phases 1-5) — SHIPPED 2026-04-18</summary>

- [x] Phase 1: Infrastructure & Protocol [DONE]
- [x] Phase 2: Dual-Module Access [DONE]
- [x] Phase 3: Revenue Management [DONE]
- [x] Phase 4: Premium Polish [DONE]
- [x] Phase 5: Dashboard Sync [DONE]

</details>

<details>
<summary>✅ v2.0 Platform Maturation & Advanced Tooling (Phases 6-10) — SHIPPED 2026-04-18</summary>

- [x] Phase 6: Wallet Connectivity & Naming [DONE]
- [x] Phase 7: Advanced Administrative Controls [DONE]
- [x] Phase 8: Data Suite & Reporting [DONE]
- [x] Phase 9: Web3 Automations [DONE]
- [x] Phase 10: UX Polish & Global State [DONE]

</details>

## Progress

| Phase             | Milestone | Plans Complete | Status      | Completed  |
| ----------------- | --------- | -------------- | ----------- | ---------- |
| 1. Infrastructure     | v1.0      | 1/1            | Complete    | 2026-04-18 |
| 2. Dual-Module Access | v1.0      | 1/1            | Complete    | 2026-04-18 |
| 3. Revenue Management | v1.0      | 1/1            | Complete    | 2026-04-18 |
| 4. Premium Polish     | v1.0      | 1/1            | Complete    | 2026-04-18 |
| 5. Dashboard Sync     | v1.0      | 1/1            | Complete    | 2026-04-18 |
| 6. Wallet Connect     | v2.0      | 1/1            | Complete    | 2026-04-18 |
| 7. Admin Controls     | v2.0      | 1/1            | Complete    | 2026-04-18 |
| 8. Data & Reporting   | v2.0      | 1/1            | Complete    | 2026-04-18 |
| 9. Web3 Automations   | v2.0      | 1/1            | Complete    | 2026-04-18 |
| 10. UX Polish         | v2.0      | 1/1            | Complete    | 2026-04-18 |

## Phase Details

### Phase 6: Wallet Connectivity & Naming
**Goal:** Expand login capability and make addresses readable.
- **Requirements:** WAL-01, WAL-03
- **Success Criteria:**
  - Users can select WalletConnect to log in via mobile wallets.
  - Known .eth addresses automatically resolve across the dashboard instead of truncated hexes.

### Phase 7: Advanced Administrative Controls
**Goal:** Optimize the admin process for scaling projects.
- **Requirements:** ADM-05, ADM-07
- **Success Criteria:**
  - Admin can upload a formatted CSV to import 5+ creators at once to a split.
  - Split controllers can optionally be instantiated as a logic layer enforcing multi-sig consensus.

### Phase 8: Data Suite & Reporting
**Goal:** Empower users with historical visibility.
- **Requirements:** ADM-06, CRE-05, CRE-07
- **Success Criteria:**
  - Rich visual graph renders project revenue over the trailing 12 months.
  - Creators can export a `.csv` itemizing their exact withdrawal history.

### Phase 9: Web3 Automations
**Goal:** Reduce distribution friction and notify users.
- **Requirements:** WAL-02, CRE-06
- **Success Criteria:**
  - On-chain action batches multiple split disbursements into a single gas fee.
  - Opt-in service alerts users off-chain (email) when their balances change.

### Phase 10: UX Polish & Global State
**Goal:** Seal the final application mechanics for universal reliability.
- **Requirements:** UIX-01, UIX-02
- **Success Criteria:**
  - Dashboard toggles between Dark/Light smoothly natively and on user override.
  - State contexts persist flawlessly on hard reloads using Web Storage APIs.
