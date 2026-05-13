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
    let contQuery = supabaseAdmin.from('project_contributors').select('*, users(*)');
    if (projectId && projectId !== 'all') {
      contQuery = contQuery.eq('project_id', projectId);
    }
    const { data: contributors, error: cErr } = await contQuery;
    if (cErr) throw cErr;

    // 3. Fetch Payments
    let payQuery = supabaseAdmin.from('payments').select('*').order('created_at', { ascending: false });
    if (projectId && projectId !== 'all') {
      payQuery = payQuery.eq('project_id', projectId);
    }
    
    if (mode === 'demo') {
      payQuery = payQuery.eq('source', 'Demo Mode');
    } else if (mode === 'live') {
      payQuery = payQuery.neq('source', 'Demo Mode');
    }
    const { data: payments, error: payErr } = await payQuery;
    if (payErr) throw payErr;

    // 4. Fetch Users (for mapping if needed)
    const { data: allUsers } = await supabaseAdmin.from('users').select('id, name, wallet_address');
    const usersMap = (allUsers || []).reduce((acc: any, u) => {
      acc[u.id] = u;
      return acc;
    }, {});

    return NextResponse.json({
      projects: projects || [],
      contributors: (contributors || []).map(c => ({
        ...c,
        name: c.users?.name || usersMap[c.user_id]?.name || 'Unknown',
        wallet_address: c.users?.wallet_address || usersMap[c.user_id]?.wallet_address || '0x...',
      })),
      payments: payments || [],
    });
  } catch (error) {
    console.error('Dashboard Data API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
