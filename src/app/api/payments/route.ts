import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseServer';
import { requireAdmin, requireAuth, auditLog } from '@/app/lib/apiSecurity';
import { checkRateLimit } from '@/app/lib/rateLimit';
import { ETH_PRICE_USD } from '@/app/lib/constants';

/**
 * POST /api/payments — Record a payment and distribute to rights holders.
 * 
 * Rewritten to use `transactions`, `transaction_splits`, and `rights_holders` 
 * tables (the actual schema). Previous version referenced non-existent 
 * `payments` and `project_contributors` tables.
 */
export async function POST(request: Request) {
  try {
    const blocked = await checkRateLimit('sensitive');
    if (blocked) return blocked;

    const user = await requireAdmin();

    const body = await request.json();

    // Normalize amount: accept amount_cents, amount, or amount_eth
    let amountEth: number;
    if (typeof body.amount_eth === 'number') {
      amountEth = body.amount_eth;
    } else {
      const amountCents = typeof body.amount_cents === 'number'
        ? body.amount_cents
        : typeof body.amount === 'number'
          ? body.amount
          : Number(body.amount_cents ?? body.amount ?? 0);
      amountEth = amountCents / (ETH_PRICE_USD * 100); // Convert cents to ETH
    }

    if (!body.project_id) {
      return NextResponse.json({ error: 'project_id is required' }, { status: 400 });
    }

    // 1. Record the transaction
    const { data: txRecord, error: txError } = await supabaseAdmin
      .from('transactions')
      .insert({
        project_id: body.project_id,
        tx_hash: body.tx_hash || `manual-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        sender_address: body.sender_address || '0x0000000000000000000000000000000000000000',
        total_amount_eth: amountEth,
        method: body.source || 'manual',
        is_demo: body.is_demo || false,
        status: 'confirmed',
      })
      .select('id')
      .single();

    if (txError) throw txError;

    // 2. Fetch rights holders for this project and compute splits
    const { data: holders } = await supabaseAdmin
      .from('rights_holders')
      .select('*')
      .eq('project_id', body.project_id);

    if (holders && holders.length > 0) {
      // Create transaction splits
      const splits = holders.map(h => ({
        transaction_id: txRecord.id,
        rights_holder_id: h.id,
        wallet_address: h.wallet_address,
        full_name: h.full_name,
        role: h.role,
        amount_eth: (Number(h.percentage) / 100) * amountEth,
        percentage: Number(h.percentage),
      }));

      await supabaseAdmin.from('transaction_splits').insert(splits);

      // Update each holder's total_received
      for (const h of holders) {
        const shareAmount = (Number(h.percentage) / 100) * amountEth;
        const newTotal = Number(h.total_received || 0) + shareAmount;
        await supabaseAdmin
          .from('rights_holders')
          .update({ total_received: newTotal })
          .eq('id', h.id);
      }
    }

    // 3. Update project total distributed
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('total_distributed, name')
      .eq('id', body.project_id)
      .single();

    const newTotal = Number(project?.total_distributed || 0) + amountEth;
    await supabaseAdmin
      .from('projects')
      .update({ total_distributed: newTotal })
      .eq('id', body.project_id);

    // 4. Log activity
    const projectName = project?.name || 'Project';
    const usdValue = amountEth * ETH_PRICE_USD;
    await supabaseAdmin.from('activities').insert([{
      project_id: body.project_id,
      action: 'payment_recorded',
      description: `Revenue influx: Payment of $${usdValue.toLocaleString()} (${amountEth.toFixed(4)} ETH) confirmed for ${projectName}.`,
      timestamp: new Date().toISOString(),
    }]);

    // 5. Audit
    await auditLog('payment:recorded', user.id, true, `project=${body.project_id} amount=${amountEth} ETH`);

    return NextResponse.json({ data: txRecord }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    if (msg === 'Unauthorized' || msg === 'Forbidden: Admins only') {
      return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 });
    }
    console.error('Payment recording error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * GET /api/payments — Retrieve payment history for a project.
 */
export async function GET(request: Request) {
  try {
    const blocked = await checkRateLimit('read');
    if (blocked) return blocked;

    await requireAuth();

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    const isDemoMode = searchParams.get('demo') === 'true';

    let query = supabaseAdmin
      .from('transactions')
      .select('*, projects(name), transaction_splits(*)')
      .order('created_at', { ascending: false });

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    if (isDemoMode) {
      query = query.eq('is_demo', true);
    } else {
      query = query.or('is_demo.eq.false,is_demo.is.null');
    }

    const { data, error } = await query.limit(50);
    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error: any) {
    const msg = error instanceof Error ? error.message : 'Error';
    if (msg === 'Unauthorized') return NextResponse.json({ error: msg }, { status: 401 });
    return NextResponse.json([], { status: 200 });
  }
}