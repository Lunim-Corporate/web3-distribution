import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function POST(request: Request) {
  try {
    const { projectId, amountEth, totalUSD, txHash, source } = await request.json();

    if (!projectId || !totalUSD || !txHash) {
      return NextResponse.json({ error: 'Missing required fields: projectId, totalUSD, txHash' }, { status: 400 });
    }

    // 1. Fetch contributors for this project
    const { data: contributors, error: cErr } = await supabaseAdmin
      .from('project_contributors')
      .select('id, user_id, revenue_share, total_earned')
      .eq('project_id', projectId);

    console.log(`[Payment Record] Fetching contributors for projectId: ${projectId}`);
    console.log(`[Payment Record] Found contributors:`, contributors?.length || 0);

    if (cErr) throw cErr;
    if (!contributors || contributors.length === 0) {
      return NextResponse.json({ error: `No contributors found for project ${projectId}` }, { status: 404 });
    }

    const now = new Date().toISOString();

    // 2. Prepare and insert payment rows (one per contributor)
    const paymentRows = contributors.map((c) => {
      const shareUSD = (Number(c.revenue_share) / 100) * totalUSD;
      const shareInCents = Math.round(shareUSD * 100);
      return {
        project_id: projectId,
        user_id: c.user_id,
        amount: shareInCents,
        tx_hash: txHash,
        status: 'completed',
        source: source || 'Client Payment',
        split_percentage: c.revenue_share,
        payment_date: now,
        created_at: now,
      };
    });

    const { error: pErr } = await supabaseAdmin.from('payments').insert(paymentRows);
    if (pErr) throw pErr;

    // 3. Update project total_revenue
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

    // 4. Update total_earned for each contributor
    for (const c of contributors) {
      const shareEarned = Math.round((Number(c.revenue_share) / 100) * totalCents);
      await supabaseAdmin
        .from('project_contributors')
        .update({ total_earned: (Number(c.total_earned) || 0) + shareEarned })
        .eq('id', c.id);
    }

    // 5. Log activity
    const { data: projName } = await supabaseAdmin
      .from('projects')
      .select('name')
      .eq('id', projectId)
      .single();

    try {
      await supabaseAdmin.from('activities').insert([{
        project_id: projectId,
        activity_type: 'payment_recorded',
        description: `Revenue Influx: $${totalUSD.toLocaleString()} distributed across ${contributors.length} rights holders for ${projName?.name || 'project'}.`,
      }]);
    } catch (e) {
      console.warn('Activity logging failed', e);
    }

    return NextResponse.json({ 
      success: true,
      totalUSD,
      contributorsUpdated: contributors.length,
      txHash,
    });
  } catch (error: any) {
    console.error('[Payment Record] Error:', error?.message || error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
