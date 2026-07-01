# LUNIM Creative Rights & Revenue Distribution Platform — Complete Project Walkthrough

Welcome to the comprehensive walkthrough of **LUNIM**, a production-hardened creative rights tracking and automated royalty distribution platform. 

LUNIM bridges traditional movie production finance with decentralized Web3 mechanics, enabling automated, real-time payouts to creators, artists, and investors while enforcing enterprise-level security.

---

## 1. Project Overview

LUNIM is designed to solve a major issue in the entertainment industry: **manual, slow, and non-transparent royalty payouts**. 
Typically, actors, directors, and screenwriters wait months or years for audit statements and royalty checks. LUNIM solves this by:
- **Consolidating financial data** from multiple streams (on-chain events, Stripe, and manual CSV uploads) into an automated ETL (Extract, Transform, Load) pipeline.
- **Enabling instant revenue division** using audited Ethereum smart contracts on the **Base Network**.
- **Delivering web2 simplicity** by integrating Privy for sign-ins (Google/Email OTP) and automated self-custodial Web3 wallet creation. Users never have to manage private keys or install browser extensions.

---

## 2. Platform Architecture

LUNIM operates on a modern, decoupled stack built for extreme performance, security, and low cost:

```
                  ┌────────────────────────────────────────────────┐
                  │                 Next.js Client                 │
                  │  (Dashboard UI, Privy SDK, Charts, PDF export)  │
                  └───────────────────────┬────────────────────────┘
                                          │ HTTP Requests
                                          ▼
                  ┌────────────────────────────────────────────────┐
                  │               API Security Layer               │
                  │  (Sliding-Window Rate Limiter, Zod Validation) │
                  └───────────────────────┬────────────────────────┘
                                          │ 
                      ┌───────────────────┴───────────────────┐
                      ▼                                       ▼
          ┌───────────────────────┐               ┌───────────────────────┐
          │     Database (ETL)    │               │  Web3 Infrastructure  │
          │   (Supabase Postgres) │               │   (Base / Hardhat)    │
          │ - Inflows & Splits    │               │ - Smart Contracts     │
          │ - Materialized Views  │               │ - Account Abstraction │
          │ - Audit Logging       │               │ - Gas Paymaster       │
          └───────────────────────┘               └───────────────────────┘
```

- **Frontend Framework**: Next.js 14 (App Router) styled with Vanilla CSS and animated using Framer Motion.
- **Authentication**: Privy client-side authentication, syncing authenticated users with a secure Supabase profile server-side, secured with JWT HttpOnly tokens.
- **Database Backend**: Supabase PostgreSQL containing tables for `projects`, `rights_holders`, `transactions`, `transaction_splits`, `royalty_inflows`, and `financial_aggregates`.
- **Blockchain Core**: Base Sepolia testnet (configured to target local Hardhat for sandbox testing). Powered by standard ERC-4337 Smart Accounts (Safe) and sponsored gas policies (Alchemy) to make transactions free for project administrators.

---

## 3. Core Modules & User Roles

The platform contains two main modules tailored for distinct levels of access control: the **Admin Module** and the **Creator/Rights Holder Module**.

### 💼 Admin Module (Production Managers & Finance Officers)
Allows operators to oversee finances, configure contracts, ingest external reports, and execute payout distributions.
*   **Create Projects**: Define new creative assets (movies, soundtracks, series) in the database.
*   **Manage Contributors**: Assign rights holders, roles, and royalty split percentages (summing to 100%).
*   **Trigger Distributions**: Initiate on-chain transactions to split received funds.
*   **ETL Control Panel**: Run ingestion, view reconciliation discrepancies, and compile aggregates.

### 🎨 Creator / Rights Holder Module
Allows directors, writers, actors, and composers to monitor earnings transparently in real-time.
*   **Earning Snapshot**: View aggregate revenue earned, pending, and claimed.
*   **Individual Project Views**: Review contributor allocations for their designated projects.
*   **Reconciliation History**: Check detailed splits logs to verify they received their exact percentage.
*   **Accrued Claims**: Claim accrued splits directly to their wallet.

---

## 4. Permissions Matrix & Restrictions

To safeguard funds and prevent malicious data tampering, access controls are strictly enforced at the API layer:

| Feature / Action | Admin / Owner | Normal User / Creator | Guest / Unauthenticated |
| :--- | :---: | :---: | :---: |
| **View Dashboard Analytics** | ✅ | ✅ (Own projects only) | ❌ (Unauthorized) |
| **Export Financial PDF/CSV Reports** | ✅ | ✅ (Own splits only) | ❌ (Unauthorized) |
| **Add / Edit Projects** | ✅ | ❌ (Forbidden) | ❌ (Unauthorized) |
| **Add / Edit Rights Holders** | ✅ | ❌ (Forbidden) | ❌ (Unauthorized) |
| **Trigger Auto-Distribution of Funds** | ✅ | ❌ (Forbidden) | ❌ (Unauthorized) |
| **Claim Accrued Payout Balance** | ✅ | ✅ (Own shares only) | ❌ (Unauthorized) |
| **Trigger ETL Data Ingestion** | ✅ | ❌ (Forbidden) | ❌ (Unauthorized) |
| **Access System Health Diagnostics** | ✅ | ❌ (Forbidden) | ❌ (Unauthorized) |

### API Protection Implementations
- **Role Enforcement**: Helper function `requireAdmin()` extracts user session details and blocks requests with a `403 Forbidden` response if the role attribute in `users_profile` is not set to `ADMIN`.
- **Row-Level Security (RLS)**: Active in Supabase database tables, ensuring users can query splits data only if the records correspond to their verified public address.

---

## 5. Security Measures Taken

LUNIM has been hardened against security threats to ensure zero data tampering and zero loss of funds.

1.  **Rate Limiting Tiering**:
    - **Read Tier** (60 req/min): Applied to public charts and views.
    - **Write Tier** (10 req/min): Applied to Stripe session triggers and project updates.
    - **Auth Tier** (5 req/min): Applied to signup, login, and token synchronization endpoints.
    - **Sensitive Tier** (3 req/min): Applied to auto-distribution payouts and diagnostics checks.
2.  **Strict Input Validation**: All POST/PUT requests pass through Zod middleware filters. Checked features include:
    - Checks for Ethereum address checksum formats.
    - Rejects project percentage configurations that do not sum to exactly 100.00%.
    - Restricts transaction inputs to safe bounds (e.g., maximum 1000 ETH per distribution).
3.  **Cross-Site Scripting (XSS) & Clickjacking Protections**:
    - Custom security headers injected at the gateway via `next.config.js` (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`).
    - Robust Content Security Policy (CSP) headers restricting scripts execution to safe domains.
4.  **Smart Contract Hardening**:
    - **Reentrancy Protection**: Used on all state-modifying smart contract calls (`claim`, `release`).
    - **Rounding Safe Calculations**: In push-based distributions, the final index in the array receives `msg.value - distributedShares` to prevent truncation rounding dust from building up inside the contract.

---

## 6. How to Use & Operating Guide

### Running Local Development Sandbox

1.  **Launch Blockchain Simulator**:
    ```bash
    npx hardhat node
    ```
2.  **Deploy Smart Contracts**:
    ```bash
    npm run deploy:local
    ```
3.  **Seed Database Mock Records**:
    ```bash
    npm run seed
    ```
4.  **Start Frontend Dev Server**:
    ```bash
    npm run dev
    ```

### Workflow Steps for Admin
- **Step 1**: Log in. If local development is active, toggle **Demo Mode** in the dashboard to bypass live authentication.
- **Step 2**: Add a Project. Input project details and define 3-6 rights holders with their respective wallet addresses and split percentages.
- **Step 3**: Record Inflows. Trigger a simulated Stripe payment of 0.5 ETH to the project.
- **Step 4**: Trigger Payout. Click "Release Payments" on the **Distribute** tab. This deploys funds on-chain, splits them according to the percentages, and credits the respective rights holders' accounts.

---

## 7. Frequently Asked Questions (FAQ)

#### Q1: Do creators need to pay gas fees to withdraw or view their royalties?
**No.** All administrative auto-distribution actions are gas-sponsored using Account Abstraction (ERC-4337 Safe Smart Accounts and Alchemy Paymaster). Creators only pay minimal gas fees when claiming/withdrawing their accumulated balance directly to an external personal wallet.

#### Q2: How does the system handle rounding errors? For example, split percentages like 33.33%?
If splits are not divisible evenly, rounding dust is created. The `RevenueRights.sol` smart contract resolves this by calculating splits programmatically for all payees except the final one. The final payee is awarded the remainder of the balance: `remaining = totalAmount - distributedShares`, ensuring zero dust remains locked inside the contract.

#### Q3: Where are the user private keys stored?
User private keys are **never** stored on LUNIM servers or databases. The platform uses **Privy's MPC (Multi-Party Computation) architecture**. Keys are split into multiple shares: one share is held by Privy (encrypted), one is stored securely on the user's browser, and one is encrypted by the user's login credentials. No single party can access the private key alone.

#### Q4: What happens if the Express backend or contract listener goes offline?
If the contract listener goes offline, on-chain payouts continue to execute successfully because smart contracts run independently on the blockchain. However, the dashboard database records won't update in real-time. To address this, the **ETL Reconciliation Module** exists. Once the backend is online, running the reconciliation route `/api/etl/reconcile` automatically scans the blockchain for missing events and syncs the database.

#### Q5: Can project share allocations be edited after a contract is deployed?
Yes. The `RevenueSplitter.sol` contract contains an owner-restricted `updateShares` function. For full upgradeability, `RevenueRightsUpgradeable.sol` uses a UUPS proxy pattern that allows replacing the entire implementation contract without changing the proxy address.

#### Q6: How does the database protect user transaction splits from being tampered with?
The database relies on Postgres **Row-Level Security (RLS)**. It guarantees that rights holders can only read or query records associated with their authenticated public key. Furthermore, the database schema is indexed on `tx_hash` and matches splits against transaction logs to prevent double-spending or fake manual record injection.

#### Q7: Can this platform be deployed on Base Mainnet?
Yes. There is a dedicated `scripts/deploy-mainnet.js` for Base Mainnet deployment. Set `NEXT_PUBLIC_CHAIN_ID=8453`, add a funded Base deployer private key, and run `npm run deploy:mainnet`.
