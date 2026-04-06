import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { normalizePaymentStatus } from '@/lib/utils';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('*, projects(name)')
      .order('payment_date', { ascending: false });

    if (error) throw error;
    
    // Transform to expected format
    const formatted = (data || []).map((p) => {
      const pr = p as Record<string, unknown>;
      const amountCents =
        typeof pr.amount_cents === 'number'
          ? pr.amount_cents
          : typeof pr.amount === 'number'
            ? pr.amount
            : Number(pr.amount_cents ?? pr.amount ?? 0);

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
        amount: amountCents / 100,
        source: String(pr.payment_method ?? pr.source ?? 'Direct Payment'),
        date: String(pr.payment_date ?? ''),
        status,
      };
    });
    
    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching revenue:', error);
    return NextResponse.json([], { status: 200 });
  }
}



export const dynamic = 'force-dynamic';
