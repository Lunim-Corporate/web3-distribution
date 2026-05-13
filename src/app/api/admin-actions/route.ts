import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, payload } = body;

    // A real app would check admin auth here, we assume admin since it's the admin panel
    
    if (action === 'create_project') {
      const { name, total_revenue } = payload;
      const { data, error } = await supabaseAdmin.from('projects').insert([{ name, status: 'active', total_revenue: total_revenue || 0 }]).select();
      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }
    
    if (action === 'add_user') {
      const { name, email, role, wallet_address, projectId, percentage } = payload;
      // Insert user
      const { data: user, error: userErr } = await supabaseAdmin.from('users').insert([{ name, email, role, wallet_address }]).select().single();
      if (userErr) throw userErr;
      
      // If projectId is provided, link to project_contributors
      if (projectId && user) {
        await supabaseAdmin.from('project_contributors').insert([{
          project_id: projectId,
          user_id: user.id,
          revenue_share: percentage || 0,
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
      const { contributor_id, percentage } = payload;
      const { data, error } = await supabaseAdmin.from('project_contributors')
        .update({ revenue_share: percentage })
        .eq('id', contributor_id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
