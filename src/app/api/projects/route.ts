import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { requireAuth } from '@/lib/apiSecurity';

export async function GET() {
  try {
    await requireAuth();
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .ilike('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error';
    if (msg === 'Unauthorized') return NextResponse.json({ error: msg }, { status: 401 });
    return NextResponse.json([], { status: 200 });
  }
}

export const dynamic = 'force-dynamic';
