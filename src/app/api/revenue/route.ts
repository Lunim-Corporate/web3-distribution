import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('*, projects(name)')
      .order('payment_date', { ascending: false });

    if (error) throw error;
    
    // Transform to expected format
    const formatted = (data || []).map((p: any) => ({
      id: p.id,
      projectId: p.project_id,
      projectName: p.projects?.name || 'Unknown Project',
      amount: p.amount_cents / 100,
      source: p.payment_method || 'Direct Payment',
      date: p.payment_date,
      status: p.status || 'completed'
    }));
    
    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching revenue:', error);
    return NextResponse.json([], { status: 200 });
  }
}


