# Creative Rights Tracker - Setup & Deployment Guide

A modern web3-enabled dashboard for managing creative rights, revenue distribution, and smart contract payments.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MetaMask wallet (for Web3 features)
- Supabase project (database)
- .env.local configuration

### Installation

```bash
# 1. Clone and install
git clone https://github.com/Lunim-Corporate/web3-distribution.git
cd web3-distribution
npm install --legacy-peer-deps

# 2. Configure environment
cp .env.template .env.local
# Edit .env.local with your credentials:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - NEXT_PUBLIC_CHAIN_ID (31337 for local Hardhat, 1 for mainnet, 11155111 for Sepolia)
# - NEXT_PUBLIC_RPC_URL
# - NEXT_PUBLIC_REVENUE_SPLITTER_ADDRESS

# 3. Set up database (optional - for Supabase integration)
# Run SUPABASE_MIGRATIONS.sql in Supabase SQL Editor

# 4. Start development server
npm run dev
# Visit http://localhost:3000

# 5. Test with demo data
# Use the "Demo Setup" button to populate test accounts (Admin/Creator/Contributor)
```

---

## 📋 Environment Variables

Create `.env.local` file with required variables:

```env
# Supabase - Database & Auth
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGc...

# Web3 & Smart Contracts
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545  # Local Hardhat or Sepolia RPC
NEXT_PUBLIC_REVENUE_SPLITTER_ADDRESS=0x5FbD...  # Deployed contract address
NEXT_PUBLIC_CHAIN_ID=31337  # 31337 (local), 1 (mainnet), 11155111 (Sepolia)

# Optional: Alchemy API Key (for mainnet access)
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key
```

---

## 🏗️ Architecture Overview

### Core Stack
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Database**: Supabase (PostgreSQL) with real-time subscriptions
- **Web3**: Ethers.js v6, MetaMask wallet integration, Solidity smart contracts
- **Analytics**: Chart.js with react-chartjs-2
- **Auth**: Middleware-based route protection + localStorage

### Key Services

#### Authentication (`src/app/lib/auth.tsx`)
- Login/Signup with role-based access control (Admin, Creator, Contributor)
- User context available via `useAuth()` hook
- Middleware protects `/dashboard` and `/admin` routes

#### Database (`src/app/lib/database.ts`)
- Async CRUD functions: `getProjects()`, `createProject()`, `addContributor()`, etc.
- Real-time subscriptions for live updates
- Admin operations via `supabaseAdmin` (server-side)

#### Web3 Integration (`src/app/lib/web3.ts`)
- `RevenueSplitterService` class for smart contract interaction
- Methods: `getContractBalance()`, `releasePayments()`, `sendETHToContract()`
- Uses ethers.js with MetaMask provider

---

## 📦 Key Files & Components

### Pages
- `/dashboard` - Main dashboard with analytics and revenue tracking
- `/admin` - User management (admin only)
- `/project/[id]` - Project details and contributor management
- `/login` - Authentication page
- `/project-search` - Search and filter projects

### Dashboard Components
- **SmartContractPanel**: Wallet connection, contract balance, payment release
- **PaymentSplitter**: Calculate and display revenue splits
- **ChartsPanel**: Revenue analytics and visualizations
- **RecentActivity**: Audit trail and transaction logs
- **NotifyWidget**: Alerts for expiring rights and milestones
- **UpcomingMilestones**: Project timeline tracking
- **TraditionalContractsPanel**: Non-blockchain contract management

### Utilities
- `formatCurrency()` - Format amounts (default GBP)
- `calculatePaymentSplit()` - Calculate revenue distributions
- `truncateAddress()` - Format wallet addresses
- `formatDate()` - Date formatting with relative timestamps
- `cn()` - Tailwind class merging utility

---

## 🔧 Development Commands

```bash
# Development
npm run dev              # Start dev server (port 3000)

# Production
npm run build            # Build for production
npm start                # Start production server

# Linting
npm run lint             # Run ESLint checks
```

---

## 💾 Database Setup

### Migrations
Run the `SUPABASE_MIGRATIONS.sql` file in Supabase SQL Editor to create tables:
- `users` - User profiles and roles
- `projects` - Projects with metadata
- `project_contributors` - Revenue shares per contributor
- `payments` - Payment records
- `creative_rights` - Rights management
- `milestones` - Project milestones
- `activities` - Audit logs

### Tables
Each table includes timestamps (`created_at`, `updated_at`) for tracking.

---

## 🧪 Testing

### Demo Setup
1. Click "Demo Setup" button on dashboard
2. Creates test admin, creator, and contributor accounts
3. Populate mock data for development and testing

### Local Testing
- **Browser DevTools**: Check console for logs and network requests
- **Supabase Dashboard**: View live data in tables and SQL editor
- **MetaMask**: Switch networks and test transactions
- **Build Check**: `npm run build` to catch TypeScript errors early

---

## 🚀 Deployment

### Build for Production
```bash
npm run build            # Creates optimized build in .next/
npm start                # Test production build locally
```

### Deploy to Vercel
```bash
# Push to GitHub, connect repo to Vercel
# Vercel auto-detects Next.js and deploys
# Add environment variables in Vercel dashboard
```

### Deploy to Other Platforms
- **Netlify**: Supported (Next.js 14 compatible)
- **Docker**: Add Dockerfile for container deployment
- **AWS/Azure**: Use native Next.js deployment options

---

## 🐛 Troubleshooting

### Build Errors
- Run `npm run build` to identify TypeScript issues
- Check `.env.local` for missing variables
- Clear `.next` folder: `rm -rf .next && npm run build`

### Database Connection Issues
- Verify Supabase credentials in `.env.local`
- Check if migrations have been run
- Use Supabase Dashboard to verify table structure

### Wallet Connection Issues
- Ensure MetaMask is installed
- Verify chain ID matches `NEXT_PUBLIC_CHAIN_ID`
- Check RPC URL is accessible
- Restart MetaMask and try again

### Web3 Contract Errors
- Verify contract address in `.env.local`
- Ensure contract is deployed to the specified network
- Check ethers.js version compatibility (v6+)

---

## 📊 Features

✅ **Rights Management**: Track and manage creative rights with expiration dates
✅ **Revenue Distribution**: Automatic payment splitting based on contributor shares
✅ **Smart Contracts**: Deploy RevenueSplitter for blockchain payments
✅ **Analytics Dashboard**: Real-time revenue tracking and visualizations
✅ **Role-Based Access**: Admin, Creator, and Contributor roles
✅ **Wallet Integration**: MetaMask for secure Web3 transactions
✅ **Project Management**: Create projects, add contributors, track milestones
✅ **Audit Trail**: Complete activity logging for transparency

---

## 📝 License

MIT License - See LICENSE file for details

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'Add your feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Submit pull request

---

## 📞 Support

For issues, questions, or contributions, please visit the GitHub repository:
https://github.com/Lunim-Corporate/web3-distribution
