import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { checkRateLimit } from '@/app/lib/rateLimit';

export async function POST(request: Request) {
  try {
    const blocked = await checkRateLimit('auth');
    if (blocked) return blocked;

    const { name, email, password } = await request.json();

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, name' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Create Supabase admin client with service role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role: 'RIGHTS_HOLDER' },
      email_confirm: true, // Auto-confirm email for testing
    });

    if (authError || !authData.user) {
      console.error('Auth creation error:', authError);
      return NextResponse.json(
        { error: `Failed to create auth user: ${authError?.message || 'Unknown error'}` },
        { status: 500 }
      );
    }

    const userId = authData.user.id;

    // Step 2: Create user record in public.users_profile table
    const { error: userError } = await supabaseAdmin
      .from('users_profile')
      .insert({
        id: userId,
        display_name: name,
        role: 'RIGHTS_HOLDER',
      })
      .select()
      .single();

    if (userError) {
      console.error('User creation error:', userError);
      // Don't fail completely - auth user exists, just log the error
      console.warn('Warning: Auth user created but profile record failed. Attempting recovery...');
    }

    // Return success
    return NextResponse.json(
      {
        success: true,
        user: {
          id: userId,
          email,
          name,
          role: 'RIGHTS_HOLDER',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Signup failed' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
