# PLAN-3.3: Production Polish & Verification

This phase focuses on the final visual refinements of the revenue split visualizations and a comprehensive verification of the platform's stability.

## 1. Visual Polish: Granular Splits
We will improve the "Revenue Splits" dropdowns in both the **Revenue tab** and the **Holders tab**.

### 1.1 `RevenueSnapshot.tsx` Refinement
- [ ] Implement `framer-motion` for the expanded splits row to provide a smooth slide-down effect.
- [ ] Add a subtle vertical "connection line" between the parent transaction and its children splits to emphasize hierarchy.
- [ ] Use `avatar_initials` consistently and add a circular progress ring for the percentage if space permits.
- [ ] Add a "View on Explorer" link for the transaction hash.

### 1.2 `Dashboard.tsx` (Recent Payment Splits) Refinement
- [ ] Sync the styling with `RevenueSnapshot` for consistency.
- [ ] Improve spacing and font-weight hierarchy in the split details.

## 2. Verification & Stability
Ensuring the platform is ready for high-fidelity presentation.

### 2.1 Production Build
- [ ] Run `npm run build` and fix any linting or type errors.

### 2.2 E2E Verification Loop
- [ ] Reset local state (Chain & DB).
- [ ] Run `npm run deploy`.
- [ ] Run `npm run seed`.
- [ ] Run `npm run demo 0.05`.
- [ ] Verify all dashboard tabs reflect the data correctly.

### 2.3 Security Sweep
- [ ] Verify Supabase RLS (Row Level Security) is active on `transactions` and `rights_holders`.
- [ ] Ensure `process.env` secrets are not leaked in client-side code (other than `NEXT_PUBLIC_*`).

## 3. File Edits

### `src/app/components/dashboard/RevenueSnapshot.tsx`
- Refactor the expanded row to use `motion.div`.
- Improve split item styling.

### `src/app/dashboard/page.tsx`
- Improve "Recent Payment Splits" styling.

### `src/app/lib/constants.ts`
- Add any missing visual constants (e.g., standard animation durations).

## 4. Verification Criteria
- [ ] Splits expand smoothly with animation.
- [ ] Visual hierarchy clearly distinguishes transactions from splits.
- [ ] `npm run build` completes successfully.
- [ ] E2E flow from deploy to dashboard is verified as 100% stable.
