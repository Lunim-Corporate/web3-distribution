---
phase: 6
phase_name: Wallet Connectivity & Naming
nyquist_compliant: true
wave_0_complete: false
wave_1_complete: false
---

# Phase 6 Validation

## Goal-Backward Validation (Dimension 8)
- Goal: Expand login capability and make addresses readable.
- Must have: Users can login via Web3Modal WalletConnect.
- Must have: `useAuth` hook successfully bridges Web3Modal Ethers provider state into the application.
- Must have: Split views display `.eth` names instead of hex addresses if a cached or live match exists.

## Quality Gates
- [ ] WalletConnect ID correctly reads from `.env.local`
- [ ] CSS modal scaling passes on mobile widths.
- [ ] ENS resolutions use Cloudflare cache to avoid blocking transactions.
