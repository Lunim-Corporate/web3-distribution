# Workspace Instructions — Creative Rights Tracker
**Copilot & AI Agent Productivity Guide**

---

## Quick Reference

| Task | Command | Time |
|------|---------|------|
| Start dev server | `npm run dev` | 5-10s |
| Run production build | `npm run build` | 20-30s |
| Lint & fix code | `npm run lint -- --fix` | 5s |
| Check TypeScript | `npx tsc --noEmit` | 10s |

**Dev Server URL**: http://localhost:3000

---

## Initial Setup for Development

### Prerequisites
```bash
Node.js ≥18.0
npm ≥9.0
```

### Quick Start
```bash
npm install --legacy-peer-deps    # (required: eslint@8.45.0 ↔ eslint-config-next@16)
npm run dev                         # Dev server at http://localhost:3000
```

### Environment Setup (.env.local)
```env
# Supabase Configuration (Required for database features)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLC...
SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLC...

# Web3 Configuration (Optional: enable smart contracts)
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545              # Local Hardhat node
NEXT_PUBLIC_REVENUE_SPLITTER_ADDRESS=0x5FbD...78aB     # Deployed contract
NEXT_PUBLIC_CHAIN_ID=31337                               # 31337=Hardhat, 1=Mainnet, 11155111=Sepolia

# Optional: Analytics & Blockchain APIs
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_api_key
```

**Note**: Demo features work without `.env.local` (uses in-memory mock data). Full functionality requires Supabase credentials.

---

## Architecture Overview

### Directory Structure
```
src/app/
├── api/                    # Next.js API routes (server-side)
│   ├── projects/          # Project CRUD endpoints
│   ├── payments/          # Payment processing
│   ├── revenue/           # Revenue tracking
│   ├── rights/            # Creative rights management
│   ├── milestones/        # Project milestones
│   └── diagnostics/       # Health check & debugging
├── components/
│   ├── ui/                # Reusable UI lib (Button, Card, Badge, etc.)
│   └── dashboard/         # Dashboard widgets (Charts, Payment Splitter, etc.)
├── lib/
│   ├── auth.tsx           # Auth context + useAuth hook
│   ├── database.ts        # Supabase CRUD functions
│   ├── types.ts           # TypeScript interfaces (User, Project, Revenue, etc.)
│   ├── utils.ts           # Formatting & helpers (formatCurrency, cn(), etc.)
│   ├── wallet.tsx         # Web3 wallet provider + useWallet hook
│   ├── web3.ts            # RevenueSplitterService (smart contract interface)
│   ├── supabaseClient.ts  # Client-side Supabase instance (RLS applied)
│   └── supabaseServer.ts  # Server-side admin Supabase (permissions bypassed)
├── (routes)/              # Next.js App Router pages
│   ├── login/
│   ├── dashboard/
│   ├── admin/
│   └── project/[id]/
├── globals.css            # Tailwind directives
└── layout.tsx             # Root layout + providers
```

### Key Patterns & Conventions

**1. Authentication (React Context)**
```typescript
// Usage everywhere:
const { user, login, logout, connectUserWallet } = useAuth();

// Internal: stored in localStorage + middleware cookies
// Roles: 'admin' | 'creator' | 'contributor'
```

**2. UI Component Styling**
```typescript
// All UI components use `cn()` utility (clsx + tailwind-merge):
import { cn } from '@/lib/utils';

export const Button: React.FC<ButtonProps> = ({ variant, className, ...props }) => (
  <button className={cn(baseStyles, variantStyles[variant], className)} {...props} />
);
```

**3. Database Operations (Supabase)**
```typescript
// All functions in lib/database.ts are async:
const projects = await getProjects();

// Auto-distribution on payment:
await recordPayment(projectId, amount); // Splits $ to contributors automatically
```

**4. API Route Pattern**
```typescript
export async function GET(req, { params }) {
  try {
    const data = await supabaseAdmin.from('table').select('*');
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
```

**5. Web3 Integration**
```typescript
// Smart contract interaction via RevenueSplitterService:
const { connectUserWallet } = useAuth();
const address = await connectUserWallet();
const balance = await revenueSplitterService.getBalance();
```

---

## Common Development Tasks

### Adding a New Feature
1. **Define types** in `src/app/lib/types.ts` (e.g., `interface NewFeature { ... }`)
2. **Create API endpoint** in `src/app/api/newfeature/route.ts`
3. **Add database function** in `src/app/lib/database.ts` (async CRUD wrapper)
4. **Build UI component** in `src/app/components/` using existing UI lib
5. **Add to dashboard** in `src/app/dashboard/page.tsx` or nested route
6. **Test**: `npm run dev` → browser → check console for errors

### Adding a UI Component
```typescript
// File: src/app/components/ui/NewComponent.tsx
import { cn } from '@/lib/utils';
import type { ComponentProps } from 'react';

export interface NewComponentProps extends ComponentProps<'div'> {
  variant?: 'primary' | 'secondary';
}

export const NewComponent: React.FC<NewComponentProps> = ({ 
  variant = 'primary', 
  className, 
  ...props 
}) => (
  <div className={cn(
    'base-styles',
    variant === 'primary' && 'primary-styles',
    className
  )} {...props} />
);
```

### Fixing Type Errors
```bash
npx tsc --noEmit                    # Show all type errors
npm run lint -- --fix              # Auto-fix ESLint issues (whitespace, imports)
```

### Debugging in Browser
1. Open http://localhost:3000
2. **Chrome DevTools** → Console → check for errors
3. **React DevTools** → Components tab → inspect component state
4. **Application** → LocalStorage → view `crt_user` (auth state)

---

## Critical Gotchas & Troubleshooting

### 1. **Module Resolution**
**Problem**: `Cannot find module '@/...'`  
**Fix**: Path alias `@/` maps to `./src/app/` (see `tsconfig.json`). Restart dev server if not resolving.

### 2. **Middleware Cookie Parsing**
**Problem**: Route protection fails silently  
**Fix**: Always wrap `JSON.parse()` in try-catch:
```typescript
try {
  const user = JSON.parse(decodeURIComponent(userCookie.value));
} catch (e) {
  // User cookie invalid/expired
}
```

### 3. **Database Schema Mismatch**
**Problem**: `milestones.target_date` not found  
**Fix**: Schema uses `date` (not `target_date`). Run `SUPABASE_MIGRATIONS.sql` to sync.

### 4. **Supabase RLS (Row-Level Security)**
**Problem**: Query returns `null` or `403 Unauthorized`  
**Fix**: 
- **Client queries** apply RLS (use `supabaseClient`)
- **Admin queries** bypass RLS (use `supabaseAdmin`, server-side only)
- Check Supabase policies in Dashboard → Authentication → Policies

### 5. **Web3 RPC Connection**
**Problem**: Contract calls fail with "network mismatch"  
**Fix**: Verify `.env.local`:
```env
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545      # Must match running Hardhat node
NEXT_PUBLIC_CHAIN_ID=31337                      # 31337 for local Hardhat
```

### 6. **ESLint Peer Dependency Conflict**
**Problem**: `npm install` fails with ERESOLVE  
**Fix**: Use `npm install --legacy-peer-deps` (eslint@8.45 ↔ eslint-config-next@16)

### 7. **Dark Mode Hydration Mismatch**
**Problem**: Theme flickers on page load  
**Fix**: Restore theme in `useEffect` from localStorage (not in render):
```typescript
useEffect(() => {
  const saved = localStorage.getItem('theme');
  if (saved) document.documentElement.classList.toggle('dark', saved === 'dark');
}, []);
```

### 8. **Live Currency Formatting**
**Problem**: Amounts show wrong currency or decimal places  
**Fix**: `formatCurrency()` defaults to GBP (en-GB locale). Override:
```typescript
formatCurrency(amount, 'USD')  // Use different locale
```

---

## Testing & Debugging Workflows

### Login Credentials (Demo)
```
Admin:       admin@isidio.com / admin123
Creator:     creator@isidio.com / creator123
Contributor: contributor@isidio.com / contributor123
Pre-filled:  jeevesh039@gmail.com / admin123
```

### Demo Features (No .env.local needed)
- ✅ Login/logout
- ✅ Dashboard analytics with generated revenue data
- ✅ Project listing & details
- ✅ Payment splitting simulation
- ✅ Smart contract UI (mock wallet balance)
- ✅ Admin panel (user list)
- ❌ Database persistence (uses in-memory demos)
- ❌ Real Web3 transactions (mock only)

### Full Features (Requires .env.local + Supabase)
- ✅ Database persistence
- ✅ Real Supabase queries
- ✅ Actual payment distribution
- ✅ Real-time subscriptions

### Checking Build Status
```bash
npm run build                   # Full production build
echo $?                        # 0 = success, non-zero = error
npm run lint                   # Static analysis
npx tsc --noEmit              # Type checking
```

---

## Performance Considerations

### Optimization Strategies
| Issue | Solution |
|-------|----------|
| Large data sets | Paginate with Supabase `.range(0, 100)` |
| Real-time lag | Use Supabase subscriptions instead of polling |
| Chart render delay | Memoize data aggregation with `useMemo` |
| Image optimization | Use `<Image />` from `next/image` (not `<img>`) |
| Bundle size | Code-split heavy libraries (Chart.js, jsPDF) dynamically |

---

## Security Best Practices

### Authentication & Authorization
- ✅ Use `useAuth()` hook (check `user?.role` before admin ops)
- ✅ Verify role in API routes (use `supabaseAdmin` for data, validate on client)
- ❌ Never trust client-side role checks alone
- ❌ Don't hardcode secrets in `.env.local`; use `.env.local.example` template

### Web3 Security
- ✅ Validate contract address before interacting
- ✅ Check wallet `chainId` matches `NEXT_PUBLIC_CHAIN_ID`
- ✅ Use `contractABI` validation before calling functions
- ❌ Don't expose private keys or service endpoints in client code

### Database Security
- ✅ Use RLS policies to restrict data access per user
- ✅ Use `supabaseAdmin` only for server-side operations
- ✅ Validate/sanitize user input before DB queries
- ❌ Never query without filters (always `.eq()` or `.match()`)
- ❌ Don't log sensitive data (passwords, API keys)

---

## Recommended Agent Workflows

### Workflow 1: Adding a New Dashboard Widget
```
1. Read: src/app/lib/types.ts (understand data model)
2. Decide: UI component location (src/app/components/dashboard/)
3. Create: Component file with demo data fallback
4. Add: To src/app/dashboard/page.tsx
5. Test: npm run dev → check visual & console errors
6. Lint: npm run lint -- --fix
```

### Workflow 2: Fixing TypeScript Errors
```
1. Run: npx tsc --noEmit (list all errors)
2. Group: errors by file & type
3. Fix: 
   - unknown types → add interfaces to types.ts
   - missing properties → ensure data shape matches
   - undefined access → use optional chaining (?.)
4. Verify: npx tsc --noEmit (should be 0 errors)
5. Build: npm run build (final check)
```

### Workflow 3: Adding Database Feature
```
1. Update: Supabase schema (SQL migration)
2. Add type: src/app/lib/types.ts
3. Add CRUD: src/app/lib/database.ts
4. Add endpoint: src/app/api/feature/route.ts
5. Create component: src/app/components/FeatureWidget.tsx
6. Test: Demo with mock data, then .env.local with real Supabase
```

### Workflow 4: Debugging Production Build Issue
```
1. npm run build (check errors)
2. npm run lint (check ESLint)
3. npx tsc --noEmit (check types)
4. Read error → file:line reference
5. Fix → re-run build
6. If hydration issue → check useEffect (client-side only code)
7. If missing .env vars → add to .env.local
```

---

## Agent Anti-Patterns (Avoid These!)

| Anti-Pattern | Why Bad | Better Way |
|--------------|---------|-----------|
| Hardcoding `localhost:3000` in code | Breaks in production | Use `process.env.NEXT_PUBLIC_*` or `window.location` |
| Fetching from `window.ethereum` without guard | Breaks on server-side render | Guard with `typeof window !== 'undefined'` |
| Using `any` type everywhere | Breaks TypeScript safety | Define exact types in types.ts |
| Querying all data (no `.select()` filter) | Huge performance cost | `.select('id, name')` to limit columns |
| Calling `recordPayment()` in UI directly | Breaks privacy | Use API route → `supabaseAdmin` only |
| Storing secrets in `.env` (not `.env.local`) | Exposed in version control | Add `.env` to `.gitignore` |
| Building without `--legacy-peer-deps` | Dependency conflicts | Always use `npm install --legacy-peer-deps` |

---

## Links & References

**Primary Documentation**:
- [.github/copilot-instructions.md](./.github/copilot-instructions.md) — Comprehensive project guide
- [src/app/lib/types.ts](../src/app/lib/types.ts) — All TypeScript interfaces
- [SUPABASE_MIGRATIONS.sql](../SUPABASE_MIGRATIONS.sql) — Database schema

**Key Files** (exemplar patterns):
- [src/app/lib/auth.tsx](../src/app/lib/auth.tsx) — React Context + localStorage sync
- [src/app/lib/database.ts](../src/app/lib/database.ts) — Supabase CRUD + auto-distribution
- [src/app/components/ui/Button.tsx](../src/app/components/ui/Button.tsx) — Variant styling pattern
- [src/app/api/projects/route.ts](../src/app/api/projects/route.ts) — API error handling

**External Resources**:
- [Next.js 14 App Router](https://nextjs.org/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Ethers.js v6](https://docs.ethers.org/v6/)
- [Chart.js Documentation](https://www.chartjs.org/docs/latest/)

---

## Maintenance & Health Checks

### Weekly
- [ ] Run `npm run lint` → fix warnings
- [ ] Check browser console for client errors
- [ ] Verify database connection in Supabase Dashboard

### Before Deployment
- [ ] `npm run build` succeeds
- [ ] `npx tsc --noEmit` returns 0 errors
- [ ] `npm run lint` passes
- [ ] All `.env.local` variables set correctly
- [ ] Test login flow with demo user

### Common CI/CD Checks
```bash
npm install --legacy-peer-deps
npm run lint
npx tsc --noEmit
npm run build
```

---

**Last Updated**: 25 March 2026  
**Status**: ✅ Production Ready (Build succeeds, dev server runs, all features integrated)
