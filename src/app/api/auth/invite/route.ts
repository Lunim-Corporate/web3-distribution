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
  projectId: z.string().trim().optional().or(z.literal('')),
  projectName: z.string().trim().max(100).optional().or(z.literal('')),
});

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@updates.lunim.io';

export async function POST(request: Request) {
  try {
    // Rate limit: write tier
    const blocked = await checkRateLimit('write');
    if (blocked) return blocked;

    const adminUser = await requireAdmin();
    const body = await request.json();
    const parsed = inviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.errors }, { status: 400 });
    }

    const { email, name, role, projectId, projectName } = parsed.data;

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Validate and determine project mapping
    let finalProjectId: string | null = null;

    if (projectId) {
      // Validate UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(projectId)) {
        return NextResponse.json({ error: 'Invalid Project ID format.' }, { status: 400 });
      }

      // Check if project exists
      const { data: projExists, error: projCheckErr } = await supabaseAdmin
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .maybeSingle();

      if (projCheckErr) {
        console.error('Project verification error:', projCheckErr);
      }
      
      if (!projExists) {
        return NextResponse.json({ error: 'Selected project does not exist.' }, { status: 404 });
      }
      finalProjectId = projectId;
    } else if (projectName) {
      // Create new project placeholder
      const { data: newProj, error: newProjErr } = await supabaseAdmin
        .from('projects')
        .insert({
          name: projectName,
          genre: 'General',
          description: `Placeholder project created via invitation for ${name}`,
          status: 'active',
          total_distributed: 0,
        })
        .select('id')
        .single();

      if (newProjErr || !newProj) {
        console.error('Failed to create new project from invitation:', newProjErr);
        return NextResponse.json({ error: `Failed to create new project: ${newProjErr?.message}` }, { status: 500 });
      }
      finalProjectId = newProj.id;
    }

    // Generate cryptographically secure temp password (required for Supabase Auth creation)
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

    // Link user to project as rights holder if project is selected/created
    if (finalProjectId) {
      const { error: holderError } = await supabaseAdmin
        .from('rights_holders')
        .insert({
          project_id: finalProjectId,
          full_name: name,
          role: role === 'ADMIN' ? 'Administrator' : 'Contributor',
          wallet_address: '0x0000000000000000000000000000000000000000', // placeholder until user connects wallet
          percentage: 0, // starts at 0% allowing admin to customize distribution in roster later
          total_received: 0,
          email: email.toLowerCase(),
          user_id: userId,
          status: 'ACTIVE'
        });

      if (holderError) {
        console.warn('Warning: could not insert into rights_holders', holderError);
        // Do not fail the whole invite process, profile is still created.
      }
    }

    // Generate verification token and insert record into invites table
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const sentBy = uuidRegex.test(adminUser.id) ? adminUser.id : null;

    const { error: inviteError } = await supabaseAdmin
      .from('invites')
      .insert({
        email: email.toLowerCase(),
        role: role.toUpperCase(),
        project_id: finalProjectId,
        token: inviteToken,
        status: 'pending',
        sent_by: sentBy,
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48 hours validity
      });

    if (inviteError) {
      console.warn('Warning: could not insert into invites table', inviteError);
    }

    // Attempt to invoke Resend
    if (RESEND_API_KEY) {
      const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`;
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
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
              <h2 style="color: #4f46e5; margin-bottom: 16px;">Welcome to the LUNIM Pipeline!</h2>
              <p>Hi ${name},</p>
              <p>You have been formally invited to join the Creative Rights Tracker dashboard as a <strong>${role === 'ADMIN' ? 'Administrator' : 'Rights Holder'}</strong>.</p>
              <p>To access your account, simply navigate to the platform login page:</p>
              <p style="margin: 24px 0;">
                <a href="${loginUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Log In to Platform</a>
              </p>
              <p><strong>Note:</strong> We support secure, passwordless logins. Simply continue with your Google account or request an email verification code (OTP) using the email address where you received this invitation: <strong>${email}</strong>.</p>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
              <p style="font-size: 12px; color: #64748b;">This invitation was authorized by LUNIM Network Admin and will expire in 48 hours.</p>
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
    console.error('Invitation route error:', error);
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
