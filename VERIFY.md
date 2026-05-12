[x] GET /api/health returns 200 and JSON
[x] GET /api/projects returns all 7 LUNIM projects from Supabase
[x] GET /api/projects/:id returns project with rightsHolders array
[x] Supabase rights_holders rows are seeded with all 7 projects
[x] Connecting MetaMask to localhost:8545 works (no wrong network errors)
[x] Clicking "Distribute Revenue" calls contract.distributeRevenue()
[x] After tx broadcast, POST /api/transactions/initiate is called
[x] After tx.wait() confirms, POST /api/transactions/confirm is called
[x] Supabase transactions table gains a new row after each distribution
[x] Supabase transaction_splits table gains N rows (one per holder)
[x] rights_holders.total_received increments correctly after each tx
[x] projects.total_distributed increments correctly after each tx
[x] Dashboard re-fetches from Supabase after tx confirms
[x] TransactionHistory shows new tx without page refresh (Realtime)
[x] EditHolderModal saves to Supabase via PATCH /api/holders/:id
[x] No component renders hardcoded project or person data
[x] No instance of "LUNIM" exists anywhere in the codebase
[x] npm run dev starts chain + server + frontend with zero errors
[x] npm run demo:full compiles, deploys, and seeds in one command
