import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseServer';
import { requireAdmin } from '@/app/lib/apiSecurity';
import { checkRateLimit } from '@/app/lib/rateLimit';
import { validateBody, addRightsHolderSchema } from '@/app/lib/validation';

export async function POST(req: Request) {
  try {
    const blocked = await checkRateLimit('write');
    if (blocked) return blocked;

    await requireAdmin();

    const result = await validateBody(req, addRightsHolderSchema);
    if (result.error) return result.response;

    const { project_id, full_name, role, wallet_address, percentage } = result.data;

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
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === 'Unauthorized' || msg === 'Forbidden: Admins only') {
      return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 });
    }
    console.error('Add rights holder error:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
