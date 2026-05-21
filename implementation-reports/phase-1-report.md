# PHASE 1 — WEB3 FOUNDATION REFACTOR

**Date:** 2026-05-18
**Status:** COMPLETE
**Next:** Phase 2 — Embedded Auth + Wallet Creation

---

## 1. Completed Tasks

- Installed `@privy-io/react-auth`, `wagmi`, `viem`, `@tanstack/react-query`
- Created `lib/blockchain.ts` — chain config (Base Sepolia / Base Mainnet)
- Created `lib/wagmi.ts` — Wagmi config with connectors
- Created `lib/web3-providers.tsx` — Combined Privy + Wagmi + QueryClient providers
- Updated `layout.tsx` — New provider hierarchy wrapping existing auth/wallet
- Removed dead dependencies: `ethers`, `web3`, `framer-motion`
- Added webpack fallback for `@react-native-async-storage/async-storage`

---

## 2. Architectural Decisions

### Provider Hierarchy
```
RootLayout
  └── Web3Providers
       ├── PrivyProvider (if PRIVY_APP_ID set)
       │    └── QueryClientProvider
       │         └── WagmiProvider
       └── AuthProvider (existing custom auth — preserved)
            └── WalletProvider (existing MetaMask — preserved for migration)
                 └── Pages
```

### Why Two-Layer Auth?
The old auth and wallet providers are preserved to allow **gradual migration**.
- Users can still use the old email/password login and MetaMask wallet
- New Privy auth will be added alongside in Phase 2
- Once all users migrate, old providers will be removed

### Chain Configuration
- Default: Base Sepolia (chain ID 84532)
- Toggle: Base Mainnet via `NEXT_PUBLIC_CHAIN_ID=8453`
- Alchemy RPC: Configured via `NEXT_PUBLIC_ALCHEMY_RPC_URL`
- Fallback: Public Base Sepolia RPC if Alchemy not configured

### Wagmi Connectors
- WalletConnect (if `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` set)
- Coinbase Wallet (always available)
- MetaMask handled automatically by injected connector through wagmi

---

## 3. Files Created

| File | Purpose |
|---|---|
| `src/app/lib/blockchain.ts` | Chain config, public client, transport |
| `src/app/lib/wagmi.ts` | Wagmi config, activeChain export |
| `src/app/lib/web3-providers.tsx` | Privy + Wagmi + QueryClient providers |

## 4. Files Modified

| File | Change |
|---|---|
| `src/app/layout.tsx` | Added Web3Providers wrapping AuthProvider |
| `package.json` | Added privy, wagmi, viem, tanstack/react-query; removed ethers, web3, framer-motion |
| `next.config.js` | Added webpack fallback for react-native modules |

---

## 5. Dependencies Added

```json
{
  "@privy-io/react-auth": "^2.0.0",
  "wagmi": "^2.0.0",
  "viem": "^2.0.0",
  "@tanstack/react-query": "^5.0.0"
}
```

## 6. Dependencies Removed

```json
{
  "ethers": "^6.15.0",      // Dead — never imported
  "web3": "^4.2.0",         // Dead — never imported
  "framer-motion": "^10.16.4" // Dead — never imported
}
```

---

## 7. Build Verification

```
npx next build → PASSED
- All 13 pages/routes compiled
- No TypeScript errors
- All routes returning HTTP 200
```

---

## 8. Migration Status

| System | Old | New | Status |
|---|---|---|---|
| Auth | AuthProvider | PrivyProvider (alongside) | DUAL MODE |
| Wallet | WalletProvider (window.ethereum) | WagmiProvider (alongside) | DUAL MODE |
| Chains | Hardcoded networks | Configurable via env | READY |
| RPC | MetaMask handled | Alchemy config | READY (needs key) |

---

## 9. Risks

- **Privy not configured**: If `NEXT_PUBLIC_PRIVY_APP_ID` is missing, PrivyProvider is skipped entirely and only WagmiProvider is used
- **WalletConnect not configured**: If project ID is missing, WalletConnect connector is skipped
- **MetaMask SDK warning**: Webpack warning about `@react-native-async-storage/async-storage` is suppressed via fallback
- **Build time Supabase warning**: Expected — no Supabase configured yet

---

## 10. Next Steps

Proceed to **Phase 2 — Embedded Auth + Wallet Creation**:
1. Add Privy auth bridge in auth.tsx
2. Update login page with Privy Google + Email OTP
3. Handle embedded wallet creation
4. Session persistence
