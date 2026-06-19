import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseServer';
import { requireAdmin } from '@/app/lib/apiSecurity';

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { project_id, full_name, role, wallet_address, percentage } = body;

    if (!project_id || !full_name || !wallet_address || percentage === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Add to rights_holders table
    const { data, error } = await supabaseAdmin
      .from('rights_holders')
      .insert({
        project_id,
        full_name,
        role: role || 'Contributor',
        wallet_address,
        percentage: Number(percentage),
        total_received: 0,
        status: 'ACTIVE'
      })
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('Add rights holder error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
