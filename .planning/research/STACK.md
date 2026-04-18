# STACK.md

## Core Stack
- **Languages**: TypeScript (Frontend/Hooks), JavaScript (Server), Solidity (Contracts).
- **Frontend Framework**: Next.js 14 (App Router).
- **Web3 Interface**: ethers.js v6.
- **Protocol Integration**: 0xSplits SDK.
- **Database/Auth**: Supabase.

## Rationale
- **0xSplits SDK**: Essential for programmatically managing mutable splits without deep Solidity custom logic.
- **Ethers v6**: Modern, promise-based interaction with MetaMask.
- **Splits Subgraph**: Required for displaying historical earnings across multiple transactions without hitting RPC bottlenecks.
