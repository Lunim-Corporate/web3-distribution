import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/app/lib/supabaseServer';
import { requireAuth } from '@/app/lib/apiSecurity';
import { checkRateLimit } from '@/app/lib/rateLimit';
import { demoProjects } from '@/app/lib/demoData';

export async function GET() {
  try {
    const blocked = await checkRateLimit('read');
    if (blocked) return blocked;

    await requireAuth();

    let data: any[] = [];
    if (isSupabaseConfigured()) {
      const { data: dbData, error } = await supabaseAdmin
        .from('projects')
        .select('*')
        .ilike('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      data = dbData || [];
    } else {
      data = demoProjects;
    }

    return NextResponse.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error';
    if (msg === 'Unauthorized') return NextResponse.json({ error: msg }, { status: 401 });
    console.error('Error fetching projects:', e);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
