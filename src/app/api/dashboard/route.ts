import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/app/lib/supabaseServer';
import { requireAuth } from '@/app/lib/apiSecurity';
import { checkRateLimit } from '@/app/lib/rateLimit';
import { isDemoAccessEnabled } from '@/app/lib/demoAccess';
import { demoProjects, demoHolders, demoTransactions } from '@/app/lib/demoData';

export async function GET(req: Request) {
  try {
    // Rate limit: read tier
    const blocked = await checkRateLimit('read');
    if (blocked) return blocked;

    const { searchParams } = new URL(req.url);
    const pid = searchParams.get('pid');
    const isDemoMode = isDemoAccessEnabled && searchParams.get('demo') === 'true';

    // 1. Get user session to know who is requesting
    const user = await requireAuth();
    const userId = user.id;

    let profile: any = null;
    let allProjs: any[] = [];
    let allHolders: any[] = [];
    let allTx: any[] = [];

    const configured = isSupabaseConfigured();

    if (configured) {
      // 2. Fetch user profile via admin to bypass RLS recursion
      const { data: dbProfile } = await supabaseAdmin
        .from('users_profile')
        .select('role, wallet_address')
        .eq('id', userId)
        .maybeSingle();
      profile = dbProfile;

      // 3. Fetch all active projects, rights holders, and transactions
      const { data: dbProjs } = await supabaseAdmin.from('projects').select('*').ilike('status', 'active');
      const { data: dbHolders } = await supabaseAdmin.from('rights_holders').select('*');
      allProjs = dbProjs || [];
      allHolders = dbHolders || [];

      // Filter transactions by is_demo
      let txQuery = supabaseAdmin.from('transactions').select('*, transaction_splits(*)').order('created_at', { ascending: false });
      if (isDemoMode) {
        txQuery = txQuery.eq('is_demo', true);
      } else {
        // In web3 mode, show transactions where is_demo is false OR null
        txQuery = txQuery.or('is_demo.eq.false,is_demo.is.null');
      }
      const { data: dbTx } = await txQuery;
      allTx = dbTx || [];
    } else {
      // Fallback configuration
      profile = { role: 'admin', wallet_address: '0x7C4B53DeBd4fa41Ce7fB0aC3CA25aa3243675fDE' };
      allProjs = demoProjects;
      allHolders = demoHolders;
      allTx = demoTransactions;
    }

    // Recalculate project totals based on filtered transactions for visual consistency
    const projectTotals = new Map();
    (allTx || []).forEach(tx => {
      const current = projectTotals.get(tx.project_id) || 0;
      projectTotals.set(tx.project_id, current + Number(tx.total_amount_eth || 0));
    });

    // Recalculate holder totals based on filtered splits
    const holderTotals = new Map();
    (allTx || []).forEach(tx => {
      (tx.transaction_splits || []).forEach((s: any) => {
        const current = holderTotals.get(s.rights_holder_id) || 0;
        holderTotals.set(s.rights_holder_id, current + Number(s.amount_eth || 0));
      });
    });

    const enrichedProjs = (allProjs || []).map(p => ({
      ...p,
      total_distributed: projectTotals.get(p.id) || 0
    }));

    const enrichedHolders = (allHolders || []).map(h => ({
      ...h,
      total_received: holderTotals.get(h.id) || 0
    }));

    // 4. Determine admin status for filtering decisions
    const isAdmin = profile?.role === 'ADMIN' || profile?.role === 'admin' || user.role === 'admin' || user.isAdmin;

    // 5. Manual Filtering (replicating RLS)
    // Admins see ALL projects. Non-admins are filtered by email/wallet/user_id.
    let allowedProjs = enrichedProjs;
    let allowedHolders = enrichedHolders;
    let allowedTx = allTx || [];

    if (!isAdmin && !isDemoMode) {
      const userEmail = user.email;
      const userWallet = profile?.wallet_address?.toLowerCase() || null;

      const matchingAllotments = (allHolders || []).filter(h => {
        const emailMatch = h.email && userEmail && h.email.toLowerCase() === userEmail.toLowerCase();
        const userIdMatch = h.user_id && h.user_id === userId;
        const walletMatch = h.wallet_address && userWallet && h.wallet_address.toLowerCase() === userWallet;
        return emailMatch || userIdMatch || walletMatch;
      });

      const allowedProjectIds = new Set(matchingAllotments.map(h => h.project_id));

      allowedProjs = enrichedProjs.filter(p => allowedProjectIds.has(p.id));
      allowedHolders = enrichedHolders.filter(h => allowedProjectIds.has(h.project_id));
      allowedTx = (allTx || []).filter(t => allowedProjectIds.has(t.project_id));
    }

    // Find the admin's own project (by email match in holders) for default landing
    let defaultProjectId: string | null = null;
    if (isAdmin && user.email && !isDemoMode) {
      const adminHolder = (allHolders || []).find(
        h => h.email && user.email && h.email.toLowerCase() === user.email.toLowerCase()
      );
      if (adminHolder) {
        defaultProjectId = adminHolder.project_id;
      }
    }



    // 5. Structure the response
    if (!pid || pid === 'all') {
      return NextResponse.json({
        projectsList: allowedProjs,
        project: {
          id: 'all',
          name: 'All Projects',
          status: 'active',
          total_distributed: allowedProjs.reduce((s, p) => s + Number(p.total_distributed || 0), 0)
        },
        holders: allowedHolders,
        transactions: allowedTx,
        defaultProjectId,
      });
    }

    // If specific project requested, filter everything to that pid
    const singleProj = allowedProjs.find(p => p.id === pid);
    if (!singleProj) {
      return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({
      projectsList: allowedProjs,
      project: singleProj,
      holders: allowedHolders.filter(h => h.project_id === pid),
      transactions: allowedTx.filter(t => t.project_id === pid)
    });

  } catch (err: any) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === 'Unauthorized') {
      return NextResponse.json({ error: msg }, { status: 401 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
