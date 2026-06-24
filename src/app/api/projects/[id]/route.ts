import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { requireAuth } from '@/app/lib/apiSecurity';
import { checkRateLimit } from '@/app/lib/rateLimit';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const blocked = await checkRateLimit('read');
    if (blocked) return blocked;

    await requireAuth();

    const id = params.id;
    if (!id) {
      return NextResponse.json({ error: 'missing id' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('projects')
      .select('*, project_contributors(*, users(*))')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: 'not found' }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
export const dynamic = 'force-dynamic';
