# Creative Rights Tracker - Production Ready

> A lightweight, multi-page Next.js 14 web3-enabled dashboard for managing creative rights and automating revenue distribution.

**Version:** 1.0.0  
**Status:** ✅ **PRODUCTION READY** - Build succeeds, all pages optimized, database schema finalized

---

## 🎯 Quick Overview

This is a **fully functional revenue and rights tracking system** with:

| Feature | Status | Details |
|---------|--------|---------|
| **Project Management** | ✅ | Create, edit, and track creative projects |
| **Revenue Tracking** | ✅ | Record payments, automatic contributor distribution (GBP) |
| **Rights Management** | ✅ | Track creative rights with expiration dates |
| **Analytics** | ✅ | Monthly trends, contributor earnings, project summaries |
| **Role Based Access** | ✅ | Admin, Creator, Contributor roles with middleware protection |
| **Wallet Integration** | ✅ | MetaMask connection (optional) |
| **Database** | ✅ | PostgreSQL (Supabase) with 8 tables + 3 analytics views |
| **Charts & Reports** | ✅ | Interactive Line/Doughnut charts, PDF export |

---

## 📋 Pages & Routes

```
/                      Home page (public) - redirects to dashboard or login
/login                 User authentication
/signup                User registration  
/dashboard             Main dashboard with all widgets
/admin                 Admin panel (user management) - Admin only
/project/[id]          Individual project details and management
```

**Removed (Optimized):** `/status`, `/project-search` - consolidated into dashboard

---

## 🗄️ Database Schema (PostgreSQL/Supabase)

### ✅ 8 Core Tables

| Table | Purpose | Records |
|-------|---------|---------|
| `users` | User accounts and wallets | Admin, Creators, Contributors |
| `projects` | Creative projects | Projects with revenue tracking |
| `project_contributors` | Team members per project | Revenue share allocation |
| `payments` | All financial transactions | Payment records with status |
| `creative_rights` | Intellectual property rights | Rights ownership and splits |
| `milestones` | Project goals/deadlines | Trackable milestones |
| `activities` | Audit trail | All system actions logged |
| `distribution_history` | Payment distribution records | Auto-split tracking |

### ✅ 3 Analytics Views

| View | Query For |
|------|-----------|
| `project_revenue_summary` | Total revenue, contributor count, rights per project |
| `contributor_earnings` | Total earned, pending payments, projects involved |
| `monthly_revenue_trend` | Monthly revenue by project with transaction counts |

---

## ⚡ Tech Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript
- **Styling:** Tailwind CSS + Custom Components
- **Charts:** Chart.js + react-chartjs-2
- **Database:** Supabase (PostgreSQL)
- **Web3:** Ethers.js v6 + MetaMask (optional)
- **Utilities:** Zod, Clsx, Tailwind-merge, jsPDF (for exports)
- **Notifications:** React Hot Toast

---

## 🚀 Get Started in 3 Steps

### Step 1: Setup Database (5 minutes)

Copy each SQL section from `SUPABASE_FINAL_MIGRATIONS.sql` into Supabase SQL Editor:

```bash
# File locations:
- SUPABASE_FINAL_MIGRATIONS.sql (complete schema)
- SETUP_GUIDE.md (step-by-step instructions)
```

### Step 2: Configure Environment

Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

### Step 3: Run Application

```bash
npm install
npm run dev      # Development
npm run build    # Production build
npm run lint     # TypeScript check
```

---

## 🔑 Key Features Explained

### 1. **Automatic Payment Distribution**

When you record a payment → system automatically splits it to all contributors based on revenue shares:

```
recordPayment($10,000)
↓
Artist (60%) → $6,000
Producer (40%) → $4,000
```

**Code:** `src/app/lib/database.ts` - `recordPayment()` function

### 2. **Multi-Currency Support (GBP)**

All amounts stored in **CENTS** to avoid floating-point errors:

```
Display: £100.00
Database: 10000 (cents)
Calculation: 10000 / 100 = £100.00
```

**Utilities:** `src/app/lib/utils.ts` - `formatCurrency()`

### 3. **Real-Time Analytics Widgets**

Dashboard displays:
- **Charts Panel:** 6/12 month trends + source breakdown (with demo fallback)
- **Revenue Snapshot:** Total revenue, last payment, pending payments
- **Upcoming Milestones:** Project timeline
- **Recent Activity:** Audit trail
- **Notify Widget:** Rights expiration alerts
- **Payment Splitter:** Test revenue distribution

### 4. **Role-Based Access Control**

```
Admin       → All features + user management
Creator     → Create projects, manage contributors, track revenue
Contributor → View assigned projects, see earnings
```

**Protection:** `middleware.ts` validates cookie + role on protected routes

### 5. **Smart Contract Integration (Optional)**

- MetaMask wallet connection
- Blockchain payment support
- Contract deployment ready

---

## 📁 Code Organization

```
src/app/
├── lib/                 # Core business logic
│   ├── auth.tsx        # User authentication & wallet connection
│   ├── database.ts     # All Supabase queries
│   ├── types.ts        # TypeScript interfaces
│   ├── utils.ts        # Formatting (currency, dates, etc.)
│   └── supabaseClient.ts
├── api/                # Backend endpoints
│   ├── /projects       # GET/POST projects
│   ├── /revenue        # GET revenue data
│   ├── /payments       # POST payments (triggers auto-distribution)
│   ├── /rights         # GET/POST creative rights
│   └── /milestones     # GET/POST milestones
├── components/
│   ├── dashboard/      # Dashboard widgets
│   │   ├── ChartsPanel.tsx          # Revenue analytics
│   │   ├── PaymentSplitter.tsx      # Test distributions
│   │   ├── RecentActivity.tsx       # Audit trails
│   │   ├── RevenueSnapshot.tsx      # Summary stats
│   │   ├── SmartContractPanel.tsx   # Web3 integration
│   │   └── 6 more widgets...
│   └── ui/             # Reusable UI components
├── (pages)
│   ├── /dashboard      # Main dashboard
│   ├── /login          # Authentication
│   ├── /admin          # User management (admin only)
│   ├── /project/[id]   # Project detail
│   └── /signup         # Registration
└── layout.tsx          # Root layout with providers
```

---

## 🔑 Core Patterns

### Adding a New Feature

1. **Define Data Structure** → Add to `src/app/lib/types.ts`
2. **Create API Endpoint** → Create `src/app/api/[feature]/route.ts`
3. **Add Database Function** → Add function to `src/app/lib/database.ts`
4. **Build UI Component** → Create `src/app/components/dashboard/[Feature].tsx`
5. **Add to Dashboard** → Import in `src/app/dashboard/page.tsx`

### Payment Recording Example

```typescript
// 1. User submits payment form in UI
// 2. Calls: POST /api/payments with amount & project_id
// 3. API calls: recordPayment() in database.ts
// 4. Function automatically:
//    - Creates payment record
//    - Updates project total_revenue
//    - Splits amount to project_contributors
//    - Logs activity for audit trail
// 5. Response returned to UI for confirmation
```

---

## 📊 Database Queries

### Common Queries You Might Need

```sql
-- Get project revenue by month
SELECT * FROM monthly_revenue_trend 
WHERE project_id = 'abc-123' 
ORDER BY month DESC;

-- Get contributor earnings summary
SELECT * FROM contributor_earnings 
WHERE id = 'user-id';

-- Get project overview
SELECT * FROM project_revenue_summary 
WHERE id = 'project-id';

-- Get all activities for audit
SELECT * FROM activities 
WHERE project_id = 'project-id' 
ORDER BY created_at DESC;
```

---

## ✅ Optimization Checklist

- ✅ Removed 2 unnecessary pages (`/status`, `/project-search`)
- ✅ Fixed build errors (removed conflicting web3-distribution-dev_emma)
- ✅ Created comprehensive database schema with 8 tables + 3 views
- ✅ Implemented auto-payment distribution
- ✅ Set currency to GBP with proper formatting
- ✅ Added timezone handling for timestamps
- ✅ Created indexes on frequently queried columns
- ✅ Added UNIQUE constraints on project_contributors
- ✅ Implemented proper foreign key relationships
- ✅ Total bundle size: ~87KB shared JS + page-specific code

---

## 🧪 Testing the Application

### Using Demo Login

1. Go to `/login`
2. **Email:** `admin@example.com`
3. **Password:** `password123`
4. Dashboard loads with demo data

### Using DemoSetup Component

- Located in `/dashboard` page
- Click "Load Demo Data" button
- Pre-seeds projects, contributors, payments

### API Testing

```bash
# Get all projects
curl http://localhost:3000/api/projects

# Get revenue data
curl http://localhost:3000/api/revenue

# Get user list
curl http://localhost:3000/api/users
```

---

## 📖 File Locations Reference

| What You Need | Where to Find It |
|---------------|------------------|
| Database setup | `SUPABASE_FINAL_MIGRATIONS.sql` + `SETUP_GUIDE.md` |
| Type definitions | `src/app/lib/types.ts` |
| Database functions | `src/app/lib/database.ts` |
| API endpoints | `src/app/api/*/route.ts` |
| UI components | `src/app/components/ui/*.tsx` |
| Dashboard widgets | `src/app/components/dashboard/*.tsx` |
| Auth logic | `src/app/lib/auth.tsx` |
| Formatting utilities | `src/app/lib/utils.ts` |
| Environment config | `.env.local` |

---

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Table does not exist" | Run SUPABASE_FINAL_MIGRATIONS.sql sections 1-8 |
| "Cannot find module" | Check import paths and `tsconfig.json` |
| "Supabase connection failed" | Verify `.env.local` credentials |
| "Build failing" | Run `npm install` then `npm run build` |
| "Dev server CORs error" | Check Supabase RLS policies if enabled |

---

## 📞 Next Steps

### To Deploy:
1. Build: `npm run build`
2. Deploy to Vercel/Railway/similar
3. Set environment variables on platform
4. Done!

### To Add Features:
1. Follow the pattern in "Adding a New Feature" section
2. Run `npm run lint` to catch errors
3. Test locally with `npm run dev`
4. Build with `npm run build` before committing

### To Customize:
1. **Styling:** Edit Tailwind classes in components
2. **Charts:** Modify `ChartsPanel.tsx` Chart.js options
3. **Database:** Add columns via Supabase migrations
4. **APIs:** Add new endpoints in `src/app/api/`

---

## 📜 License

Creative Rights Tracker - 2026

---

**Last Updated:** March 23, 2026  
**Build Status:** ✅ Production Ready  
**Pages:** 6 routes optimized  
**Database:** 8 tables + 3 views  
**Bundle Size:** ~87KB core JS  
