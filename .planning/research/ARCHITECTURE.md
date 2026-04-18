# ARCHITECTURE.md

## Implementation Strategy
- **Split Controller**: The Admin wallet is designated as the `Controller` of the 0xSplits contract.
- **Metadata Management**: Project-specific data (Creator names, bio, avatars) is stored in Supabase and matched to Ethereum addresses.
- **State Synchronization**: Custom events bridge on-chain state changes (like split updates) to the local Supabase mirror.
