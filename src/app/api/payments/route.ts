import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { requireAdmin } from '@/lib/apiSecurity';

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const amountCents =
      typeof body.amount_cents === 'number'
        ? body.amount_cents
        : typeof body.amount === 'number'
          ? body.amount
          : Number(body.amount_cents ?? body.amount ?? 0);

    // 1. Record the Payment
    console.log(`[MasterSync] Recording payment for Project ${body.project_id}: ${amountCents} cents...`);
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert([{
        project_id: body.project_id,
        amount: amountCents, // Note: using 'amount' to match current DB column
        source: body.source || 'Manual',
        tx_hash: body.tx_hash,
        status: 'Paid',
        payment_date: new Date().toISOString()
      }])
      .select()
      .single();

    if (paymentError) throw paymentError;

    // 2. Update Project Total Revenue & Title Sync
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('total_revenue, name')
      .eq('id', body.project_id)
      .single();

    const newTotal = (Number(project?.total_revenue || 0)) + amountCents;

    await supabaseAdmin
      .from('projects')
      .update({ total_revenue: newTotal })
      .eq('id', body.project_id);

    // 3. Distribute to Contributors
    const { data: contributors } = await supabaseAdmin
      .from('project_contributors')
      .select('*')
      .eq('project_id', body.project_id);

    if (contributors && contributors.length > 0) {
      for (const contributor of contributors) {
        const shareAmount = Math.round((Number(contributor.revenue_share) / 100) * amountCents);
        await supabaseAdmin
          .from('project_contributors')
          .update({ total_earned: (Number(contributor.total_earned || 0) + shareAmount) })
          .eq('id', contributor.id);
      }
    }

    // 4. Log Activity Trace (Powers the Dashboard Feed)
    await supabaseAdmin.from('activities').insert([{
      project_id: body.project_id,
      action: 'payment_recorded',
      description: `Revenue Influx: Web3 payment of $${(amountCents/100).toLocaleString()} confirmed for ${project?.name || 'Project'}.`,
      timestamp: new Date().toISOString(),
    }]);

    // 5. Progress Milestones (Powers the Right Sidebar)
    const { data: nextMilestone } = await supabaseAdmin
      .from('milestones')
      .select('id')
      .eq('project_id', body.project_id)
      .eq('status', 'pending')
      .order('date', { ascending: true })
      .limit(1);

    if (nextMilestone && nextMilestone[0]) {
      await supabaseAdmin
        .from('milestones')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', nextMilestone[0].id);
    }

    return NextResponse.json({ data: payment }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    if (msg === 'Unauthorized' || msg === 'Forbidden: Admins only') {
      return NextResponse.json({ error: msg }, { status: 401 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}