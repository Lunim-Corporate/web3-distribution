import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/app/lib/supabaseServer';
import { requireAdmin, auditLog } from '@/app/lib/apiSecurity';
import { checkRateLimit } from '@/app/lib/rateLimit';

export async function GET() {
  try {
    const blocked = await checkRateLimit('read');
    if (blocked) return blocked;

    await requireAdmin();

    const configured = isSupabaseConfigured();
    if (!configured) {
      return NextResponse.json([
        {
          id: 'demo-admin-id',
          display_name: 'Demo Admin',
          role: 'ADMIN',
          wallet_address: '0x7C4B53DeBd4fa41Ce7fB0aC3CA25aa3243675fDE',
          wallet_type: 'local',
          created_at: new Date().toISOString()
        },
        {
          id: 'user-aria',
          display_name: 'Aria Vance',
          role: 'RIGHTS_HOLDER',
          wallet_address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
          wallet_type: 'metamask',
          created_at: new Date().toISOString()
        }
      ]);
    }

    const { data: users, error } = await supabaseAdmin
      .from('users_profile')
      .select('id, display_name, role, wallet_address, wallet_type, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    return NextResponse.json(users);
  } catch (err: any) {
    if (err.message === 'Unauthorized' || err.message === 'Forbidden: Admins only') {
      return NextResponse.json({ error: err.message }, { status: err.message === 'Unauthorized' ? 401 : 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const blocked = await checkRateLimit('sensitive');
    if (blocked) return blocked;

    const admin = await requireAdmin();

    const { user_id, role } = await req.json();

    if (!user_id || !role) {
      return NextResponse.json({ error: 'Missing user_id or role' }, { status: 400 });
    }

    const validRoles = ['ADMIN', 'RIGHTS_HOLDER'];
    if (!validRoles.includes(role.toUpperCase())) {
      return NextResponse.json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` }, { status: 400 });
    }

    const configured = isSupabaseConfigured();
    if (!configured) {
      return NextResponse.json({
        id: user_id,
        display_name: user_id === 'demo-admin-id' ? 'Demo Admin' : 'Aria Vance',
        role: role.toUpperCase()
      });
    }

    const { data: updated, error } = await supabaseAdmin
      .from('users_profile')
      .update({ role: role.toUpperCase() })
      .eq('id', user_id)
      .select('id, display_name, role')
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
    }

    await auditLog('admin:update_role', admin.id, true, `target=${user_id} new_role=${role}`);

    return NextResponse.json(updated);
  } catch (err: any) {
    if (err.message === 'Unauthorized' || err.message === 'Forbidden: Admins only') {
      return NextResponse.json({ error: err.message }, { status: err.message === 'Unauthorized' ? 401 : 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
