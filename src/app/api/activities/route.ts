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
    const { data: payments, error } = await supabaseAdmin
      .from('payments')
      .select('id, amount, status, created_at, project_id')
      .order('created_at', { ascending: false })
      .limit(15);

    if (error) throw error;

    const projectIds = Array.from(new Set((payments || []).map(p => p.project_id).filter(Boolean)));
    let projectsMap: Record<string, string> = {};

    if (projectIds.length > 0) {
      const { data: projects } = await supabaseAdmin
        .from('projects')
        .select('id, name')
        .in('id', projectIds);
      
      if (projects) {
        projectsMap = projects.reduce((acc: Record<string, string>, proj) => {
          acc[proj.id] = proj.name;
          return acc;
        }, {});
      }
    }

    const activities = (payments || []).map((p: any) => {
      const projectName = projectsMap[p.project_id] || 'Unknown Project';
      const amount = Number(p.amount || 0) / 100;
      const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

      return {
        id: p.id,
        activity_type: 'payment_recorded',
        description: `Distribution of ${usd} processed for ${projectName}`,
        amount,
        created_at: p.created_at,
        status: p.status,
      };
    });

    return NextResponse.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json([], { status: 200 }); // Return empty array on failure
  }
}

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;
