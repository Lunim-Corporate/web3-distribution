# Phase 06 Research: Wallet Connectivity & Naming

## Goal
Expand login capability and make addresses readable by supporting WalletConnect (for mobile/multi-wallet login) and ENS resolution across the dashboard.

## 1. WalletConnect Integration (WAL-01)
### Current State
- The system currently uses direct injection via `window.ethereum` to connect to MetaMask.
- Ethers.js v6 provider is derived directly from this injected wallet.

### Approaches
1. **Web3Modal (AppKit by Reown)**
   - **Pros:** Specifically has a dedicated adapter for `ethers v6` avoiding the need to migrate the entire app to `viem` & `wagmi`. Provides a beautiful drop-in Modal.
   - **Cons:** Requires a Project ID from WalletConnect. Adds additional UI components to the bundle.
2. **Thirdweb / RainbowKit**
   - **Pros:** Elegant, popular.
   - **Cons:** Tightly coupled with Wagmi (viem), which requires refactoring our Ethers v6 hooks.

#### Recommendation
Adopt **Web3Modal with Ethers v6**. We will need a placeholder `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`. The existing `AuthContext` or `useAuth` hook will be transitioned to use the Web3Modal hooks (`useWeb3ModalAccount`, `useWeb3ModalProvider`) to hydrate `ethers.BrowserProvider`.

## 2. ENS Resolution (WAL-03)
### Mechanism
- User addresses are standard Ethereum hex addresses.
- To resolve them, we need an `ethers.Provider` pointed to Ethereum mainnet (even if the main app is on testnet for 0xSplits validation, ENS only resolves on Mainnet or Sepolia for certain testing configs).

### Approaches
- **Use `provider.lookupAddress(address)`**: Accepts a hex string and returns a `.eth` name string.
- If it returns `null`, fallback to truncation (e.g. `0x12...34`).
- **Caching**: ENS requests are distinct RPC calls. Doing this for every row in a table or every creator split will throttle the RPC severely. 

#### Recommendation
1. Create a `resolveEnsName` utility or hook that uses an `ethers.JsonRpcProvider('https://cloudflare-eth.com')` (free public node for simple ENS lookups).
2. Utilize a local cache layer (e.g., standard React Context mapping or `localStorage` keyed object) so that multiple instances of `0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045` resolve instantly to `vitalik.eth` without spamming network calls.

## 3. UI Implications
- The top-right navbar dropdown should replace the hardcoded "Login via MetaMask" with the "Connect Wallet" trigger from the Web3Modal.
- WalletConnect uses QR codes natively, requiring CSS compatibility checks on mobile widths.

## 4. Dependencies Strategy
- `npm install @web3modal/ethers v6 ethers@6` 
- Add WalletConnect Project ID to `.env.example`.
