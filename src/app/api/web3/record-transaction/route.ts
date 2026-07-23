import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseServer';
import { getEthPriceUSD } from '@/app/lib/ethPrice';
import { requireAuth } from '@/app/lib/apiSecurity';
import { checkRateLimit } from '@/app/lib/rateLimit';
import { z } from 'zod';

const recordTxSchema = z.object({
  project_id: z.string().uuid('Invalid project_id'),
  tx_hash: z.string().regex(/^0x[0-9a-fA-F]{64}$/, 'Invalid transaction hash'),
  sender_address: z.string().regex(/^0x[0-9a-fA-F]{40}$/, 'Invalid sender address'),
  total_amount_eth: z.number().positive('Amount must be positive'),
  holders: z.array(z.object({
    rights_holder_id: z.string().optional(),
    wallet_address: z.string().regex(/^0x[0-9a-fA-F]{40}$/).optional(),
    full_name: z.string().optional(),
    role: z.string().optional(),
    percentage: z.number().min(0).max(100),
    amount_eth: z.number().min(0),
  })).optional().default([]),
  is_demo: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limit
    const blocked = await checkRateLimit('sensitive');
    if (blocked) return blocked;

    // 2. Authentication
    const user = await requireAuth();

    const body = await req.json();
    const parsed = recordTxSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.errors }, { status: 400 });
    }

    const { project_id, tx_hash, sender_address, total_amount_eth, holders, is_demo } = parsed.data;

    // Live transactions require Administrator permissions
    if (!is_demo && user.role?.toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'Live contract transactions require Administrator permissions.' }, { status: 403 });
    }

    const ethPrice = await getEthPriceUSD();

    // 1. Insert the transaction record
    const insertPayloadWithPrice = {
      project_id,
      tx_hash,
      sender_address,
      total_amount_eth,
      status: 'confirmed',
      network: 'metamask',
      confirmed_at: new Date().toISOString(),
      is_demo: is_demo === true,
      eth_price_at_tx: ethPrice,
    };

    let tx = null;
    let txErr = null;

    const firstTry = await supabaseAdmin
      .from('transactions')
      .insert([insertPayloadWithPrice])
      .select()
      .single();

    if (firstTry.error && (firstTry.error.code === '42703' || firstTry.error.message?.includes('eth_price_at_tx'))) {
      // Fallback: column doesn't exist, retry without it
      const insertPayloadWithoutPrice = { ...insertPayloadWithPrice };
      delete (insertPayloadWithoutPrice as any).eth_price_at_tx;
      const secondTry = await supabaseAdmin
        .from('transactions')
        .insert([insertPayloadWithoutPrice])
        .select()
        .single();
      tx = secondTry.data;
      txErr = secondTry.error;
    } else {
      tx = firstTry.data;
      txErr = firstTry.error;
    }

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
          const rpcRes = await supabaseAdmin.rpc('increment_holder_received', {
            holder_id: h.rights_holder_id,
            amount: Number(h.amount_eth),
          });

          if (rpcRes.error && (rpcRes.error.code === '42883' || rpcRes.error.message?.includes('increment_holder_received'))) {
            // Graceful fallback: RPC does not exist (migration not run yet)
            const { data: current } = await supabaseAdmin
              .from('rights_holders')
              .select('total_received')
              .eq('id', h.rights_holder_id)
              .single();

            await supabaseAdmin
              .from('rights_holders')
              .update({ total_received: (Number(current?.total_received || 0) + Number(h.amount_eth)) })
              .eq('id', h.rights_holder_id);
          } else if (rpcRes.error) {
            throw rpcRes.error;
          }
        } catch (err) {
          console.warn(`Could not update total for holder ${h.rights_holder_id}:`, err);
        }
      }
    }

    // 4. Get project details and update total_distributed atomically
    const { data: proj } = await supabaseAdmin
      .from('projects')
      .select('name, total_distributed')
      .eq('id', project_id)
      .single();

    try {
      const rpcRes = await supabaseAdmin.rpc('increment_project_distributed', {
        project_id,
        amount: Number(total_amount_eth),
      });

      if (rpcRes.error && (rpcRes.error.code === '42883' || rpcRes.error.message?.includes('increment_project_distributed'))) {
        // Graceful fallback: RPC does not exist
        await supabaseAdmin
          .from('projects')
          .update({ total_distributed: Number(proj?.total_distributed || 0) + Number(total_amount_eth) })
          .eq('id', project_id);
      } else if (rpcRes.error) {
        throw rpcRes.error;
      }
    } catch (err) {
      console.warn(`Could not update total for project ${project_id}:`, err);
    }

    // 5. Log activity
    const projectName = proj?.name || 'Project';
    await supabaseAdmin.from('activities').insert([{
      project_id,
      action: 'payment_recorded',
      description: `Payment of $${(Number(total_amount_eth) * ethPrice).toLocaleString()} recorded for ${projectName}`,
      user_id: user.isDemo ? null : user.id,
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
