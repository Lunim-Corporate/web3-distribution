---
wave: 1
depends_on: []
files_modified:
  - package.json
  - src/lib/web3/client.ts
  - src/lib/web3/subgraph.ts
  - src/hooks/useSplits.ts
autonomous: true
---

# Plan: Protocol & SDK Setup

## Goal
Establish a robust, reusable interface for the 0xSplits SDK and Ethers v6 provider, targeting the Sepolia testnet.

## Tasks

<task>
<read_first>
- package.json
</read_first>
<action>
Install the 0xSplits SDK and ensure Ethers v6 is used.
Run: `npm install @0xsplits/splits-sdk@latest ethers@latest`
</action>
<acceptance_criteria>
- package.json contains `@0xsplits/splits-sdk`
- package.json contains `ethers` version 6.x or higher
</acceptance_criteria>
</task>

<task>
<read_first>
- src/app/layout.tsx
</read_first>
<action>
Create `src/lib/web3/client.ts`. 
Implement a singleton pattern to initialize the `SplitsClient` with:
- chainId: 11155111 (Sepolia)
- provider: An Ethers BrowserProvider (for MetaMask)
- Optional signer for Admin actions.
</action>
<acceptance_criteria>
- `src/lib/web3/client.ts` exists.
- File exports an initialization function or a configured client instance.
- Chain ID 11155111 is explicitly referenced for Sepolia.
</acceptance_criteria>
</task>

<task>
<read_first>
- .planning/phases/01-infrastructure-protocol/1-RESEARCH.md
</read_first>
<action>
Create `src/lib/web3/subgraph.ts`.
Implement a service to fetch user earnings from the 0xSplits Sepolia Subgraph URL: `https://api.thegraph.com/subgraphs/name/0xsplits/splits-sepolia`.
Export a function `getUserEarnings(address: string)` that returns formatted revenue data.
</action>
<acceptance_criteria>
- `src/lib/web3/subgraph.ts` exists.
- Contains the 0xSplits Sepolia subgraph endpoint.
- Correctly parses the Graph response into a typed earnings object.
</acceptance_criteria>
</task>

<task>
<read_first>
- src/hooks/useRevenueContract.js
</read_first>
<action>
Create `src/hooks/useSplits.ts`.
A React hook that provides access to the initialized `SplitsClient` and the earnings fetching logic to UI components.
</action>
<acceptance_criteria>
- `src/hooks/useSplits.ts` exists.
- Returns `splitsClient` and `getEarnings` methods.
</acceptance_criteria>
</task>

## Verification
- Run `npm list @0xsplits/splits-sdk` to verify installation.
- Check that all new files in `src/lib/web3/` compile without TypeScript errors.
