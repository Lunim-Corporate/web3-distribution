import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseServer';
import { requireAdmin, auditLog } from '@/app/lib/apiSecurity';
import { checkRateLimit } from '@/app/lib/rateLimit';

/**
 * GET /api/etl/reconcile — Cross-reference royalty inflows with on-chain transactions.
 * 
 * Matches unreconciled `royalty_inflows` against `transactions` by project_id and amount.
 * Flags discrepancies and returns a reconciliation report.
 */
export async function GET() {
  try {
    const blocked = await checkRateLimit('read');
    if (blocked) return blocked;

    await requireAdmin();

    // Fetch unreconciled inflows
    const { data: inflows, error: inflowErr } = await supabaseAdmin
      .from('royalty_inflows')
      .select('*')
      .eq('reconciled', false)
      .order('ingested_at', { ascending: false });

    if (inflowErr) throw inflowErr;

    // Fetch all transactions
    const { data: transactions, error: txErr } = await supabaseAdmin
      .from('transactions')
      .select('id, project_id, total_amount_eth, tx_hash, created_at')
      .order('created_at', { ascending: false });

    if (txErr) throw txErr;

    let matched = 0;
    let unmatched = 0;
    let discrepancyTotal = 0;
    const details: any[] = [];

    for (const inflow of (inflows || [])) {
      // Find a matching transaction by project_id and approximate amount
      const matchingTx = (transactions || []).find(tx =>
        tx.project_id === inflow.project_id &&
        Math.abs(Number(tx.total_amount_eth) - Number(inflow.amount_eth)) < 0.0001
      );

      if (matchingTx) {
        matched++;
        // Mark as reconciled
        await supabaseAdmin
          .from('royalty_inflows')
          .update({ reconciled: true, reconciled_tx_id: matchingTx.id })
          .eq('id', inflow.id);

        details.push({
          inflow_id: inflow.id,
          tx_id: matchingTx.id,
          status: 'matched',
          amount_eth: inflow.amount_eth,
        });
      } else {
        unmatched++;
        discrepancyTotal += Number(inflow.amount_eth);
        details.push({
          inflow_id: inflow.id,
          status: 'unmatched',
          source: inflow.source,
          amount_eth: inflow.amount_eth,
          project_id: inflow.project_id,
        });
      }
    }

    // Log reconciliation run
    const { data: logEntry } = await supabaseAdmin
      .from('etl_reconciliation_log')
      .insert({
        total_inflows: (inflows || []).length,
        matched,
        unmatched,
        discrepancy_amount_eth: discrepancyTotal,
        details,
        status: 'completed',
      })
      .select()
      .single();

    await auditLog('etl:reconcile', null, true, `matched=${matched} unmatched=${unmatched} discrepancy=${discrepancyTotal} ETH`);

    return NextResponse.json({
      reconciliation_id: logEntry?.id,
      summary: {
        total_inflows: (inflows || []).length,
        matched,
        unmatched,
        discrepancy_amount_eth: discrepancyTotal,
      },
      details,
    });
  } catch (err: any) {
    const msg = err instanceof Error ? err.message : 'Reconciliation failed';
    if (msg === 'Unauthorized' || msg === 'Forbidden: Admins only') {
      return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 });
    }
    console.error('ETL reconcile error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
