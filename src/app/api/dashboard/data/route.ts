import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const mode = searchParams.get('mode'); // 'demo' or 'live'

  try {
    // 1. Fetch Projects
    let projQuery = supabaseAdmin.from('projects').select('*');
    if (projectId && projectId !== 'all') {
      projQuery = projQuery.eq('id', projectId);
    }
    const { data: projects, error: pErr } = await projQuery;
    if (pErr) throw pErr;

    // 2. Fetch Contributors
    // Try to fetch with users join
    const { data: contributors, error: cErr } = await supabaseAdmin
      .from('project_contributors')
      .select('*, users(*)')
      .eq(projectId && projectId !== 'all' ? 'project_id' : 'id', projectId && projectId !== 'all' ? projectId : '00000000-0000-0000-0000-000000000000') // Dummy if all
      .or(projectId && projectId !== 'all' ? '' : 'id.neq.00000000-0000-0000-0000-000000000000');

    // Actually, let's simplify the logic for readability and reliability
    let finalContributors = [];
    
    if (projectId && projectId !== 'all') {
      const { data: cData, error: ce } = await supabaseAdmin
        .from('project_contributors')
        .select('*, users(*)')
        .eq('project_id', projectId);
      
      if (ce) {
        console.warn('Contributors join failed, falling back to simple select:', ce.message);
        const { data: sData } = await supabaseAdmin
          .from('project_contributors')
          .select('*')
          .eq('project_id', projectId);
        finalContributors = sData || [];
      } else {
        finalContributors = cData || [];
      }
    } else {
      const { data: cData, error: ce } = await supabaseAdmin
        .from('project_contributors')
        .select('*, users(*)');
      
      if (ce) {
        const { data: sData } = await supabaseAdmin
          .from('project_contributors')
          .select('*');
        finalContributors = sData || [];
      } else {
        finalContributors = cData || [];
      }
    }

    // 3. Fetch Payments (Show all payments in both modes for consistency)
    let payQuery = supabaseAdmin.from('payments').select('*').order('created_at', { ascending: false });
    if (projectId && projectId !== 'all') {
      payQuery = payQuery.eq('project_id', projectId);
    }
    const { data: payments, error: payErr } = await payQuery;
    if (payErr) throw payErr;

    // 4. Calculate Mode-Specific Revenue for Projects
    const projectsWithModeRevenue = (projects || []).map(p => {
      const projectPayments = (payments || []).filter(pay => pay.project_id === p.id);
      const modeRevenue = projectPayments.reduce((sum, pay) => sum + (Number(pay.amount) || 0), 0);
      return {
        ...p,
        total_revenue: modeRevenue 
      };
    });

    // 5. Fetch Users for manual join mapping
    const { data: allUsers } = await supabaseAdmin.from('users').select('id, name, wallet_address');
    const usersMap = (allUsers || []).reduce((acc: any, u) => {
      acc[u.id] = u;
      return acc;
    }, {});

    return NextResponse.json({
      projects: projectsWithModeRevenue,
      contributors: finalContributors.map(c => ({
        ...c,
        name: c.users?.name || usersMap[c.user_id]?.name || 'Unknown',
        wallet_address: c.users?.wallet_address || usersMap[c.user_id]?.wallet_address || '0x...',
      })),
      payments: payments || [],
    });
  } catch (error: any) {
    console.error('Dashboard Data API Error:', error.message || error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
