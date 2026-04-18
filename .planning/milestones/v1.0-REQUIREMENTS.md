# REQUIREMENTS.md

## v1 Requirements

### Admin Module (ADM)
- [ ] **ADM-01**: Admin login via MetaMask to control project settings.
- [ ] **ADM-02**: Interface to add/remove creators from the 0xSplits roster.
- [ ] **ADM-03**: Dynamic split percentage adjustment (Mutable Split Controller).
- [ ] **ADM-04**: Global project revenue overview and transaction history.

### Creator Module (CRE)
- [ ] **CRE-01**: Creator-specific dashboard view restricted to their address data.
- [ ] **CRE-02**: Real-time display of individual share percentage and rights.
- [ ] **CRE-03**: Accumulated revenue tracking (historic vs. pending).
- [ ] **CRE-04**: One-click "Withdraw Share" button triggering the on-chain distribution.

### Web3 Protocol & Infrastructure (W3P)
- [ ] **W3P-01**: Integrate 0xSplits SDK for contract interactions.
- [ ] **W3P-02**: Ethers.js v6 provider for modern wallet communication.
- [ ] **W3P-03**: Subgraph integration for fast historical data indexing.

### Security & Polish (SEC)
- [ ] **SEC-01**: Access control logic to prevent unauthorized split modifications.
- [ ] **SEC-02**: Premium UI styling with high-fidelity transitions and micro-animations.
- [ ] **SEC-03**: Comprehensive error handling and user feedback for Web3 transactions.

## v2 Requirements (Deferred)
- **CRE-05**: Automated push notifications (email/mobile) when revenue is distributed.
- **ADM-05**: Multi-sig support for split controllers to enhance security.

## Out of Scope
- **FIAT-01**: Manual fiat payouts. Rationale: Maintain strictly trustless Web3 native routing.
- **SOCIAL-01**: Creator social media features. Rationale: Maintain focus on financial tracking and rights management.

## Traceability
- **ADM-01**: Phase 2
- **ADM-02**: Phase 3
- **ADM-03**: Phase 3
- **ADM-04**: Phase 3
- **CRE-01**: Phase 2
- **CRE-02**: Phase 3
- **CRE-03**: Phase 3
- **CRE-04**: Phase 3
- **W3P-01**: Phase 1
- **W3P-02**: Phase 1
- **W3P-03**: Phase 1
- **SEC-01**: Phase 2
- **SEC-02**: Phase 4
- **SEC-03**: Phase 4
