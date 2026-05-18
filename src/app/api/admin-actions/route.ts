import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

async function getProjectAllocation(projectId: string, excludeContributorId?: string) {
  let query = supabaseAdmin
    .from('project_contributors')
    .select('id, revenue_share')
    .eq('project_id', projectId);

  if (excludeContributorId) {
    query = query.neq('id', excludeContributorId);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).reduce((sum, contributor) => sum + Number(contributor.revenue_share || 0), 0);
}

function normalizePercentage(value: unknown) {
  const percentage = Number(value);
  if (!Number.isFinite(percentage)) {
    throw new Error('Allocation percentage must be a valid number');
  }
  if (percentage < 0 || percentage > 100) {
    throw new Error('Allocation percentage must be between 0 and 100');
  }
  return percentage;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, payload } = body;

    // A real app would check admin auth here, we assume admin since it's the admin panel
    
    if (action === 'create_project') {
      const { name, description, type, status, total_revenue } = payload;
      const { data, error } = await supabaseAdmin.from('projects').insert([{
        name,
        description: description || null,
        type: type || 'Project',
        status: status || 'active',
        total_revenue: total_revenue || 0,
      }]).select();
      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }
    
    if (action === 'add_user') {
      const { name, email, role, wallet_address, projectId, percentage } = payload;
      const normalizedPercentage = normalizePercentage(percentage || 0);

      if (projectId) {
        const currentAllocation = await getProjectAllocation(projectId);
        if (currentAllocation + normalizedPercentage > 100.000001) {
          throw new Error(`This project is already allocated to ${currentAllocation.toFixed(2)}%. Adding ${normalizedPercentage.toFixed(2)}% would exceed 100%.`);
        }
      }

      // Insert user
      const { data: user, error: userErr } = await supabaseAdmin.from('users').insert([{ name, email, role, wallet_address }]).select().single();
      if (userErr) throw userErr;
      
      // If projectId is provided, link to project_contributors
      if (projectId && user) {
        await supabaseAdmin.from('project_contributors').insert([{
          project_id: projectId,
          user_id: user.id,
          revenue_share: normalizedPercentage,
          role: role || 'contributor'
        }]);
      }
      return NextResponse.json({ success: true, user });
    }
    
    if (action === 'edit_project') {
      const { project_id, name, total_revenue } = payload;
      const { data, error } = await supabaseAdmin.from('projects')
        .update({ name, total_revenue })
        .eq('id', project_id);
      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    if (action === 'delete_project') {
      const { project_id } = payload;
      // Note: project_contributors and other linked data should be handled by DB foreign keys (on delete cascade)
      const { error } = await supabaseAdmin.from('projects').delete().eq('id', project_id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'delete_contributor') {
      const { contributor_id } = payload;
      const { error } = await supabaseAdmin.from('project_contributors').delete().eq('id', contributor_id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'edit_contributor') {
      const { contributor_id, user_id, percentage, name, wallet_address } = payload;
      const normalizedPercentage = percentage !== undefined ? normalizePercentage(percentage) : undefined;
      
      // Update project_contributors percentage
      if (contributor_id && normalizedPercentage !== undefined) {
        const { data: contributor, error: contributorErr } = await supabaseAdmin
          .from('project_contributors')
          .select('project_id')
          .eq('id', contributor_id)
          .single();
        if (contributorErr) throw contributorErr;

        const currentAllocation = await getProjectAllocation(contributor.project_id, contributor_id);
        if (currentAllocation + normalizedPercentage > 100.000001) {
          throw new Error(`This change would exceed 100% allocation for the project. Current other holders total ${currentAllocation.toFixed(2)}%.`);
        }

        const { error: cErr } = await supabaseAdmin.from('project_contributors')
          .update({ revenue_share: normalizedPercentage })
          .eq('id', contributor_id);
        if (cErr) throw cErr;
      }
      
      // Update user details
      if (user_id && (name || wallet_address)) {
        const update: any = {};
        if (name) update.name = name;
        if (wallet_address) update.wallet_address = wallet_address;
        
        const { error: uErr } = await supabaseAdmin.from('users')
          .update(update)
          .eq('id', user_id);
        if (uErr) throw uErr;
      }
      
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
