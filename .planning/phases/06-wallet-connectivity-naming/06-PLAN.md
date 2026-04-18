---
wave: 0
depends_on: []
files_modified:
  - "src/app/hooks/useAuth.ts"
  - "src/app/hooks/useEnsResolver.ts"
  - "src/app/components/dashboard/Header.tsx"
  - "package.json"
autonomous: true
---

# Phase 06 Plan: Wallet Connectivity & Naming

This plan implements WalletConnect (Web3Modal) and ENS address resolution caching to hit the requirements WAL-01 and WAL-03.

## Prerequisites
- Create `.env.local` variable `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=60a1e0dc1ee...` (placeholder or prompt user).

## Tasks

```xml
<task id="install-web3modal">
  <title>Install Web3Modal & Setup Config</title>
  <type>execute</type>
  <read_first>
    - package.json
  </read_first>
  <action>
    Run `npm install @web3modal/ethers ethers@6`.
    Create a new file `src/app/lib/web3modal.ts`.
    In that file, initialize the `createWeb3Modal` instance referencing an ethersConfig containing mainnet and sepolia setups, and grab the projectId from `process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo'`.
  </action>
  <acceptance_criteria>
    - `package.json` contains `@web3modal/ethers`
    - `src/app/lib/web3modal.ts` exists and exports standard setup hooks.
  </acceptance_criteria>
</task>

<task id="update-auth-hook">
  <title>Transition useAuth to Web3Modal</title>
  <type>execute</type>
  <read_first>
    - src/app/hooks/useAuth.ts
  </read_first>
  <action>
    Modify `useAuth.ts`. Replace the native `window.ethereum` detection logic with `@web3modal/ethers/react` hooks: `useWeb3ModalAccount` and `useWeb3ModalProvider`.
    Map `account.address` to the returned user address and derive a generic `BrowserProvider` using the new `walletProvider`. Ensure backward logic to Supabase user login remains intact so off-chain users aren't broken.
  </action>
  <acceptance_criteria>
    - `useAuth.ts` imports from web3modal instead of checking `window.ethereum`
    - Login interactions trigger the modal correctly.
  </acceptance_criteria>
</task>

<task id="implement-ens-resolver">
  <title>Implement ENS Resolution Hook & Cache</title>
  <type>execute</type>
  <read_first>
    - src/app/hooks/useAuth.ts
  </read_first>
  <action>
    Create `src/app/hooks/useEnsResolver.ts`.
    Implement an exported React hook `useEnsName(address: string)`.
    Internally use `new ethers.JsonRpcProvider('https://cloudflare-eth.com')` to call `lookupAddress()`.
    Cache exact lookups into `sessionStorage` under `ensCache_[address]` to avoid duplicate network lookups across multi-row tables.
  </action>
  <acceptance_criteria>
    - `src/app/hooks/useEnsResolver.ts` exports `useEnsName(address)`.
    - It uses public CloudFlare provider.
    - Resolves and populates sessionStorage on successful lookup.
  </acceptance_criteria>
</task>

<task id="update-ui-components">
  <title>Hydrate UI Elements with ENS & Modal Triggers</title>
  <type>execute</type>
  <read_first>
    - src/app/components/dashboard/Header.tsx
    - src/app/components/dashboard/MyPerformanceCard.tsx
  </read_first>
  <action>
    In `Header.tsx`, find the manually coded `Connect MetaMask` button. Swap it with `<w3m-button />` or map the `open()` call from `useWeb3Modal()`.
    In header context displays and `MyPerformanceCard.tsx`, import `useEnsName` and pass the wallet `address`. Render the returning string (e.g., `vitalik.eth`) if present; fallback to standard `slice()` truncation if `null`.
  </action>
  <acceptance_criteria>
    - `Header.tsx` triggers Web3Modal.
    - `MyPerformanceCard.tsx` conditionally uses `.eth` or `0x...` truncation.
  </acceptance_criteria>
</task>
```
