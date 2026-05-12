# 🎬 LUNIM — The Complete Beginner's Guide

### *Everything you need to know, even if you've never touched code or heard of "Web3"*

**Author:** Jeevesh Singale · **Brand:** LUNIM · **Last Updated:** May 2026

---

## Table of Contents

1. [What Is This Project?](#1-what-is-this-project)
2. [The Problem It Solves](#2-the-problem-it-solves)
3. [What Is Blockchain / Web3 / Ethereum?](#3-what-is-blockchain--web3--ethereum)
4. [What Is a Smart Contract?](#4-what-is-a-smart-contract)
5. [What Is Hardhat? (The Local Blockchain)](#5-what-is-hardhat-the-local-blockchain)
6. [What Is a Wallet?](#6-what-is-a-wallet)
7. [How Everything Connects](#7-how-everything-connects)
8. [Walking Through the Application](#8-walking-through-the-application)
9. [How a Revenue Distribution Works](#9-how-a-revenue-distribution-works)
10. [Where Is the Smart Contract?](#10-where-is-the-smart-contract)
11. [Where Is the Data Stored?](#11-where-is-the-data-stored)
12. [How to Set Up and Run](#12-how-to-set-up-and-run)
13. [Frequently Asked Questions](#13-frequently-asked-questions)
14. [Glossary](#14-glossary)

---

## 1. What Is This Project?

**LUNIM** is a **Creative Revenue & Rights Dashboard** — a web application for entertainment companies (film studios, music labels, web series producers) that automates one critical task:

> **Fairly and transparently splitting revenue among everyone who worked on a creative project.**

Imagine a web series called *"Neon Requiem"* earns $10,000. That money goes to the director (28%), lead actor (22%), producer (18%), composer (17%), and screenwriter (15%). Traditionally this is manual spreadsheets and bank transfers. LUNIM automates it using blockchain:

- ✅ Split percentages are **locked into code** — nobody can secretly change them
- ✅ Money is distributed **automatically and instantly**
- ✅ Every payment is **publicly verifiable** — anyone can audit the records
- ✅ A beautiful **dashboard** shows all earnings, charts, and history

---

## 2. The Problem It Solves

### The Old Way (Manual & Opaque)
```
Revenue arrives → Someone calculates splits manually
→ Sends bank transfers one by one → People wait days/weeks
→ Disputes? It's their word vs. the company's
```

### The LUNIM Way (Automated & Transparent)
```
Revenue arrives → Smart contract splits it per the agreed %
→ Everyone gets paid INSTANTLY → Every payment is recorded
on the blockchain forever → Anyone can verify the math
```

**Analogy:** Think of a **vending machine**. You put money in, and the machine follows its pre-programmed rules to dispense items. Nobody can reach inside and change the rules. The smart contract is that vending machine.

---

## 3. What Is Blockchain / Web3 / Ethereum?

### Blockchain (The Ledger)
A **blockchain** is a digital record book that is:
- **Permanent** — once written, it cannot be erased
- **Distributed** — copies exist on thousands of computers, not one company's server
- **Transparent** — anyone can read it

Think: a **Google Sheet everyone can read, but nobody can edit or delete past entries**.

### Ethereum (The Platform)
**Ethereum** is the specific blockchain we use. While Bitcoin mainly sends money, Ethereum also runs **programs** (smart contracts) on the blockchain — like a **global computer** nobody owns.

### ETH (The Currency)
**ETH** (Ether) is Ethereum's currency. When we distribute revenue in LUNIM, we send ETH.

### Web3
The general term for apps that use blockchain for transparency and ownership, vs. traditional apps (Web2) that store everything on one company's servers.

> [!NOTE]
> In this project, we use **simulated (fake) ETH** on a local test blockchain. No real money is involved unless you explicitly deploy to the real Ethereum network.

---

## 4. What Is a Smart Contract?

A **smart contract** is a program on the blockchain. Once deployed, it runs automatically by its coded rules. Nobody can change it — not even the creator.

### Our Contract: `RevenueRights.sol`

In plain English:
```
WHEN money is sent to this contract:
  1. Look at the list of rights holders and their percentages
  2. Calculate each person's share
  3. Send the correct amount to each person's wallet
  4. Record the event on the blockchain
  5. Done — all in one transaction (< 2 seconds)
```

**Key facts:**
- Uses **basis points** (out of 10,000) for precision. 28% = 2,800 basis points.
- Percentages MUST sum to exactly 10,000. The contract **refuses to deploy** otherwise.
- Emits "events" (receipts) for every payment — this is what the dashboard reads.
- Once deployed, holder list and percentages are **immutable**.

---

## 5. What Is Hardhat? (The Local Blockchain)

### Why Not Use Real Ethereum for Testing?
Real Ethereum costs real money ("gas fees"). Hardhat solves this by running a **fake blockchain on your computer**.

| Feature | Real Ethereum | Hardhat (Local) |
|---|---|---|
| Cost | Real money | **Completely FREE** |
| Speed | ~15 seconds/tx | **Instant** |
| Where it runs | Thousands of computers | **Your computer only** |
| ETH available | You buy it | **10,000 free test ETH/account** |
| Persistence | Permanent | **Resets when stopped** |
| Address | Public endpoints | `http://127.0.0.1:8545` |
| Chain ID | 1 (mainnet) | **31337** |

### How It Works Here

Running `npm run chain` starts a local blockchain server. It creates **20 test accounts**, each with **10,000 fake ETH**. Account #0 deploys the contract; accounts #1–#5 are assigned to rights holders.

> [!IMPORTANT]
> Hardhat is a developer testing tool. In production, the contract would be deployed to real Ethereum or a cheaper chain like Polygon.

---

## 6. What Is a Wallet?

### Crypto Wallet Basics
A crypto wallet is a **digital bank account** for blockchain:
- **Public address** (like a bank account number — safe to share): `0x70997970C5...`
- **Private key** (like your PIN — NEVER share): a long secret string

### MetaMask
The most popular wallet. It's a **browser extension** that:
- Stores your wallet securely
- Lets websites interact with the blockchain
- Shows your balance
- Asks for approval before every transaction

In LUNIM, MetaMask signs distribution transactions. When an admin clicks "Distribute", MetaMask pops up: "Approve sending 0.5 ETH?" → Confirm → money flows through the contract.

### Demo vs. Live Wallets

| Mode | Toggle Color | Wallet Type | Details |
|---|---|---|---|
| **Demo** | Orange | Local Hardhat accounts | Pre-loaded with 10,000 free test ETH. No extension needed. |
| **Live** | Violet/Blue | Real wallets | MetaMask, Coinbase, Trust, Phantom, Rainbow, WalletConnect |

### Supported Providers (Live Mode)
- **MetaMask** — Most common Ethereum wallet
- **Coinbase Wallet** — By Coinbase exchange
- **Trust Wallet** — Multi-chain, mobile-first
- **Phantom** — Solana + Ethereum
- **Rainbow** — User-friendly Ethereum wallet
- **WalletConnect** — Connect any mobile wallet

---

## 7. How Everything Connects

```
┌──────────────────────────────────────────────────────────────┐
│                     USER'S BROWSER                           │
│  ┌────────────┐  ┌────────────────┐  ┌──────────────────┐   │
│  │ Next.js    │  │ MetaMask or    │  │ Supabase Client  │   │
│  │ Frontend   │──│ Local Wallet   │  │ (DB queries)     │   │
│  │ (Dashboard)│  │ (signs tx)     │  │                  │   │
│  └─────┬──────┘  └──────┬─────────┘  └────────┬─────────┘   │
└────────┼────────────────┼─────────────────────┼──────────────┘
         │                │                     │
         ▼                ▼                     ▼
┌────────────────┐ ┌─────────────┐     ┌──────────────────┐
│ Express.js     │ │ Hardhat     │     │ Supabase         │
│ Backend (4000) │ │ Chain (8545)│     │ Cloud Database   │
│ - Auth/JWT     │ │ - Contract  │     │ - Projects       │
│ - Rate limits  │ │ - 20 test   │     │ - Holders        │
│ - CRUD APIs    │ │   accounts  │     │ - Transactions   │
└────────────────┘ └─────────────┘     └──────────────────┘
```

**Three servers run simultaneously** when you start the app:
1. **Hardhat** (port 8545) — Local blockchain
2. **Express.js** (port 4000) — API server with auth & security
3. **Next.js** (port 3000) — The website

---

## 8. Walking Through the Application

### Landing Page (`/`)
Cinematic dark page with animated backgrounds. Shows "The Standard For Creative Rights". Redirects logged-in users to dashboard.

### Login Page (`/login`)
Email + password form via **Supabase Auth**. Has auto-fill button for demo admin credentials.

### Dashboard (`/dashboard`) — 5 Tabs

| Tab | Access | Purpose |
|---|---|---|
| **Overview** | Everyone | Charts, recent activity, top 3 holders |
| **Revenue** | Everyone | Full transaction list with expandable per-holder splits |
| **Rights Holders** | Admin only | All holders: names, roles, %, wallets, earnings |
| **Reports** | Admin only | Generate/export revenue reports |
| **Distribute** | Admin only | Enter ETH amount and execute distribution |

### Navigation Bar
- **LUNIM logo** with green online indicator
- **Live/Demo toggle** — switches wallet mode
- **Notification bell** — recent transactions
- **Wallet connector** — connect/disconnect wallets
- **Profile menu** — user info, settings, logout

### Profile Page (`/profile`)
Your name, email, role, connected wallet, balance. Disconnect wallet or log out.

---

## 9. How a Revenue Distribution Works

When an admin distributes **1 ETH** to "Neon Requiem":

**Step 1:** Admin enters `1.0` ETH on the Distribute tab, sees the per-holder preview.

**Step 2:** Clicks "Initiate Distribution". In Demo mode it executes directly. In Live mode, MetaMask asks for confirmation.

**Step 3:** The smart contract receives 1 ETH and splits it automatically:
```
Aria Voss      (Director)    28% → 0.2800 ETH
Marcus Delgado (Lead Actor)  22% → 0.2200 ETH
Priya Nair     (Producer)    18% → 0.1800 ETH
Theo Harrington (Composer)   17% → 0.1700 ETH
Simone Okafor  (Writer)      15% → 0.1500 ETH
                             ────────────────
                       TOTAL: 100% = 1.0000 ETH
```

**Step 4:** Transaction + splits are saved to the Supabase database.

**Step 5:** Dashboard updates in real-time across all open browser tabs via:
1. **CustomEvent** — same-tab notification
2. **BroadcastChannel** — cross-tab sync
3. **Supabase Realtime** — global sync for all users

---

## 10. Where Is the Smart Contract?

**Source code:** `contracts/RevenueRights.sol`

**After deployment**, it gets a unique address (e.g., `0xCf7Ed3AccA5a...`), saved to:
- `src/contracts/RevenueRights.json` (ABI + address for the frontend)
- `.env.local` as `NEXT_PUBLIC_REVENUE_SPLITTER_ADDRESS`

**View it:** The contract address shows at the bottom of the Distribute tab.

**Interact via CLI:**
```bash
npx hardhat console --network localhost
> const c = await ethers.getContractAt("RevenueRights", "0x...")
> await c.getRightsHolders()
```

> [!NOTE]
> The contract only exists on your local machine while Hardhat runs. Restart Hardhat → must redeploy.

---

## 11. Where Is the Data Stored?

**Two locations:**

### 1. Blockchain (Hardhat / Ethereum)
- Transaction records (hashes, amounts, timestamps)
- Smart contract state (who got paid, total distributed)
- **Immutable** — can't be changed once recorded

### 2. Supabase (Cloud PostgreSQL Database)
- **Projects** — name, genre, status, contract address
- **Rights Holders** — name, role, wallet, percentage, total received
- **Transactions** — tx hash, amount, status, timestamps
- **Transaction Splits** — per-holder breakdown
- **Users** — login credentials, roles (admin/creator)

**Why both?** Blockchain = tamper-proof financial truth. Database = fast queries, user accounts, UI data.

---

## 12. How to Set Up and Run

### Prerequisites
- **Node.js** v18+ — [nodejs.org](https://nodejs.org)
- **MetaMask** (optional, for Live mode) — [metamask.io](https://metamask.io)

### Quick Start
```bash
# Install dependencies
npm install

# Start everything (blockchain + backend + frontend)
npm run dev
```
Open `http://localhost:3000` in your browser.

### First-Time Setup (seed the database)
```bash
npm run demo:full   # Compile + deploy contract + seed 5 projects
```

### MetaMask Config (Live Mode only)
1. MetaMask → Settings → Networks → Add Network
2. **Network Name:** Hardhat Localhost
3. **RPC URL:** `http://127.0.0.1:8545`
4. **Chain ID:** `31337`
5. **Currency:** ETH

> [!TIP]
> Hardhat mnemonic: `test test test test test test test test test test test junk`

---

## 13. Frequently Asked Questions

### 💰 "Does it cost real money?"
**No.** Hardhat uses completely fake ETH. You could distribute 10,000 ETH and it costs $0 in real life. Gas fees are also zero.

---

### 🔗 "Can I do real-world transactions?"
**Not in the current setup.** To go real, you would:
1. Deploy the contract to **real Ethereum** (or Polygon for lower fees)
2. Fund it with **real ETH** from an exchange
3. Pay **gas fees** ($0.50–$50 per transaction)

The code is architecturally ready — change the network config and deploy to mainnet.

---

### 📱 "Can I use MetaMask for free?"
**On Hardhat: YES, 100% free.** MetaMask is just an interface — it never charges you. The only costs are blockchain gas fees, and Hardhat has none.

**On real Ethereum:** You'd pay gas fees ($1–$5/tx). MetaMask itself is always free.

---

### 🔄 "What's Demo vs. Live mode?"

| | Demo Mode | Live Mode |
|---|---|---|
| Wallet | Local Hardhat accounts | Real browser wallet |
| Money | Fake test ETH | Real if on mainnet |
| Purpose | Testing & demos | Production use |

---

### 🔐 "Is the smart contract secure?"
Yes. Percentages must sum to exactly 100% or deployment fails. Uses integer math to avoid rounding errors. Once deployed, nobody can change the split rules.

---

### 🖥️ "What if I restart my computer?"
- Hardhat blockchain **resets** — must redeploy with `npm run demo:full`
- Database data **persists** (Supabase is cloud-hosted)

---

### 📊 "What do the charts show?"
- **Donut chart** — Revenue per project (global) or per transaction (project view)
- **Bar chart** — Revenue over time
- **Recent Activity** — Latest events
- **Top Holders** — Top 3 earners with percentages

---

## 14. Glossary

| Term | Meaning |
|---|---|
| **Blockchain** | Permanent, distributed digital ledger |
| **Smart Contract** | Self-executing program on the blockchain |
| **ETH (Ether)** | Ethereum's cryptocurrency |
| **Gas Fee** | Processing fee on real Ethereum (free on Hardhat) |
| **Wallet** | Digital account for crypto |
| **MetaMask** | Popular Ethereum wallet extension |
| **Hardhat** | Local blockchain simulator |
| **Chain ID** | Network identifier (31337 = Hardhat) |
| **Transaction Hash** | Unique receipt ID for blockchain transactions |
| **Basis Points** | Precision unit (1% = 100 bp, 100% = 10,000 bp) |
| **Deploy** | Publishing a contract to a blockchain |
| **Supabase** | Cloud database + auth service |
| **ABI** | Contract interface description |
| **Mnemonic** | 12-word phrase that generates wallet keys |
| **Wei** | Smallest ETH unit (1 ETH = 10¹⁸ Wei) |

---

*LUNIM — Creative Revenue & Rights Dashboard · Beginner's Guide v1.0 · May 2026*
