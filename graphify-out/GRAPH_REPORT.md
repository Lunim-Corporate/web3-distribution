# Graph Report - web3-freedom-upgrade  (2026-06-16)

## Corpus Check
- 124 files · ~64,965 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 824 nodes · 1028 edges · 67 communities (62 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0d3ec973`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 21 edges
2. `supabaseAdmin` - 19 edges
3. `cn()` - 19 edges
4. `compilerOptions` - 17 edges
5. `🎬 LUNIM — The Complete Beginner's Guide` - 17 edges
6. `Creative Revenue & Rights Dashboard` - 15 edges
7. `LUNIM - Complete Project Explanation` - 15 edges
8. `PHASE 0 — PROJECT AUDIT REPORT` - 15 edges
9. `requireAdmin()` - 14 edges
10. `scripts` - 12 edges

## Surprising Connections (you probably didn't know these)
- `getReceiptFromNetwork()` --calls--> `http`  [INFERRED]
  src/app/api/web3/auto-distribute/route.ts → scripts/api-smoke-test.js
- `POST()` --calls--> `http`  [INFERRED]
  src/app/api/web3/auto-distribute/route.ts → scripts/api-smoke-test.js
- `POST()` --calls--> `requireAdmin()`  [INFERRED]
  src/app/api/projects/add/route.ts → src/app/lib/apiSecurity.ts
- `POST()` --calls--> `requireAdmin()`  [INFERRED]
  src/app/api/rights/add/route.ts → src/app/lib/apiSecurity.ts
- `RevenueFilter()` --calls--> `cn()`  [EXTRACTED]
  src/app/components/dashboard/RevenueFilter.tsx → src/app/lib/utils.ts

## Import Cycles
- None detected.

## Communities (67 total, 5 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (21): CONTRACT_ABI, getReceiptFromNetwork(), POST(), GET(), DiagnosticsResult, POST(), getVerifiedUser(), requireAdmin() (+13 more)

### Community 1 - "Community 1"
Cohesion: 0.04
Nodes (48): 10. Where Is the Smart Contract?, 11. Where Is the Data Stored?, 12. How to Set Up and Run, 13. Frequently Asked Questions, 14. Glossary, 1. Blockchain (Hardhat / Ethereum), 1. What Is This Project?, 2. Supabase (Cloud PostgreSQL Database) (+40 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (44): dependencies, autoprefixer, chart.js, clsx, cors, ethers, express, express-rate-limit (+36 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (30): RevenueFilterProps, mockContracts, mockProjects, mockRevenue, mockUsers, GET(), { jsPDF }, generateRevenueReport() (+22 more)

### Community 4 - "Community 4"
Cohesion: 0.07
Nodes (18): AdminPage(), Project, RightsHolder, metadata, HomePage(), LoginComponent(), Navbar(), AuthContext (+10 more)

### Community 5 - "Community 5"
Cohesion: 0.07
Nodes (28): DEMO_ACCOUNTS, AddRightsHolderModal(), DistributePanel(), Project, RightsHolder, DashboardContent(), HolderProfileModal(), Project (+20 more)

### Community 6 - "Community 6"
Cohesion: 0.08
Nodes (17): ProjectPage(), centsToGBP(), centsToUSD(), dollarsToCents(), formatCurrencyFromCentsGB(), formatCurrencyFromCentsUSD(), formatPaymentAmountFromCentsGB(), formatPaymentAmountFromCentsUSD() (+9 more)

### Community 7 - "Community 7"
Cohesion: 0.05
Nodes (36): devDependencies, chai, concurrently, dotenv, eslint, eslint-config-next, hardhat, hardhat-gas-reporter (+28 more)

### Community 8 - "Community 8"
Cohesion: 0.07
Nodes (28): 10. Setup & Running, 11. Development Milestones, 12. Key Design Decisions, 13. Project File Structure, 1. Project Overview, 2. Technology Stack, 3.1 Landing Page (`/`), 3.2 Login Page (`/login`) (+20 more)

### Community 9 - "Community 9"
Cohesion: 0.08
Nodes (23): 10. Refactor Recommendations, 11. Migration Strategy, 12. Risk Assessment, 13. Files Changed in This Phase, 14. Next Steps, 1. Architecture Overview, 2. Current Authentication Flow, 3. Current Payment / Revenue Flow (+15 more)

### Community 10 - "Community 10"
Cohesion: 0.15
Nodes (15): TwoFactorVerificationProps, ActivityItem, MilestoneData, RecentActivity(), RecentActivityProps, RevenueData, RightsData, SplitData (+7 more)

### Community 11 - "Community 11"
Cohesion: 0.10
Nodes (20): compilerOptions, allowJs, baseUrl, esModuleInterop, incremental, isolatedModules, jsx, lib (+12 more)

### Community 12 - "Community 12"
Cohesion: 0.18
Nodes (9): formatUSD(), PaymentSplitter(), ReportGenerator(), ReportGeneratorProps, calculatePaymentSplit(), formatCurrency(), formatPercentage(), normalizePaymentStatus() (+1 more)

### Community 13 - "Community 13"
Cohesion: 0.18
Nodes (10): cn(), Input(), InputProps, Modal(), ModalProps, NotificationBanner(), NotificationBannerProps, NotificationType (+2 more)

### Community 14 - "Community 14"
Cohesion: 0.12
Nodes (15): 10. Next Steps, 1. Completed Tasks, 2. Architectural Decisions, 3. Files Created, 4. Files Modified, 5. Dependencies Added, 6. Dependencies Removed, 7. Build Verification (+7 more)

### Community 15 - "Community 15"
Cohesion: 0.12
Nodes (15): 1. Completed Tasks, 2. Auth Flow, 3. Files Created, 4. Files Modified, 5. Environment Variables, 6. Build Verification, 7. Key Details, 8. Risks (+7 more)

### Community 16 - "Community 16"
Cohesion: 0.12
Nodes (15): 1. Installation, 2. Environment Variables Configuration, Account Abstraction & EOA Fallback Architecture, 🏗️ Architecture Overview, Compile Smart Contracts, Deploy to Base Sepolia, 🚀 Key Features, Local Development Node (+7 more)

### Community 17 - "Community 17"
Cohesion: 0.14
Nodes (12): Architecture, Auth Flow, Build Notes, Database (Supabase), Development Commands, Environment Variables, Express Server Route Map, Frontend Patterns (+4 more)

### Community 18 - "Community 18"
Cohesion: 0.15
Nodes (12): AB Contract, AGENTS.md — LUNIM, Architecture, Auth (Single Path — Demo Uses Mock Privy User), DB, Dev Commands, How Demo Mode Works, Key Files (+4 more)

### Community 19 - "Community 19"
Cohesion: 0.15
Nodes (12): 1. What Does This Project Do?, 2. High-Level Architecture, 8. Complete Workflow Example, Core Functionality, File Structure Reference, Glossary, LUNIM - Complete Project Explanation, Real-World Use Case (+4 more)

### Community 20 - "Community 20"
Cohesion: 0.15
Nodes (12): 1. Applied Fixes Summary, 2. Fix 1: Environment Variables Resolution (High Impact), 3. Fix 2: Textual Update in SmartContractPanel (Low Impact), 4. Verification, Applied Fix, Applied Fix, Files Changed, Files Changed (+4 more)

### Community 21 - "Community 21"
Cohesion: 0.22
Nodes (6): Notice, mockMilestones, mockRights, formatDate(), Badge(), BadgeProps

### Community 22 - "Community 22"
Cohesion: 0.18
Nodes (10): 1. Test Summary, 2. Detailed QA Observations, 3. Failure Handling & Edge Cases, 4. Next Steps, Mobile Responsiveness, Onboarding Flow, Phase 7 — Testing + QA Report, RPC Downtime (+2 more)

### Community 23 - "Community 23"
Cohesion: 0.31
Nodes (7): requiredChainIdDec, SmartContractPanel(), truncateAddress(), ABI, Address, REVENUE_SPLITTER_ADDRESS, useRevenueSplitter()

### Community 24 - "Community 24"
Cohesion: 0.22
Nodes (9): 11. Quick Start Guide, 1. Install Dependencies, 2. Set Up Environment, 3. Start Local Development, 4. Deploy Contracts Locally, 5. Seed Database, 6. Access the App, For New Developers (+1 more)

### Community 25 - "Community 25"
Cohesion: 0.22
Nodes (9): 5. Wallet Connections Explained, Phase 1: Original (MetaMask Required), Phase 2: Current (Embedded via Privy), Smart Accounts (Safe), The Evolution of Wallets in This Project, The Hardhat Wallets (Local Development), The Privy Embedded Wallets, Three Types of Wallets in This System (+1 more)

### Community 26 - "Community 26"
Cohesion: 0.22
Nodes (9): 9. Smart Contract Deployment & Upgradability, Can You Update/Modify the Contract After Deployment?, Current Approach (Non-Upgradeable), Current Deployment Status, Deployment Process, For Production (Recommended), Step 1: Deploy to Local Hardhat, Step 2: Deploy to Base Sepolia (Testnet) (+1 more)

### Community 27 - "Community 27"
Cohesion: 0.22
Nodes (8): 1. Issue Summary, 2. Root Cause Analysis, 3. Active Variables Audit, 4. Exposed Secrets Analysis, 5. Affected Systems, 6. Recommended Fix, 7. Next Actions, INVESTIGATION REPORT: Environment + Configuration

### Community 28 - "Community 28"
Cohesion: 0.22
Nodes (8): 1. Completed Tasks, 2. Contract Architecture, 3. Files Created/Modified, 4. Graceful Degradation, 5. Build Verification, Frontend Contract Config, PHASE 3 — SMART CONTRACT INTEGRATION, RevenueSplitter.sol

### Community 29 - "Community 29"
Cohesion: 0.25
Nodes (6): ChartsPanel(), ChartsPanelProps, DEFAULT_COLORS, monthsNames, PROJECT_COLORS, RevenueData

### Community 30 - "Community 30"
Cohesion: 0.25
Nodes (7): 1. Issue Summary, 2. Root Cause Analysis, 3. Provider Hierarchy Verification, 4. Auth Session & Wallet Sync Bridge, 5. Security & Hydration Safety, 6. Recommended Action, INVESTIGATION REPORT: Provider + Auth

### Community 31 - "Community 31"
Cohesion: 0.25
Nodes (7): 1. Completed Tasks, 2. Payment Flow, 3. Guardrails, 4. Build Verification, PHASE 4 — ON-CHAIN PAYMENTS, When Contract Deployed (Base Sepolia), When Contract Not Deployed (Local)

### Community 32 - "Community 32"
Cohesion: 0.25
Nodes (7): 1. Completed Tasks, 2. Provider Hierarchy (Final), 3. Wallet Architecture (Final), 4. Files Deleted, 5. Files Modified, 6. Build Verification, PHASE 5 — CLEAN UP LEGACY PROVIDERS

### Community 33 - "Community 33"
Cohesion: 0.25
Nodes (7): 1. Documentation Overview, 2. Infrastructure Overview, 3. Project Conclusion, Architecture Documentation, Developer Setup Guide, Phase 8 — Final Documentation Report, Rollback Procedures

### Community 34 - "Community 34"
Cohesion: 0.25
Nodes (5): { createClient }, { HDNodeWallet, Mnemonic }, mnemonic, path, supabase

### Community 35 - "Community 35"
Cohesion: 0.33
Nodes (5): FilterPeriod, FilterStatus, RevenueFilter(), Button(), ButtonProps

### Community 36 - "Community 36"
Cohesion: 0.29
Nodes (7): 7. Database & Data Flow, Data Flow Diagram, Database Schema, Projects Table, Rights Holders Table, Transaction Splits Table, Transactions Table

### Community 37 - "Community 37"
Cohesion: 0.29
Nodes (6): 1. Issue Summary, 2. Root Cause Analysis, 3. ERC-4337 Configuration Audit, 4. Operational Gaps, 5. Recommended Actions, INVESTIGATION REPORT: Smart Account + ERC-4337

### Community 38 - "Community 38"
Cohesion: 0.29
Nodes (6): 1. Issue Summary, 2. Root Cause Analysis, 3. Transaction Execution Trace, 4. Operational Gaps, 5. Recommended Actions, INVESTIGATION REPORT: Dashboard + Transaction Flow

### Community 39 - "Community 39"
Cohesion: 0.29
Nodes (6): 1. Issue Summary, 2. Root Cause Analysis, 3. Network Transport Verification, 4. Connection Gaps, 5. Recommended Action, INVESTIGATION REPORT: Blockchain + RPC

### Community 40 - "Community 40"
Cohesion: 0.29
Nodes (6): 1. Completed Tasks, 2. Dashboard Component Map, 3. Bundle Analysis, 4. Migration Status, 5. Build Verification, PHASE 6 — DASHBOARD INTEGRATION

### Community 41 - "Community 41"
Cohesion: 0.33
Nodes (6): 10. Recommendations & Shortcomings, Architecture Improvements, Critical Issues to Address, Security Considerations, Technical Debt, UX/Gap Analysis

### Community 42 - "Community 42"
Cohesion: 0.33
Nodes (6): 6. Understanding Hardhat (Local Blockchain), Hardhat Configuration, How to Run, The Contract Listener Connection, What is Hardhat?, Why Use It?

### Community 43 - "Community 43"
Cohesion: 0.33
Nodes (5): 1. Build Verification, 2. API & Client Route Verification, 3. End-to-End Auth & Web3 Flow Audit, 4. Operational Summary, FINAL VERIFICATION REPORT

### Community 44 - "Community 44"
Cohesion: 0.40
Nodes (5): deployFixture(), deployWithPayeesFixture(), { ethers }, { expect }, {
  loadFixture,
}

### Community 45 - "Community 45"
Cohesion: 0.40
Nodes (5): 3. How Money Moves Through the System, A. Local Development Mode (Hardhat), B. Production Mode (Base Network), Step-by-Step Money Flow, The Two Modes

### Community 46 - "Community 46"
Cohesion: 0.40
Nodes (5): 4. Smart Contract Deep Dive, How Distribution Works (Line by Line), Key Functions, RevenueRights.sol - The Main Contract, Secondary Contract: RevenueSplitter.sol

### Community 47 - "Community 47"
Cohesion: 0.40
Nodes (4): extends, rules, no-unused-vars, react/no-unescaped-entities

### Community 48 - "Community 48"
Cohesion: 0.40
Nodes (3): fs, hre, path

### Community 49 - "Community 49"
Cohesion: 0.40
Nodes (3): fs, hre, path

### Community 50 - "Community 50"
Cohesion: 0.40
Nodes (3): { ethers }, { expect }, {
  loadFixture,
}

### Community 51 - "Community 51"
Cohesion: 0.40
Nodes (4): buildCommand, framework, installCommand, outputDirectory

## Knowledge Gaps
- **456 isolated node(s):** `extends`, `no-unused-vars`, `react/no-unescaped-entities`, `path`, `config` (+451 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `supabaseAdmin` connect `Community 0` to `Community 3`, `Community 12`, `Community 6`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `Community 4` to `Community 5`, `Community 6`, `Community 10`, `Community 12`, `Community 23`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Community 2` to `Community 7`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **What connects `extends`, `no-unused-vars`, `react/no-unescaped-entities` to the rest of the system?**
  _456 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06431372549019608 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.04081632653061224 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.045454545454545456 - nodes in this community are weakly interconnected._