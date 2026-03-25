# Creative Rights Tracker - Quick Reference Guide

## 🚀 Quick Start (2 minutes)

```bash
# 1. Install
npm install --legacy-peer-deps

# 2. Configure
cp .env.template .env.local
# Edit .env.local with your values

# 3. Run
npm run dev
```

Visit `http://localhost:3000` → Click "Demo Setup" button → Done! ✅

---

## 📚 Documentation Index

| Document | Purpose | Read Time |
|----------|---------|-----------|
| [README.md](README.md) | Project overview & quick start | 3 min |
| [SETUP.md](SETUP.md) | Complete setup & deployment guide | 10 min |
| [.env.template](.env.template) | Environment variable reference | 3 min |
| [.github/copilot-instructions.md](.github/copilot-instructions.md) | AI agent developer guide | 5 min |
| [PROJECT_STATUS.md](PROJECT_STATUS.md) | Detailed status & metrics | 5 min |
| [VERIFICATION_CHECKLIST.md](VERIFICATION_CHECKLIST.md) | Final QA checklist | 3 min |
| [COMPLETION_REPORT.md](COMPLETION_REPORT.md) | Project completion summary | 5 min |
| [CHANGELOG.md](CHANGELOG.md) | What changed & why | 5 min |

---

## 🛠️ Common Commands

```bash
# Development
npm run dev              # Start dev server (localhost:3000)
npm run build            # Create production build
npm run start            # Run production build
npm run lint             # Check for errors

# Database (Supabase)
# Run SUPABASE_MIGRATIONS.sql in Supabase SQL Editor
# Tables: users, projects, project_contributors, payments, etc.

# Testing
# Click "Demo Setup" button in app to populate test data
```

---

## 📂 Project Structure

```
src/
├── app/
│   ├── api/            # API routes (projects, payments, etc.)
│   ├── components/     # React components
│   │   ├── dashboard/  # 10 dashboard widgets
│   │   └── ui/         # Reusable UI components
│   ├── lib/            # Core services (auth, db, web3)
│   ├── pages/          # Next.js routes
│   └── data/           # Mock data
```

---

## 🔐 Key Services

| Service | File | Purpose |
|---------|------|---------|
| **Auth** | `lib/auth.tsx` | User authentication & RBAC |
| **Database** | `lib/database.ts` | Supabase CRUD operations |
| **Web3** | `lib/web3.ts` | Smart contract interaction |
| **Wallet** | `lib/wallet.tsx` | MetaMask integration |
| **Utils** | `lib/utils.ts` | Formatting & calculations |

---

## 🎯 Common Tasks

### Add a New Page
1. Create file in `src/app/[name]/page.tsx`
2. Import components and use them
3. Add route protection in `middleware.ts` if needed

### Add a Dashboard Widget
1. Create component in `src/app/components/dashboard/`
2. Import UI components from `src/app/components/ui/`
3. Use hooks: `useAuth()`, `useWallet()`, etc.

### Connect to Database
1. Use functions from `src/app/lib/database.ts`
2. Example: `const projects = await getProjects();`
3. For real-time: Use Supabase subscriptions

### Call Smart Contract
1. Import `revenueSplitterService` from `src/app/lib/web3.ts`
2. Example: `await revenueSplitterService.getContractBalance();`

---

## 🔧 Environment Variables

Required variables in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public API key
- `SUPABASE_SERVICE_ROLE_KEY` - Admin access key
- `NEXT_PUBLIC_RPC_URL` - Blockchain RPC endpoint
- `NEXT_PUBLIC_REVENUE_SPLITTER_ADDRESS` - Contract address
- `NEXT_PUBLIC_CHAIN_ID` - Network ID (31337 for local)

See `.env.template` for detailed explanations.

---

## 🧪 Testing Features

### Demo Setup
1. Click "Demo Setup" button on login/dashboard
2. Creates test accounts: admin, creator, contributor
3. Populates sample projects and revenue data

### Manual Testing
- Use browser DevTools (F12) for network inspection
- Supabase Dashboard for database verification
- MetaMask for wallet testing

### Build Verification
```bash
npm run build            # Verify production build
npm run lint             # Check for TypeScript errors
```

---

## 🚀 Deployment

### Quick Deploy to Vercel
```bash
# 1. Push to GitHub
git push origin main

# 2. Connect GitHub to Vercel
# Visit https://vercel.com and connect your repo

# 3. Add environment variables in Vercel dashboard
# Copy values from .env.template

# 4. Deploy automatically
# Vercel deploys on every git push
```

### Deploy Elsewhere
See [SETUP.md](SETUP.md) for Netlify, Docker, AWS, Azure options.

---

## 🐛 Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

### Wallet Won't Connect
- Verify MetaMask is installed
- Check chain ID in .env.local
- Ensure RPC URL is accessible
- Restart MetaMask

### Database Connection Issues
- Verify Supabase credentials
- Run SUPABASE_MIGRATIONS.sql
- Check Supabase Dashboard

### TypeScript Errors
```bash
npm run lint             # See all errors
npm run build            # Full build check
```

---

## 📊 Architecture at a Glance

```
Browser → Next.js App → API Routes → Supabase (DB)
              ↓
          Components → Services → External APIs
              ↓
          MetaMask → Smart Contracts → Blockchain
```

---

## ✅ Quality Checklist

Before deploying:
- [ ] `npm run build` succeeds
- [ ] `npm run lint` shows no errors
- [ ] `.env.local` configured
- [ ] Database migrations run
- [ ] Smart contract deployed
- [ ] Features tested in dev

---

## 📞 Help & Resources

- **Setup Issues**: See [SETUP.md](SETUP.md)
- **Developer Guide**: See [.github/copilot-instructions.md](.github/copilot-instructions.md)
- **Project Status**: See [PROJECT_STATUS.md](PROJECT_STATUS.md)
- **Error Reference**: See [CHANGELOG.md](CHANGELOG.md)

---

## 🎯 Key Statistics

| Metric | Value |
|--------|-------|
| Build Time | ~25 seconds |
| Bundle Size | 286 KB |
| Routes | 17 |
| Components | 30+ |
| API Endpoints | 7 |
| Database Tables | 7 |
| Dependencies | 15 |

---

## ⭐ Features

✅ Rights Management | ✅ Payment Splitting  
✅ Smart Contracts | ✅ Real-time Analytics  
✅ Wallet Integration | ✅ Project Tracking  
✅ Audit Logs | ✅ Role-based Access  

---

**Need Help?** Start with [SETUP.md](SETUP.md)  
**Deploying?** See "Deployment" section above  
**Developing?** Check [.github/copilot-instructions.md](.github/copilot-instructions.md)

---

Last Updated: January 16, 2026 ✅
