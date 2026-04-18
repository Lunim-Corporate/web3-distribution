# TESTING.md

## General Testing Strategy
- The primary test bed relies extensively upon manual component checks, though the configuration reveals robust potential for the Smart Contract environments.

## Frameworks
- **Smart Contracts Tests**: Utilizes `@nomicfoundation/hardhat-toolbox` and `@nomicfoundation/hardhat-chai-matchers`. Tests are written in Mocha and Chai against a localized Hardhat Node mimicking EVM processes. Coverage is accessible through `solidity-coverage` dependency inside the Ethereum layer.

## Coverage Limitations
- Standard web layer (Next.js) testing is absent (no Jest, Cypress, or Playwright setup was explicitly detected in standard manifests). Validating the React UI relies mostly on localized local host interaction at the current milestone.
