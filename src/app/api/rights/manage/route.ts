import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseServer';
import { requireAdmin } from '@/app/lib/apiSecurity';
import { checkRateLimit } from '@/app/lib/rateLimit';
import { validateBody, manageRightsHolderSchema } from '@/app/lib/validation';

export async function POST(req: Request) {
  try {
    const blocked = await checkRateLimit('write');
    if (blocked) return blocked;

    await requireAdmin();

    const result = await validateBody(req, manageRightsHolderSchema);
    if (result.error) return result.response;

    const { action, id, percentage } = result.data;

    if (action === 'update') {
      if (percentage === undefined) {
        return NextResponse.json({ error: 'Percentage is required for update action' }, { status: 400 });
      }
      const { error } = await supabaseAdmin
        .from('rights_holders')
        .update({ percentage: Number(percentage) })
        .eq('id', id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'delete') {
      const { error } = await supabaseAdmin
        .from('rights_holders')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === 'Unauthorized' || msg === 'Forbidden: Admins only') {
      return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 });
    }
    console.error('Rights management error:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
