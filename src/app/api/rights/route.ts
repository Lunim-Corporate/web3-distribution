import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/app/lib/supabaseServer';
import { requireAuth } from '@/app/lib/apiSecurity';
import { checkRateLimit } from '@/app/lib/rateLimit';
import { demoHolders } from '@/app/lib/demoData';

/**
 * GET /api/rights — Fetch rights holders.
 * 
 * Supports optional `project_id` query param to filter by project.
 * Uses the `rights_holders` table (the actual schema).
 * Previous implementation referenced a non-existent `creative_rights` table.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('project_id');

    // Rate limit: read tier
    const blocked = await checkRateLimit('read');
    if (blocked) return blocked;

    // Auth required
    await requireAuth();

    let data: any[] = [];
    if (isSupabaseConfigured()) {
      let query = supabaseAdmin
        .from('rights_holders')
        .select('*, projects(name)');
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      const { data: dbData, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      data = dbData || [];
    } else {
      data = demoHolders.map(h => ({
        ...h,
        projects: { name: h.project_id === 'demo-project-1' ? 'Neon Requiem' : 'The Salt Coast' }
      }));
    }

    const formatted = (data || []).map((r: any) => {
      const projectName = r.projects?.name || 'Unknown Project';
      return {
        id: String(r.id ?? ''),
        projectId: String(r.project_id ?? ''),
        projectName,
        rightsType: r.role || 'Contributor',
        owner: r.full_name || 'Unknown',
        ownerId: String(r.user_id ?? r.id ?? ''),
        revenueShare: Number(r.percentage ?? 0),
        walletAddress: r.wallet_address || '',
        totalReceived: Number(r.total_received ?? 0),
        status: 'active',
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error';
    if (msg === 'Unauthorized') {
      return NextResponse.json({ error: msg }, { status: 401 });
    }
    console.error('Error fetching rights:', error);
    return NextResponse.json({ error: 'Failed to fetch rights holders' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
