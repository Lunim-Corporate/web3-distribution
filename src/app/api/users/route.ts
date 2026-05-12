import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseServer';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.from('users_profile').select('*');
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    // In a real app, verify the caller's admin status via Privy token here
    const { userId, role } = await req.json();
    if (!userId || !role) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('users_profile')
      .update({ role: role.toUpperCase() })
      .eq('id', userId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
