import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/app/lib/supabaseServer';
import { requireAdmin } from '@/app/lib/apiSecurity';
import { checkRateLimit } from '@/app/lib/rateLimit';
import { validateBody, addProjectSchema } from '@/app/lib/validation';
import { clearCache } from '@/app/lib/requestCache';

export async function POST(req: Request) {
  try {
    const blocked = await checkRateLimit('write');
    if (blocked) return blocked;

    await requireAdmin();

    const result = await validateBody(req, addProjectSchema);
    if (result.error) return result.response;

    const { name, genre, description, status } = result.data;

    const configured = isSupabaseConfigured();
    if (!configured) {
      clearCache();
      return NextResponse.json({
        id: `demo-project-${Date.now()}`,
        name,
        genre: genre || 'Entertainment',
        description: description || '',
        status: status || 'active',
        total_distributed: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    const { data, error } = await supabaseAdmin
      .from('projects')
      .insert({
        name,
        genre: genre || 'Entertainment',
        description: description || '',
        status: status || 'active',
        total_distributed: 0,
      })
      .select()
      .single();

    if (error) throw error;

    clearCache();

    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Project creation error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
