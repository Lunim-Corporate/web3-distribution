import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/app/lib/supabaseServer';
import { requireAuth } from '@/app/lib/apiSecurity';
import { checkRateLimit } from '@/app/lib/rateLimit';

export async function GET() {
  try {
    const blocked = await checkRateLimit('read');
    if (blocked) return blocked;

    await requireAuth();

    const configured = isSupabaseConfigured();
    if (!configured) {
      return NextResponse.json([]);
    }

    const { data, error } = await supabaseAdmin
      .from('activities')
      .select('*')
      .order('timestamp', { ascending: true });

    if (error) {
      // If milestones table doesn't exist, derive from activities
      const { data: activities } = await supabaseAdmin
        .from('activities')
        .select('*, projects(name)')
        .eq('action', 'milestone')
        .order('timestamp', { ascending: true });

      return NextResponse.json(activities || []);
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    const msg = error instanceof Error ? error.message : 'Error';
    if (msg === 'Unauthorized') return NextResponse.json({ error: msg }, { status: 401 });
    console.error('Error fetching milestones:', error);
    return NextResponse.json({ error: 'Failed to fetch milestones' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
