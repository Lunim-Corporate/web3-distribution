import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(
  _req: Request,
  { params }: { params: { name: string } }
) {
  try {
    const name = params.name;
    if (!name) {
      return NextResponse.json({ error: 'missing name' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('projects')
      .select('id,name,description,total_revenue,created_at,cover_image,status,progress')
      .ilike('name', `%${name}%`)
      .limit(1)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: 'not found' }, { status: 404 });
    }

    return NextResponse.json({ project: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
export const dynamic = 'force-dynamic';
