# Creative Rights Tracker

## What This Is

A high-fidelity, production-grade Web3 distribution platform designed for creators and project admins. It provides a trustless, transparent environment to track revenue shares and ownership rights, enabling creators to monitor their earnings in real-time through a secure MetaMask-connected dashboard.

## Core Value

Automated, secure, and transparent revenue distribution that ensures creators are paid exactly what they are owed without manual intervention.

## Requirements

### Validated

- ✓ Next.js App Router Architecture — Foundation established in `src/app`
- ✓ Supabase Data Layer — Real-time database and auth integration verified
- ✓ MetaMask Integration — Core wallet connectivity for Web3 actions
- ✓ Automated Revenue Recording — Transaction tracking and revenue snapshots
- ✓ Integrated Split Visualization — Parent/child transaction grouping with collapsible split details
- ✓ Global Demo Mode — Dedicated entry point in top navigation for guided walkthroughs

### Active

- [ ] **Admin Module**: Centralized control panel for managing creator rosters and global project settings.
- [ ] **Mutable Splitting (0xSplits)**: Integration of 0xSplits protocol to handle dynamic revenue share updates securely.
- [ ] **Creator Module**: Read-only, high-transparency view for individual creators to audit their historic and pending payouts.
- [ ] **Production Hardening**: Comprehensive audit for security errors, performance optimization, and UI polish to meet "production-grade" standards.

### Out of Scope

- [Manual Fiat Payouts] — Rationale: System is designed for trustless Web3 native routing only.
- [Social Networking Features] — Rationale: Focus is strictly on financial tracking and rights management.

## Context

The project is currently a hybrid Next.js/Express application transitioning to a more robust TypeScript-focused architecture. It utilizes Supabase for Web2 state and Hardhat for Web3 contract development. A key technical challenge is enabling Admins to modify splits dynamically without corrupting historical balance records for creators.

## Constraints

- **Security**: End-to-end security is non-negotiable for financial transactions.
- **Tech Stack**: Must leverage Next.js (App Router), TypeScript, Ethers.js, and Supabase.
- **Interoperability**: Must work seamlessly with MetaMask and standard NFT marketplace royalty distributions.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 0xSplits Protocol | Industry standard for mutable payment routing; avoids custom accounting bugs. | — Pending |
| Dual-Module Interface | Separates management (Admin) from transparency (Creator) for better UX/Security. | — Pending |
| Navbar Demo Access | Keeps production dashboard clean while allowing easy "wow" moments for new users. | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-17 after initialization*
