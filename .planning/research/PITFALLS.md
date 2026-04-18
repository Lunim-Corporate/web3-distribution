# PITFALLS.md

## Known Risks
- **Unearned Balance Dilution**: If splits are changed before a creator withdraws, their total proportional share might be calculated against the *new* total shares. 
  - *Prevention*: UI should warn Admins to "Flush" or notify creators before major share changes.
- **RPC Rate Limits**: Polling blockchain data for dashboard updates can trigger rate limits.
  - *Mitigation*: Extensive use of Subgraph (The Graph) for historical data.
