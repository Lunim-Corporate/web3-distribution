import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { ETH_PRICE_USD } from '@/app/lib/constants';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { project_id, tx_hash, sender_address, total_amount_eth, holders, is_demo } = body;

    if (!project_id || !tx_hash || !sender_address || !total_amount_eth) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Insert the transaction record
    const { data: tx, error: txErr } = await supabaseAdmin
      .from('transactions')
      .insert([{
        project_id,
        tx_hash,
        sender_address,
        total_amount_eth,
        status: 'confirmed',
        network: 'metamask',
        confirmed_at: new Date().toISOString(),
        is_demo: is_demo === true,
      }])
      .select()
      .single();

    if (txErr) {
      // tx_hash might be duplicate (unique constraint) — that's fine
      if (txErr.code === '23505') {
        return NextResponse.json({ message: 'Transaction already recorded' }, { status: 200 });
      }
      throw txErr;
    }

    // 2. Insert split records
    if (Array.isArray(holders) && holders.length > 0 && tx?.id) {
      const splits = holders.map((h: any) => ({
        transaction_id: tx.id,
        rights_holder_id: h.rights_holder_id,
        wallet_address: h.wallet_address,
        full_name: h.full_name,
        role: h.role,
        percentage: h.percentage,
        amount_eth: h.amount_eth,
      }));

      await supabaseAdmin.from('transaction_splits').insert(splits);

      // 3. Update each rights holder's total_received
      for (const h of holders) {
        if (!h.rights_holder_id) continue;
        try {
          const { data: current } = await supabaseAdmin
            .from('rights_holders')
            .select('total_received')
            .eq('id', h.rights_holder_id)
            .single();

          await supabaseAdmin
            .from('rights_holders')
            .update({ total_received: (Number(current?.total_received || 0) + Number(h.amount_eth)) })
            .eq('id', h.rights_holder_id);
        } catch (err) {
          console.warn(`Could not update total for holder ${h.rights_holder_id}:`, err);
        }
      }
    }

    // 4. Update project total_distributed
    const { data: proj } = await supabaseAdmin
      .from('projects')
      .select('total_distributed, name')
      .eq('id', project_id)
      .single();

    await supabaseAdmin
      .from('projects')
      .update({ total_distributed: Number(proj?.total_distributed || 0) + Number(total_amount_eth) })
      .eq('id', project_id);

    // 5. Log activity
    const projectName = proj?.name || 'Project';
    await supabaseAdmin.from('activities').insert([{
      project_id,
      action: 'payment_recorded',
      description: `Payment of $${(Number(total_amount_eth) * ETH_PRICE_USD).toLocaleString()} recorded for ${projectName}`,
      user_id: tx?.sender_address,
      timestamp: new Date().toISOString(),
    }]);

    return NextResponse.json({ success: true, transaction_id: tx?.id }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[web3/record-transaction] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
