import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

/**
 * GET /api/activities
 * 
 * Fetches recent transactions directly from the `payments` table
 * and synthetically formats them into an activity feed.
 */
export async function GET() {
  try {
    // 1. Fetch explicit activities
    const { data: activities, error: actError } = await supabaseAdmin
      .from('activities')
      .select('*, projects(name)')
      .order('created_at', { ascending: false })
      .limit(10);

    if (actError) throw actError;

    // 2. Fetch recent payments to ensure they are represented (backup in case activity log missed)
    const { data: payments, error: payError } = await supabaseAdmin
      .from('payments')
      .select('*, projects(name)')
      .order('created_at', { ascending: false })
      .limit(10);

    if (payError) throw payError;

    // 3. Merge and format
    const paymentActivities = (payments || []).map(p => ({
      id: `pay-${p.id}`,
      project_id: p.project_id,
      activity_type: 'payment_recorded',
      description: `Revenue Influx: Web3 payment of $${(Number(p.amount)/100).toLocaleString()} confirmed for ${p.projects?.name || 'Project'}.`,
      created_at: p.created_at,
      is_synthetic: true
    }));

    const combined = [...(activities || []), ...paymentActivities]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 15);

    return NextResponse.json(combined);
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json([], { status: 200 });
  }
}


export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;
