import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/app/lib/supabaseServer';
import { requireAdmin } from '@/app/lib/apiSecurity';
import { checkRateLimit } from '@/app/lib/rateLimit';
import { validateBody, addRightsHolderSchema } from '@/app/lib/validation';
import { demoHolders } from '@/app/lib/demoData';
import { clearCache } from '@/app/lib/requestCache';
import { syncContractWithDatabase } from '@/app/lib/web3/deployHelper';

export async function POST(req: Request) {
  try {
    const blocked = await checkRateLimit('write');
    if (blocked) return blocked;

    const user = await requireAdmin();
    const isDemo = !!user.isDemo;

    const result = await validateBody(req, addRightsHolderSchema);
    if (result.error) return result.response;

    const { project_id, full_name, role, wallet_address, percentage } = result.data;

    const configured = isSupabaseConfigured();



    // Check percentage total before inserting
    let currentTotal = 0;
    if (configured) {
      const { data: existingHolders } = await supabaseAdmin
        .from('rights_holders')
        .select('percentage')
        .eq('project_id', project_id);
      currentTotal = (existingHolders || []).reduce((sum, h) => sum + Number(h.percentage), 0);
    } else {
      const existingHolders = demoHolders.filter(h => h.project_id === project_id);
      currentTotal = existingHolders.reduce((sum, h) => sum + Number(h.percentage), 0);
    }

    const newTotal = currentTotal + Number(percentage);
    const isOver100 = newTotal > 100.01;
    const warning = isOver100
      ? `Adding this holder brings the total allocation to ${newTotal.toFixed(2)}%, which exceeds 100%. Reduce other holders' percentages first.`
      : Math.abs(newTotal - 100) > 0.01
        ? `Total allocation will be ${newTotal.toFixed(2)}%. Adjust other holders or add more to reach exactly 100%.`
        : null;

    let data: any;
    let newContractAddress: string | null = null;
    if (configured) {
      // Wrap in a transaction: insert holder first, then deploy contract
      const { data: dbData, error } = await supabaseAdmin
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
      data = dbData;

      // Auto-sync contract with database — deploys a new contract with updated roster
      newContractAddress = await syncContractWithDatabase(project_id, isDemo);

      // Rollback DB insert if contract deployment fails
      if (newContractAddress === null && isSupabaseConfigured()) {
        console.warn('Contract deployment failed after holder insert, removing holder');
        await supabaseAdmin.from('rights_holders').delete().eq('id', data.id).maybeSingle();
        return NextResponse.json({ error: 'Contract deployment failed. Holder insert rolled back.' }, { status: 500 });
      }
    } else {
      data = {
        id: `demo-holder-${Date.now()}`,
        project_id,
        full_name,
        role: role || 'Contributor',
        wallet_address,
        percentage: Number(percentage),
        total_received: 0,
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }

    clearCache();

    const response: any = { success: true, data };
    if (warning) {
      response.warning = warning;
      response.totalAllocation = newTotal;
    }
    if (newContractAddress) response.newContractAddress = newContractAddress;
    return NextResponse.json(response);
  } catch (err: any) {
    const msg = typeof err === 'string' ? err : err?.message || err?.error || (err instanceof Error ? err.message : String(err));
    if (msg === 'Unauthorized' || msg === 'Forbidden: Admins only') {
      return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 });
    }
    console.error('Add rights holder error:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
