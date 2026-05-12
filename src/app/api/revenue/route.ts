import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseServer';
import { normalizePaymentStatus } from '@/lib/utils';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const isDemoMode = searchParams.get('demo') === 'true';

    let query = supabaseAdmin
      .from('transactions')
      .select('*, projects(name), transaction_splits(*)')
      .order('created_at', { ascending: false });

    if (isDemoMode) {
      query = query.eq('is_demo', true);
    } else {
      query = query.or('is_demo.eq.false,is_demo.is.null');
    }

    const { data, error } = await query;

    if (error) throw error;
    
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
  } catch (error) {
    console.error('CRITICAL Error fetching revenue:', error);
    return NextResponse.json([], { status: 200 });
  }
}

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;
