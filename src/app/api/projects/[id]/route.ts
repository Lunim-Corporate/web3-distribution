import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabaseServer';
import { requireAdmin, requireAuth } from '@/app/lib/apiSecurity';
import { checkRateLimit } from '@/app/lib/rateLimit';
import { z } from 'zod';
import { safeString } from '@/app/lib/validation';
import { demoProjects, demoHolders } from '@/app/lib/demoData';

const updateProjectSchema = z.object({
  name: safeString(200).optional(),
  genre: safeString(100).optional(),
  description: safeString(2000).optional(),
  status: z.enum(['active', 'completed', 'upcoming']).optional(),
});

async function getProject(id: string) {
  const { data, error } = await supabaseAdmin
    .from('projects')
    .select('*, project_contributors(*, users(*))')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

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

    if (!isSupabaseConfigured()) {
      const demoProj = demoProjects.find(p => p.id === id);
      if (!demoProj) {
        return NextResponse.json({ error: 'not found' }, { status: 404 });
      }
      const projectHolders = demoHolders.filter(h => h.project_id === id);
      return NextResponse.json({
        data: {
          ...demoProj,
          project_contributors: projectHolders
        }
      });
    }

    const data = await getProject(id);
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

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const blocked = await checkRateLimit('write');
    if (blocked) return blocked;

    await requireAdmin();

    const id = params.id;
    if (!id) {
      return NextResponse.json({ error: 'missing id' }, { status: 400 });
    }

    const body = await req.json();
    const parsed = updateProjectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.errors },
        { status: 400 }
      );
    }

    // Fallback sandbox check
    if (!isSupabaseConfigured()) {
      if (id === 'demo-project-1' || id === 'demo-project-2') {
        return NextResponse.json({ error: 'Cannot modify system demo projects.' }, { status: 403 });
      }
      return NextResponse.json({
        success: true,
        data: {
          id,
          name: parsed.data.name,
          genre: parsed.data.genre,
          status: parsed.data.status || 'active',
          updated_at: new Date().toISOString()
        }
      });
    }

    // Protection check 1: System demo projects by name
    const { data: thisProj } = await supabaseAdmin
      .from('projects')
      .select('name')
      .eq('id', id)
      .maybeSingle();

    if (thisProj && ['Neon Requiem', 'Aether Drift', 'LUNIM Genesis', 'The Salt Coast'].includes(thisProj.name)) {
      return NextResponse.json({ error: 'Cannot modify system demo projects.' }, { status: 403 });
    }

    // Protection check 2: Projects containing any rights holders that are admins
    const { data: projectHolders } = await supabaseAdmin
      .from('rights_holders')
      .select('email, role')
      .eq('project_id', id);

    const hasAdmin = (projectHolders || []).some(
      h => (h.email && ['pete@tabb.cc', 'freewhynane62@gmail.com', 'jeevesh039@gmail.com'].includes(h.email.toLowerCase())) || 
           (h.role && h.role.toLowerCase().includes('admin'))
    );

    if (hasAdmin) {
      return NextResponse.json({ error: 'Cannot modify projects containing administrator accounts.' }, { status: 403 });
    }

    const updateData: Record<string, any> = {};
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
    if (parsed.data.genre !== undefined) updateData.genre = parsed.data.genre;
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
    if (parsed.data.status !== undefined) updateData.status = parsed.data.status;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updateData.updated_at = new Date().toISOString();

    const { error } = await supabaseAdmin
      .from('projects')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;

    const updated = await getProject(id);
    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
