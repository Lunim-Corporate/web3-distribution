# Phase 1 Context: Infrastructure & Protocol

## Phase Goal
Establish the foundational plumbing for the Web3 distribution platform, integrating the 0xSplits SDK, Ethers v6, and indexing data via The Graph.

## Decisions
- **Splits Logic**: We will exclusively use the **0xSplits SDK** for interacting with splitting contracts. This handles the complexity of contract factories and ensures we follow the latest protocol standards for mutable splits.
- **Indexing Layer**: Creator earnings and history will be fetched from the **Official Splits Subgraph**. This avoids the need for a custom event listener and provides highly performant, indexed historical data.
- **Deployment & Network**: Initial development and testing will target the **Sepolia Testnet**. This allows us to use authentic protocol addresses and test end-to-end with MetaMask without the overhead of local protocol deployments.

## Specifics
- **Ethers Version**: Implementation must strictly follow Ethers.js v6 syntax (e.g., using `ethers.BrowserProvider` for MetaMask).
- **Metadata**: While financial state is on 0xSplits/The Graph, any project-specific metadata (non-chain) will be handled via the existing Supabase integration.

## Deferred Ideas
- *Local Protocol Deployment*: Currently deferred in favor of Sepolia to speed up initialization.
- *Custom Real-time Push*: Deferred until Phase 4 polish; Phase 1 focuses on stable pull-based data via Subgraph.
