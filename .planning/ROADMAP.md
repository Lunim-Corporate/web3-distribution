# ROADMAP.md

## Milestone 1: Production 0xSplits Integration

### Phase 1: Infrastructure & Protocol [DONE]
**Goal:** Establish the 0xSplits integration and data layer.
- **Requirements:** W3P-01, W3P-02, W3P-03
- **Success Criteria:**
  - 0xSplits SDK initialized and communicating with local/test networks.
  - Ethers v6 provider correctly signing test transactions.
  - Subgraph queries returning dummy revenue data for dashboard rendering.

### Phase 2: Dual-Module Access [DONE]
**Goal:** Implement core Admin/Creator routing and auth.
- **Requirements:** ADM-01, CRE-01, SEC-01
- **Success Criteria:**
  - Address-based routing (Admin vs. Creator) active.
  - Unauthorized users cannot access Split modification views.
  - Empty states for new projects/creators implemented with high-fidelity design.

### Phase 3: Revenue Management [DONE]
**Goal:** Build split controls and creator withdrawal logic.
- **Requirements:** ADM-02, ADM-03, ADM-04, CRE-02, CRE-03, CRE-04
- **Success Criteria:**
  - Admin can update creator roster and percentages in the UI.
  - Changes reflected globally on the creator dashboard.
  - Creators can trigger the "Withdraw" function via MetaMask successfully.

### Phase 4: Premium Polish [DONE]
**Goal:** Final UI/UX hardening and production-grade polish.
- **Requirements:** SEC-02, SEC-03
- **Success Criteria:**
  - All transitions use framer-motion for a premium feel.
  - Transaction state feedback (pending, success, error) is clear and visually stunning.
