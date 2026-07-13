import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/app/lib/apiSecurity';
import { checkRateLimit } from '@/app/lib/rateLimit';
import { z } from 'zod';
import crypto from 'crypto';

const inviteSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().trim().min(1, 'Name is required').max(200),
  role: z.enum(['RIGHTS_HOLDER', 'ADMIN']),
});

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@updates.lunim.io';

export async function POST(request: Request) {
  try {
    // Rate limit: write tier
    const blocked = await checkRateLimit('write');
    if (blocked) return blocked;

    await requireAdmin();
    const body = await request.json();
    const parsed = inviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.errors }, { status: 400 });
    }

    const { email, name, role } = parsed.data;

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Generate cryptographically secure temp password
    const tempPassword = crypto.randomBytes(12).toString('base64url');

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      user_metadata: { name, role },
      email_confirm: true,
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: `Failed to create user: ${authError?.message}` },
        { status: 500 }
      );
    }

    const userId = authData.user.id;

    // Create user in public map
    const { error: userError } = await supabaseAdmin
      .from('users_profile')
      .insert({
        id: userId,
        display_name: name,
        role: (role || 'RIGHTS_HOLDER').toUpperCase(),
      });

    if (userError) {
      console.warn('Warning: could not insert into public.users', userError);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: 'Failed to create user profile. Please try again.' }, { status: 500 });
    }

    // Attempt to invoke Resend
    if (RESEND_API_KEY) {
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `Creative Rights Tracker <${EMAIL_FROM}>`,
          to: [email],
          subject: 'You have been invited to Creative Rights Tracker',
          html: `
            <div style="font-family: sans-serif; max-w-xl; margin: 0 auto;">
              <h2>Welcome to the LUNIM Pipeline!</h2>
              <p>Hi ${name},</p>
              <p>You have been formally invited to join the Creative Rights Tracker dashboard as a <strong>${role}</strong>.</p>
              <p>You can securely log in at <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login">our platform</a> using the following credentials:</p>
              <ul style="background: #f4f4f4; padding: 16px; border-radius: 8px;">
                <li><strong>Email:</strong> ${email}</li>
                <li><strong>Temporary Password:</strong> ${tempPassword}</li>
              </ul>
              <p>Please log in to claim your revenue distribution and rights mapping.</p>
            </div>
          `
        })
      });

      if (!emailResponse.ok) {
        const err = await emailResponse.text();
        console.error('Failed to send email via Resend:', err);
      }
    }

    return NextResponse.json({ success: true, user: { id: userId, email, name, role } }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error occurred';
    if (msg === 'Unauthorized' || msg === 'Forbidden: Admins only') {
      return NextResponse.json({ error: msg }, { status: 401 });
    }
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
