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
- ✓ **Admin Module**: Centralized control panel for managing creator rosters and global project settings (v1.0 MVP).
- ✓ **Mutable Splitting (0xSplits)**: Integration of 0xSplits protocol to handle dynamic revenue share updates securely (v1.0 MVP).
- ✓ **Creator Module**: Read-only, high-transparency view for individual creators to audit their historic and pending payouts (v1.0 MVP).
- ✓ **Production Hardening**: Comprehensive audit for security errors, performance optimization, and UI polish to meet "production-grade" standards (v1.0 MVP).
- ✓ **Dashboard Sync**: Unified context provider mapping state gracefully across global isolated tabs (v1.0 MVP).

## Current Milestone: v2.0 Platform Maturation & Advanced Tooling

**Goal:** Evolve the MVP integrations into robust, production-ready enterprise tools with enhanced functionality for both Admins and Creators.

**Target features:**
- Advanced Wallet/Web3 Tooling (WalletConnect, transaction batching, ENS)
- Admin Module Pro (Multi-sig integrations, bulk CSV imports, visual analytics)
- Creator Module Automation (Exportable tax reports, push notifications)
- Dashboard Enhancements (Persistent state hydration, light/dark modes)

### Active
- [ ] WalletConnect Support
- [ ] Rich Analytics & CSV Export
- [ ] Automated push/email notifications
- [ ] Multi-sig configurations for admin splits

### Out of Scope

- [Manual Fiat Payouts] — Rationale: System is designed for trustless Web3 native routing only.
- [Social Networking Features] — Rationale: Focus is strictly on financial tracking and rights management.

## Context

v1.0 Production 0xSplits Integration shipped successfully with 5 verified phases. All 14 original requirements met, unifying the dashboard with the new global `ProjectContext` and integrating 0xSplits testnet integration.

## Constraints

- **Security**: End-to-end security is non-negotiable for financial transactions.
- **Tech Stack**: Must leverage Next.js (App Router), TypeScript, Ethers.js, and Supabase.
- **Interoperability**: Must work seamlessly with MetaMask and standard NFT marketplace royalty distributions.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 0xSplits Protocol | Industry standard for mutable payment routing; avoids custom accounting bugs. | ✓ Good |
| Dual-Module Interface | Separates management (Admin) from transparency (Creator) for better UX/Security. | ✓ Good |
| Navbar Demo Access | Keeps production dashboard clean while allowing easy "wow" moments for new users. | ✓ Good |
| Global Project Context | Avoids rigid hard-routing based on permissions; supports flexible view unification. | ✓ Good |

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
