import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseServer';
import { requireAdmin } from '@/app/lib/apiSecurity';

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { action, id, percentage, project_id, full_name, wallet_address } = body;

    if (action === 'update') {
      if (!id || percentage === undefined) return NextResponse.json({ error: 'Missing ID or percentage' }, { status: 400 });
      const { error } = await supabaseAdmin.from('rights_holders').update({ percentage: Number(percentage) }).eq('id', id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'delete') {
      if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
      const { error } = await supabaseAdmin.from('rights_holders').delete().eq('id', id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('Rights management error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
