# Implementation Plan - Demo Refinement & Stability

This plan addresses the requirements from `DEMO_WALKTHROUGH.md`, fixes inconsistencies between the code and documentation, and ensures the project meets senior-level standards.

## 1. Requirement Review
- [x] Compile contracts (`npm run compile`)
- [x] Start Hardhat node (`npm run chain`)
- [x] Deploy contract (`npm run deploy:local`)
- [x] Seed database (`npm run seed`)
- [x] Run demo distribution CLI (`npm run demo 0.1`)
- [ ] Run frontend and verify dashboard flow

## 2. Identified Issues & Fixes
- **Inconsistency**: `CONTRACT_ADDRESS` vs `NEXT_PUBLIC_REVENUE_SPLITTER_ADDRESS`.
    - *Fix*: Update `scripts/demo_distribution.js` to prefer `NEXT_PUBLIC_REVENUE_SPLITTER_ADDRESS`.
- **Documentation Outdated**: `DEMO_WALKTHROUGH.md` has wrong holder count (37 vs 41).
    - *Fix*: Update `DEMO_WALKTHROUGH.md`.
- **Hardcoded Values**: ETH price (3200).
    - *Fix*: Standardize across the codebase.
- **Port Discrepancy**: Port 3001 in logs, but project uses 3000.
    - *Fix*: Standardize on 3000.

## 3. Proposed Changes

### Configuration & Scripts
- `scripts/deploy.js`: Sync both `NEXT_PUBLIC_REVENUE_SPLITTER_ADDRESS` and `CONTRACT_ADDRESS`.
- `scripts/demo_distribution.js`: Robust env var handling and updated logs.

### Documentation
- `DEMO_WALKTHROUGH.md`: Update counts and expected output snippets.

### Frontend
- `src/app/components/dashboard/DistributePanel.tsx`: Constant cleanup.

## 4. Execution Steps
1. Sync environment variables in `scripts/deploy.js`.
2. Refactor `scripts/demo_distribution.js`.
3. Update `DEMO_WALKTHROUGH.md`.
4. Final verification run.
