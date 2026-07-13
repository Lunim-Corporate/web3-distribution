import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseServer';
import { requireAdmin, auditLog } from '@/app/lib/apiSecurity';
import { checkRateLimit } from '@/app/lib/rateLimit';
import { validateBody, etlIngestSchema } from '@/app/lib/validation';
import { getEthPriceUSD } from '@/app/lib/ethPrice';

/**
 * POST /api/etl/ingest — Ingest royalty data from external sources.
 * 
 * Sources: Stripe webhook payloads, manual CSV uploads, on-chain event sync.
 * Normalizes all data into a unified `royalty_inflows` record with deduplication.
 */
export async function POST(req: Request) {
  try {
    const blocked = await checkRateLimit('write');
    if (blocked) return blocked;

    const user = await requireAdmin();

    const result = await validateBody(req, etlIngestSchema);
    if (result.error) return result.response;

    const { source, project_id, amount_eth, amount_usd, external_ref_id, metadata } = result.data;

    // Deduplication: check if this external reference was already ingested
    if (external_ref_id) {
      const { data: existing } = await supabaseAdmin
        .from('royalty_inflows')
        .select('id')
        .eq('source', source)
        .eq('external_ref_id', external_ref_id)
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          { error: 'Duplicate inflow — already ingested', existing_id: existing.id },
          { status: 409 }
        );
      }
    }

    // Compute missing value: if only USD provided, estimate ETH; if only ETH, estimate USD
    const ethPrice = await getEthPriceUSD();
    const finalEth = amount_eth || (amount_usd ? amount_usd / ethPrice : 0);
    const finalUsd = amount_usd || (amount_eth ? amount_eth * ethPrice : 0);

    const { data: inflow, error } = await supabaseAdmin
      .from('royalty_inflows')
      .insert({
        project_id,
        source,
        external_ref_id: external_ref_id || `${source}-${Date.now()}`,
        amount_eth: finalEth,
        amount_usd: finalUsd,
        metadata: metadata || {},
        reconciled: false,
      })
      .select()
      .single();

    if (error) throw error;

    await auditLog('etl:ingest', user.id, true, `source=${source} project=${project_id} eth=${finalEth}`);

    return NextResponse.json({ success: true, inflow }, { status: 201 });
  } catch (err: any) {
    const msg = err instanceof Error ? err.message : 'Ingestion failed';
    if (msg === 'Unauthorized' || msg === 'Forbidden: Admins only') {
      return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 });
    }
    console.error('ETL ingest error:', msg);
    return NextResponse.json({ error: 'Ingestion failed' }, { status: 500 });
  }
}

/**
 * GET /api/etl/ingest — List recent inflows.
 */
export async function GET() {
  try {
    const blocked = await checkRateLimit('read');
    if (blocked) return blocked;

    await requireAdmin();

    const { data, error } = await supabaseAdmin
      .from('royalty_inflows')
      .select('*, projects(name)')
      .order('ingested_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (err: any) {
    const msg = err instanceof Error ? err.message : 'Error';
    if (msg === 'Unauthorized' || msg === 'Forbidden: Admins only') {
      return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 });
    }
    return NextResponse.json({ error: 'Failed to fetch inflows' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
