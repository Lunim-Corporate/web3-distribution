import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseServer';
import { requireAdmin } from '@/app/lib/apiSecurity';
import { checkRateLimit } from '@/app/lib/rateLimit';
import { validateBody, updateUserRoleSchema } from '@/app/lib/validation';

export async function GET() {
  try {
    const blocked = await checkRateLimit('read');
    if (blocked) return blocked;

    // Admin only — user listing is sensitive
    await requireAdmin();

    const { data, error } = await supabaseAdmin.from('users_profile').select('*');
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg === 'Unauthorized' || msg === 'Forbidden: Admins only') {
      return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const blocked = await checkRateLimit('write');
    if (blocked) return blocked;

    // Admin only
    await requireAdmin();

    // Validate input
    const result = await validateBody(req, updateUserRoleSchema);
    if (result.error) return result.response;

    const { userId, role } = result.data;

    const { error } = await supabaseAdmin
      .from('users_profile')
      .update({ role: role.toUpperCase() })
      .eq('id', userId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg === 'Unauthorized' || msg === 'Forbidden: Admins only') {
      return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
