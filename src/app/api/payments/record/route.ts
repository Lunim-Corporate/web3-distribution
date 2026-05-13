import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function POST(request: Request) {
  try {
    const { projectId, amountEth, totalUSD, txHash, source } = await request.json();

    if (!projectId || !totalUSD || !txHash) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Fetch contributors
    const { data: contributors, error: cErr } = await supabaseAdmin
      .from('project_contributors')
      .select('*')
      .eq('project_id', projectId);

    if (cErr) throw cErr;
    if (!contributors || contributors.length === 0) {
      return NextResponse.json({ error: 'No contributors found for this project' }, { status: 404 });
    }

    // 2. Prepare payment rows (in cents)
    const paymentRows = contributors.map((c) => {
      const shareUSD = (Number(c.revenue_share) / 100) * totalUSD;
      const shareInCents = Math.round(shareUSD * 100);
      return {
        project_id: projectId,
        user_id: c.user_id,
        amount: shareInCents,
        tx_hash: txHash,
        status: 'completed',
        source: source || 'Demo Mode',
        split_percentage: c.revenue_share,
      };
    });

    // 3. Insert payments
    const { error: pErr } = await supabaseAdmin.from('payments').insert(paymentRows);
    if (pErr) throw pErr;

    // 4. Update project total_revenue
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('total_revenue')
      .eq('id', projectId)
      .single();

    const totalCents = Math.round(totalUSD * 100);
    const newTotal = (Number(project?.total_revenue) || 0) + totalCents;

    await supabaseAdmin
      .from('projects')
      .update({ total_revenue: newTotal })
      .eq('id', projectId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Payment record API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
