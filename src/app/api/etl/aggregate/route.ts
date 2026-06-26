import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseServer';
import { requireAuth } from '@/app/lib/apiSecurity';
import { checkRateLimit } from '@/app/lib/rateLimit';
import { getEthPriceUSD } from '@/app/lib/ethPrice';
import { isDemoAccessEnabled } from '@/app/lib/demoAccess';

/**
 * GET /api/etl/aggregate — Pre-computed financial aggregations.
 * 
 * Computes or returns cached period-based rollups (daily/weekly/monthly).
 * Powers dashboard charts without expensive real-time queries.
 * 
 * Query params:
 *   ?period=daily|weekly|monthly (default: monthly)
 *   ?project_id=<uuid> (optional, all projects if omitted)
 *   ?refresh=true (force recompute)
 */
export async function GET(req: Request) {
  try {
    const blocked = await checkRateLimit('read');
    if (blocked) return blocked;

    await requireAuth();

    const { searchParams } = new URL(req.url);
    const periodType = searchParams.get('period') || 'monthly';
    const projectId = searchParams.get('project_id');
    const refresh = searchParams.get('refresh') === 'true';
    const isDemoMode = isDemoAccessEnabled && searchParams.get('demo') === 'true';

    // If refresh requested or no cached data, compute from transactions
    if (refresh) {
      await computeAggregates(periodType, projectId, isDemoMode);
    }

    // Fetch aggregates
    let query = supabaseAdmin
      .from('financial_aggregates')
      .select('*')
      .eq('period_type', periodType)
      .order('period_start', { ascending: false })
      .limit(52); // ~1 year of weekly data

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data: cached, error } = await query;

    // If no cached data exists, compute on-the-fly from transactions
    if (error || !cached || cached.length === 0) {
      const liveAggregates = await computeLiveAggregates(periodType, projectId, isDemoMode);
      return NextResponse.json(liveAggregates);
    }

    return NextResponse.json(cached);
  } catch (err: any) {
    const msg = err instanceof Error ? err.message : 'Aggregation failed';
    if (msg === 'Unauthorized') return NextResponse.json({ error: msg }, { status: 401 });
    console.error('ETL aggregate error:', msg);
    return NextResponse.json([], { status: 200 });
  }
}

/**
 * Compute aggregates directly from transactions (no cache).
 * Used as fallback when financial_aggregates table is empty.
 */
async function computeLiveAggregates(
  periodType: string,
  projectId: string | null,
  isDemoMode: boolean
): Promise<any[]> {
  const ethPrice = await getEthPriceUSD();

  let query = supabaseAdmin
    .from('transactions')
    .select('project_id, total_amount_eth, created_at, eth_price_at_tx, transaction_splits(rights_holder_id)')
    .order('created_at', { ascending: true });

  if (projectId) query = query.eq('project_id', projectId);
  if (isDemoMode) {
    query = query.eq('is_demo', true);
  } else {
    query = query.or('is_demo.eq.false,is_demo.is.null');
  }

  const { data: transactions } = await query;
  if (!transactions || transactions.length === 0) return [];

  // Group by period
  const buckets = new Map<string, {
    period_start: string;
    period_end: string;
    total_eth: number;
    total_usd: number;
    transaction_count: number;
    holder_ids: Set<string>;
  }>();

  for (const tx of transactions) {
    const date = new Date(tx.created_at);
    let key: string;
    let periodStart: Date;
    let periodEnd: Date;

    if (periodType === 'daily') {
      key = date.toISOString().split('T')[0];
      periodStart = new Date(key);
      periodEnd = new Date(periodStart);
      periodEnd.setDate(periodEnd.getDate() + 1);
    } else if (periodType === 'weekly') {
      const dayOfWeek = date.getDay();
      const start = new Date(date);
      start.setDate(date.getDate() - dayOfWeek);
      key = start.toISOString().split('T')[0];
      periodStart = new Date(key);
      periodEnd = new Date(periodStart);
      periodEnd.setDate(periodEnd.getDate() + 7);
    } else {
      // monthly
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
      periodStart = new Date(key);
      periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    if (!buckets.has(key)) {
      buckets.set(key, {
        period_start: periodStart.toISOString().split('T')[0],
        period_end: periodEnd.toISOString().split('T')[0],
        total_eth: 0,
        total_usd: 0,
        transaction_count: 0,
        holder_ids: new Set(),
      });
    }

    const bucket = buckets.get(key)!;
    const ethAmount = Number(tx.total_amount_eth || 0);
    bucket.total_eth += ethAmount;
    const txPrice = tx.eth_price_at_tx ? Number(tx.eth_price_at_tx) : ethPrice;
    bucket.total_usd += ethAmount * txPrice;
    bucket.transaction_count += 1;

    // Count unique holders
    const splits = tx.transaction_splits as any[];
    if (splits) {
      for (const s of splits) {
        if (s.rights_holder_id) bucket.holder_ids.add(s.rights_holder_id);
      }
    }
  }

  return Array.from(buckets.values()).map(b => ({
    period_type: periodType,
    period_start: b.period_start,
    period_end: b.period_end,
    total_eth: b.total_eth,
    total_usd: b.total_usd,
    transaction_count: b.transaction_count,
    holder_count: b.holder_ids.size,
  }));
}

/**
 * Compute and cache aggregates in the financial_aggregates table.
 */
async function computeAggregates(
  periodType: string,
  projectId: string | null,
  isDemoMode: boolean
): Promise<void> {
  const aggregates = await computeLiveAggregates(periodType, projectId, isDemoMode);

  for (const agg of aggregates) {
    await supabaseAdmin
      .from('financial_aggregates')
      .upsert(
        {
          project_id: projectId,
          period_type: periodType,
          period_start: agg.period_start,
          period_end: agg.period_end,
          total_eth: agg.total_eth,
          total_usd: agg.total_usd,
          transaction_count: agg.transaction_count,
          holder_count: agg.holder_count,
          computed_at: new Date().toISOString(),
        },
        { onConflict: 'project_id,period_type,period_start' }
      );
  }
}

export const dynamic = 'force-dynamic';
