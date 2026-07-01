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

    const { action, id } = result.data;

    // Fetch the holder being modified (for total calculation)
    const { data: thisHolder } = await supabaseAdmin
      .from('rights_holders')
      .select('project_id, percentage')
      .eq('id', id)
      .single();

    if (!thisHolder) {
      return NextResponse.json({ error: 'Rights holder not found' }, { status: 404 });
    }

    // Calculate total allocation impact
    const { data: projectHolders } = await supabaseAdmin
      .from('rights_holders')
      .select('id, percentage')
      .eq('project_id', thisHolder.project_id);

    const totalWithoutThis = (projectHolders || [])
      .filter(h => h.id !== id)
      .reduce((sum, h) => sum + Number(h.percentage), 0);

    let warning: string | null = null;

    if (action === 'update') {
      const updateData: any = {};
      if (result.data.full_name !== undefined) updateData.full_name = result.data.full_name;
      if (result.data.role !== undefined) updateData.role = result.data.role;
      if (result.data.wallet_address !== undefined) updateData.wallet_address = result.data.wallet_address;
      if (result.data.percentage !== undefined) updateData.percentage = Number(result.data.percentage);

      if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ error: 'At least one field to update is required' }, { status: 400 });
      }

      const newPct = result.data.percentage !== undefined ? Number(result.data.percentage) : Number(thisHolder.percentage);
      const newTotal = totalWithoutThis + newPct;
      if (newTotal > 100.01) {
        warning = `This change brings the total allocation to ${newTotal.toFixed(2)}%, exceeding 100%. Reduce other holders first.`;
      } else if (Math.abs(newTotal - 100) > 0.01) {
        warning = `Total allocation will be ${newTotal.toFixed(2)}%. Adjust other holders or add more to reach exactly 100%.`;
      }

      const { error } = await supabaseAdmin
        .from('rights_holders')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
      const response: any = { success: true };
      if (warning) response.warning = warning;
      return NextResponse.json(response);
    }

    if (action === 'delete') {
      const newTotal = totalWithoutThis;
      if (newTotal > 100.01) {
        warning = `After deletion, total allocation is ${newTotal.toFixed(2)}%, still exceeding 100%. Adjust remaining holders.`;
      } else if (Math.abs(newTotal - 100) > 0.01) {
        warning = `After deletion, total allocation will be ${newTotal.toFixed(2)}%. Add more holders or adjust percentages to reach exactly 100%.`;
      }

      const { error } = await supabaseAdmin
        .from('rights_holders')
        .delete()
        .eq('id', id);
      if (error) throw error;
      const response: any = { success: true };
      if (warning) response.warning = warning;
      return NextResponse.json(response);
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
