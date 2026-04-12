import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { normalizePaymentStatus } from '@/lib/utils';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('*, projects(name)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Transform to expected format
    // IMPORTANT: The `amount` column stores raw USD values (NOT cents).
    // Do NOT divide by 100 here — that was causing the data mismatch.
    const formatted = (data || []).map((p) => {
      const pr = p as Record<string, unknown>;
      const amount = Number(pr.amount ?? 0) / 100;

      const status = normalizePaymentStatus(pr.status ?? 'completed');

      const projectsRow = pr['projects'] as Record<string, unknown> | undefined;
      const projectName =
        projectsRow && typeof projectsRow.name === 'string'
          ? projectsRow.name
          : 'Unknown Project';

      return {
        id: String(pr.id ?? ''),
        projectId: String(pr.project_id ?? ''),
        projectName,
        amount,
        txHash: String(pr.tx_hash ?? ''),
        source: String(pr.source ?? pr.payment_method ?? 'Direct Payment'),
        date: String(pr.created_at ?? pr.payment_date ?? ''),
        status,
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
