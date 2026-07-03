import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/app/lib/supabaseServer';
import { requireAdmin } from '@/app/lib/apiSecurity';
import { checkRateLimit } from '@/app/lib/rateLimit';
import { validateBody, addRightsHolderSchema } from '@/app/lib/validation';
import { demoHolders } from '@/app/lib/demoData';
import { clearCache } from '@/app/lib/requestCache';

export async function POST(req: Request) {
  try {
    const blocked = await checkRateLimit('write');
    if (blocked) return blocked;

    await requireAdmin();

    const result = await validateBody(req, addRightsHolderSchema);
    if (result.error) return result.response;

    const { project_id, full_name, role, wallet_address, percentage } = result.data;

    const configured = isSupabaseConfigured();

    // Protection check 1: System demo projects by name
    if (configured) {
      const { data: thisProj } = await supabaseAdmin
        .from('projects')
        .select('name')
        .eq('id', project_id)
        .maybeSingle();

      if (thisProj && ['Neon Requiem', 'Aether Drift', 'LUNIM Genesis', 'The Salt Coast'].includes(thisProj.name)) {
        return NextResponse.json({ error: 'Cannot modify system demo projects.' }, { status: 403 });
      }

      // Protection check 2: Projects containing any rights holders that are admins
      const { data: projectHolders } = await supabaseAdmin
        .from('rights_holders')
        .select('email, role')
        .eq('project_id', project_id);

      const hasAdmin = (projectHolders || []).some(
        h => (h.email && ['pete@tabb.cc', 'freewhynane62@gmail.com', 'jeevesh039@gmail.com'].includes(h.email.toLowerCase())) || 
             (h.role && h.role.toLowerCase().includes('admin'))
      );

      if (hasAdmin) {
        return NextResponse.json({ error: 'Cannot modify projects containing administrator accounts.' }, { status: 403 });
      }
    } else {
      if (project_id === 'demo-project-1' || project_id === 'demo-project-2') {
        return NextResponse.json({ error: 'Cannot modify system demo projects.' }, { status: 403 });
      }
    }

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
    if (configured) {
      // 1. Add to rights_holders table
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
