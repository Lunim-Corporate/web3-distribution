# LUNIM Web3 Distribution — Vercel Deployment Guide

## Current State

- **Repo**: `Lunim-Corporate/web3-distribution` (branch: `web3-freedom-upgrade`)
- **Vercel Project**: `web3-distribution` (linked via CLI)
- **Production URL**: https://web3-distribution.vercel.app
- **Deployed by**: `jeevesh2515` (personal Vercel account: `jeeveshs-projects-68cc441e`)

---

## Option A: Fork to Personal GitHub + Deploy from There

### When to choose this
- You want full control over deployments
- You're a contractor/employee and want to keep work isolated
- Lunim-Corporate doesn't grant Vercel org access

### Step 1: Fork the repo
1. Go to https://github.com/Lunim-Corporate/web3-distribution
2. Click **Fork** → select your personal GitHub account
3. Name it `web3-distribution` (or whatever you prefer)
4. **Important**: Uncheck "Copy the `web3-freedom-upgrade` branch only" — fork ALL branches

### Step 2: Add upstream remote (to pull future changes)
```bash
git remote add upstream https://github.com/Lunim-Corporate/web3-distribution.git
git fetch upstream
```

### Step 3: Push to your fork
```bash
git push origin web3-freedom-upgrade
```

### Step 4: Link Vercel to your fork
1. Go to https://vercel.com/dashboard
2. Click **Add New Project**
3. Import your fork: `<your-username>/web3-distribution`
4. Framework: **Next.js**
5. Root Directory: `./`
6. Install Command: `npm install --legacy-peer-deps`
7. Build Command: `npm run build`
8. Output Directory: `.next`

### Step 5: Set environment variables on Vercel
Go to **Settings → Environment Variables** and add:

| Variable | Value | Scope |
|----------|-------|-------|
| `NEXT_PUBLIC_PRIVY_APP_ID` | `cmp217w43000p0cie4kvln0y3` | Production |
| `PRIVY_APP_SECRET` | *(from .env.local)* | Production |
| `NEXT_PUBLIC_ALCHEMY_API_KEY` | *(from .env.local)* | Production |
| `NEXT_PUBLIC_ALCHEMY_POLICY_ID` | *(from .env.local)* | Production |
| `NEXT_PUBLIC_SUPABASE_URL` | *(from .env.local)* | Production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(from .env.local)* | Production |
| `SUPABASE_SERVICE_ROLE_KEY` | *(from .env.local)* | Production |
| `NEXT_PUBLIC_REVENUE_SPLITTER_ADDRESS` | *(from .env.local)* | Production |
| `NEXT_PUBLIC_CHAIN_ID` | `84532` | Production |
| `NEXT_PUBLIC_RPC_URL` | `https://sepolia.base.org` | Production |
| `JWT_SECRET` | *(from .env.local)* | Production |
| `STRIPE_SECRET_KEY` | *(from .env.local)* | Production |
| `STRIPE_PUBLISHABLE_KEY` | *(from .env.local)* | Production |
| `STRIPE_WEBHOOK_SECRET` | *(from .env.local)* | Production |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | *(from .env.local)* | Production |

Do **not** set `NEXT_PUBLIC_ENABLE_DEMO_ACCESS` in Production unless you intentionally want to publish the local sandbox/demo bypass.

> Copy values from your local `.env.local` file.

### Step 6: Deploy
```bash
vercel --prod
```
Or push to GitHub and let Vercel auto-deploy.

### Keeping fork updated
```bash
git fetch upstream
git merge upstream/web3-freedom-upgrade
git push origin web3-freedom-upgrade
```

---

## Option B: Link Vercel Directly to Lunim-Corporate Repo (Recommended)

### When to choose this
- You have admin access to Lunim-Corporate org
- Team wants a single source of truth
- Simpler setup, no fork maintenance

### Step 1: Authorize Vercel GitHub access
1. Go to https://vercel.com/teams/jeeveshs-projects-68cc441e/settings/git
2. Click **Connect GitHub**
3. Authorize Vercel for the `Lunim-Corporate` org
4. Select the `web3-distribution` repo

### Step 2: Link project to repo
1. Go to https://vercel.com/jeeveshs-projects-68cc441e/web3-distribution/settings/git
2. Click **Connect Repository**
3. Select `Lunim-Corporate/web3-distribution`
4. Branch: `web3-freedom-upgrade`

### Step 3: Set environment variables
Same as Option A, Step 5 — go to **Settings → Environment Variables** and add all vars.

### Step 4: Deploy
Push to `web3-freedom-upgrade` branch → Vercel auto-deploys.

Or manually:
```bash
vercel --prod
```

---

## Verification After Deployment

1. Visit https://web3-distribution.vercel.app
2. Check these pages load without errors:
   - `/` (home)
   - `/login`
   - `/signup`
   - `/dashboard`
   - `/web3-demo`
3. Open browser console — no Privy/Wagmi errors
4. Test login flow with email

---

## Troubleshooting

### "Cannot initialize Privy provider" error
- Ensure `NEXT_PUBLIC_PRIVY_APP_ID` is set in Vercel env vars (Production scope)
- This was fixed with dynamic imports in `layout.tsx` — should not recur

### Build fails with peer dependency errors
- Install command must be: `npm install --legacy-peer-deps`
- This is required by Privy/wagmi peer dep conflicts

### Environment variables not loading
- Ensure vars are set to **Production** scope (not just Preview)
- `NEXT_PUBLIC_*` vars are inlined at build time — must be set before deploy

### Vercel CLI deploy hangs
- Run with `--yes` flag: `vercel --prod --yes`
- Or deploy via GitHub push (auto-deploy)

---

## Key Files

| File | Purpose |
|------|---------|
| `.env.local` | Local dev env vars (DO NOT commit) |
| `.env.example` | Template for env vars |
| `vercel.json` | Vercel config (install command, framework) |
| `.vercelignore` | Excludes `.env*` from Vercel upload |
| `AGENTS.md` | Agent guidance for this repo |
| `src/app/layout.tsx` | Root layout with dynamic imports |
| `src/app/lib/web3/providers.tsx` | Privy/Wagmi provider setup |

---

## Notes

- `npm audit` shows 107 vulnerabilities (transitive deps of Privy/wagmi/MetaMask) — cannot fix without major version upgrades
- `npm run build` = lint + typecheck + static generation — use as primary verification
- Hardhat tests (`npx hardhat test`) run locally only, not on Vercel
- No frontend tests exist (no Jest/Vitest/Playwright)
