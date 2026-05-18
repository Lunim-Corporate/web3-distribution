import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const mode = searchParams.get('mode'); // 'demo' or 'live'

  try {
    // 1. Fetch Projects - Always fetch all projects to populate selectors
    const projQuery = supabaseAdmin.from('projects').select('*').order('created_at', { ascending: false });

    const { data: projects, error: pErr } = await projQuery;
    if (pErr) throw pErr;

    // 2. Fetch Contributors
    let cQuery = supabaseAdmin.from('project_contributors').select('*, users(*)');
    if (projectId && projectId !== 'all') {
      cQuery = cQuery.eq('project_id', projectId);
    }
    const { data: finalContributors, error: cErr } = await cQuery;
    if (cErr) console.warn('Contributors fetch error:', cErr.message);

    // 3. Fetch Payments
    let payQuery = supabaseAdmin.from('payments').select('*').order('created_at', { ascending: false });
    if (projectId && projectId !== 'all') {
      payQuery = payQuery.eq('project_id', projectId);
    }
    
    // Strict Mode Filtering:
    // Live mode should only show actual blockchain-confirmed transactions.
    // Demo mode shows everything else (Demo Mode, Client Payment, or Seeder data).
    console.log(`[Dashboard Data API] Mode: ${mode}, ProjectId: ${projectId}`);
    
    if (mode === 'live') {
      payQuery = payQuery.eq('source', 'Blockchain');
    } else {
      payQuery = payQuery.neq('source', 'Blockchain');
    }

    const { data: payments, error: payErr } = await payQuery;
    if (payErr) throw payErr;
    
    console.log(`[Dashboard Data API] Found ${payments?.length || 0} payments`);

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

    const safeContributors = finalContributors || [];

    return NextResponse.json({
      projects: projectsWithModeRevenue,
      contributors: safeContributors.map(c => ({
        ...c,
        name: c.users?.name || usersMap[c.user_id]?.name || 'Unknown',
        wallet_address: c.users?.wallet_address || usersMap[c.user_id]?.wallet_address || '0x...',
        projectName: projects?.find(p => p.id === c.project_id)?.name || 'Unknown Project'
      })),
      payments: (payments || []).map(pay => {
        const proj = projects?.find(p => p.id === pay.project_id);
        return {
          ...pay,
          projectName: proj ? proj.name : 'Unknown Project'
        };
      }),
    });
  } catch (error: any) {
    console.error('Dashboard Data API Error:', error.message || error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
