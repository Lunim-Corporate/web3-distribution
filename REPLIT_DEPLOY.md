# Deploy LUNIM to Repl.it

## Prerequisites

1. A **Repl.it** account
2. The following service credentials ready:
   - Supabase project URL + anon key + service role key
   - Privy App ID + App Secret
   - Alchemy API Key (Base Sepolia RPC)
   - Stripe test keys
   - A deployed `RevenueRights` contract on Base Sepolia

## Step 1: Fork from GitHub

1. Go to `https://github.com/jeevesh2515/web3-distribution`
2. Click **Fork** or **Import from GitHub** in Repl.it

## Step 2: Import into Repl.it

- Open Repl.it → **Create Repl** → **Import from GitHub**
- Paste: `https://github.com/jeevesh2515/web3-distribution`
- Repl.it will auto-detect the `.replit` and `replit.nix` config files

## Step 3: Set Environment Variables

In Repl.it, go to the **Secrets** (🔑) tab and add:

```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
NEXT_PUBLIC_PRIVY_APP_ID=<your-privy-app-id>
PRIVY_APP_SECRET=<your-privy-app-secret>
NEXT_PUBLIC_ALCHEMY_API_KEY=<your-alchemy-key>
NEXT_PUBLIC_BASE_SEPOLIA_RPC=https://base-sepolia.g.alchemy.com/v2/<your-key>
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_REVENUE_SPLITTER_ADDRESS=<deployed-contract-address>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<your-stripe-publishable-key>
STRIPE_SECRET_KEY=<your-stripe-secret-key>
NEXT_PUBLIC_ADMIN_LIVE_ADDRESS=<your-admin-wallet>
ADMIN_LIVE_ADDRESS=<your-admin-wallet>
```

## Step 4: Run

Repl.it will auto-start using the `.replit` config:
- **Run**: `npm run dev` (starts Next.js on port 3000)
- Or for production: `npm run build && npm run start`

## Step 5: Verify

Open the Repl.it URL and navigate to:
- `/` — Landing page
- `/login` — Login via Privy
- `/supabase-test` — DB connectivity check
- `/api/diagnostics` — System health (admin only)

## Demo Mode

The app has a built-in Demo Mode toggle in the navbar. This uses simulated data
for demonstration without requiring a live wallet or funded contract.

## Notes

- Hardhat local blockchain is **not available** on Repl.it.
- All on-chain interactions require a deployed contract on Base Sepolia.
- For a full demo without contract, use Demo Mode from the navbar.
