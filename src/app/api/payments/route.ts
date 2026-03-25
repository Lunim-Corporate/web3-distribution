import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const amountCents =
      typeof body.amount_cents === 'number'
        ? body.amount_cents
        : typeof body.amount === 'number'
          ? body.amount
          : Number(body.amount_cents ?? body.amount ?? 0);

    // Record payment
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert([{
        project_id: body.project_id,
        amount: amountCents,
        source: body.source || 'Manual',
        tx_hash: body.tx_hash,
      }])
      .select()
      .single();

    if (paymentError) throw paymentError;

    // Update project total revenue
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('total_revenue')
      .eq('id', body.project_id)
      .single();

    const newTotal = (project?.total_revenue || 0) + amountCents;

    await supabaseAdmin
      .from('projects')
      .update({ total_revenue: newTotal })
      .eq('id', body.project_id);

    // Distribute to contributors (with remainder handling to prevent rounding errors)
    const { data: contributors } = await supabaseAdmin
      .from('project_contributors')
      .select('*')
      .eq('project_id', body.project_id);

    if (contributors && contributors.length > 0) {
      let remainingAmount = amountCents;

      for (let i = 0; i < contributors.length; i++) {
        const contributor = contributors[i];
        let shareAmount: number;

        if (i === contributors.length - 1) {
          // Last contributor gets remainder to ensure exact total
          shareAmount = remainingAmount;
        } else {
          // Calculate share with rounding
          shareAmount = Math.round((contributor.revenue_share / 100) * amountCents);
          remainingAmount -= shareAmount;
        }

        // Update contributor earnings
        await supabaseAdmin
          .from('project_contributors')
          .update({ total_earned: (contributor.total_earned || 0) + shareAmount })
          .eq('id', contributor.id);
      }
    }

    return NextResponse.json({ data: payment }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}