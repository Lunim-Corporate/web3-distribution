import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { checkRateLimit } from '@/app/lib/rateLimit';
import { z } from 'zod';

const signupSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

export async function POST(request: Request) {
  try {
    const blocked = await checkRateLimit('auth');
    if (blocked) return blocked;

    const body = await request.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.errors }, { status: 400 });
    }

    const { name, email, password } = parsed.data;

    // Create Supabase admin client with service role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDA0ODgwMDAsImV4cCI6MTkxNjA2NDAwMH0.placeholder-key',
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
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: 'Failed to create user profile. Please try again.' },
        { status: 500 }
      );
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
