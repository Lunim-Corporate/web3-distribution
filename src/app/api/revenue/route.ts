import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/app/lib/supabaseServer';
import { requireAuth } from '@/app/lib/apiSecurity';
import { checkRateLimit } from '@/app/lib/rateLimit';
import { isDemoAccessEnabled } from '@/app/lib/demoAccess';
import { demoTransactions } from '@/app/lib/demoData';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const isDemoMode = isDemoAccessEnabled && searchParams.get('demo') === 'true';
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 0, 1), 500) : 500;

    const [blocked] = await Promise.all([
      checkRateLimit('read'),
      isDemoMode ? Promise.resolve() : requireAuth(),
    ]);
    if (blocked) return blocked;

    let data: any[] = [];
    const configured = isSupabaseConfigured();

    if (configured) {
      let query = supabaseAdmin
        .from('transactions')
        .select('*, projects(name), transaction_splits(*)')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (isDemoMode) {
        query = query.eq('is_demo', true);
      } else {
        query = query.or('is_demo.eq.false,is_demo.is.null');
      }

      const { data: dbData, error } = await query;
      if (error) throw error;
      data = dbData || [];
    } else {
      // Mock data map
      data = demoTransactions.map(tx => ({
        ...tx,
        projects: { name: tx.project_id === 'demo-project-1' ? 'Neon Requiem' : 'The Salt Coast' }
      }));
    }

    const formatted = (data || []).map((p) => {
      const amount = Number(p.total_amount_eth || p.total_amount || 0);
      const projectName = p.projects?.name || 'Unknown Project';
      return {
        id: String(p.id ?? ''),
        projectId: String(p.project_id ?? ''),
        projectName,
        amount,
        txHash: String(p.tx_hash ?? ''),
        source: 'Client Payment',
        date: String(p.created_at ?? ''),
        status: 'completed',
        splits: p.transaction_splits || [],
      };
    });

    return NextResponse.json(formatted);
  } catch (error: any) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg === 'Unauthorized') {
      return NextResponse.json({ error: msg }, { status: 401 });
    }
    console.error('Error fetching revenue:', msg);
    return NextResponse.json({ error: 'Failed to fetch revenue data' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
