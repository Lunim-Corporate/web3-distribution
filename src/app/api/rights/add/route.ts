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

    // Check percentage total before inserting
    const { data: existingHolders } = await supabaseAdmin
      .from('rights_holders')
      .select('percentage')
      .eq('project_id', project_id);

    const currentTotal = (existingHolders || []).reduce((sum, h) => sum + Number(h.percentage), 0);
    const newTotal = currentTotal + Number(percentage);
    const isOver100 = newTotal > 100.01;
    const warning = isOver100
      ? `Adding this holder brings the total allocation to ${newTotal.toFixed(2)}%, which exceeds 100%. Reduce other holders' percentages first.`
      : Math.abs(newTotal - 100) > 0.01
        ? `Total allocation will be ${newTotal.toFixed(2)}%. Adjust other holders or add more to reach exactly 100%.`
        : null;

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

    const response: any = { success: true, data };
    if (warning) {
      response.warning = warning;
      response.totalAllocation = newTotal;
    }
    return NextResponse.json(response);
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
