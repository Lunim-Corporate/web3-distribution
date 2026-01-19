# Creative Rights & Revenue Tracker - Manual Flow Checklist

- Not logged in: visiting `/admin/*`, `/creator/*`, `/contributor/*`, or `/dashboard` redirects to `/login?reason=not_logged_in`.
- Logged in but wrong role: visiting a forbidden dashboard route redirects to `/unauthorized` and shows "Logged in but not authorized."
- MetaMask: any authenticated user opening `/admin/*`, `/creator/*`, or `/contributor/*` can click "Connect Wallet" (no auto-connect).
- Creator flow: create work -> add contributors with split percentages + wallets -> top up -> distribute; distribution blocked if contributors missing.
- Contributor access: visiting `/contributor/revenue?projectId=<id>` for a non-assigned project shows "Not authorized."
- Refresh after top-up/distribute: records still display on `/creator/topup` and `/admin/revenue`.
- Contributor wallet balance increases after distribute (or token balance if applicable).
- Admin revenue page shows the same topups/distributions/items after hard refresh.
- Verify database file exists at `data/app.db` after top-up/distribute.
- Contributor payout remains visible after hard refresh.
