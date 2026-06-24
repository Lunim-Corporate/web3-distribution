import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseServer';
import { requireAdmin } from '@/app/lib/apiSecurity';

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const { name, genre, status } = await req.json();

    if (!name) return NextResponse.json({ error: 'Project name is required' }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('projects')
      .insert({
        name,
        genre: genre || 'Entertainment',
        status: status || 'active',
        total_distributed: 0
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Project creation error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
