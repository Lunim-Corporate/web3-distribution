import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseServer';
import { PrivyClient } from '@privy-io/server-auth';
import { checkRateLimit } from '@/app/lib/rateLimit';

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID || '',
  process.env.PRIVY_APP_SECRET || ''
);

export async function POST(req: Request) {
  try {
    // Rate limit: auth tier (10 per minute)
    const blocked = await checkRateLimit('auth');
    if (blocked) return blocked;

    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { privyUser } = await req.json();

    if (!privyUser || !privyUser.email || !privyUser.email.address) {
      return NextResponse.json({ error: 'Invalid privyUser payload' }, { status: 400 });
    }

    const email = privyUser.email.address;

    // Verify Privy Access Token
    try {
      const verifiedClaims = await privy.verifyAuthToken(token);
      if (!verifiedClaims || verifiedClaims.userId !== privyUser.id) {
        return NextResponse.json({ error: 'Unauthorized: Invalid token claims or user ID mismatch' }, { status: 401 });
      }
    } catch (tokenErr: any) {
      console.error('[SECURITY] Privy token verification failed:', tokenErr);
      return NextResponse.json({ error: 'Unauthorized: Invalid Privy token' }, { status: 401 });
    }

    // 1. Find user in auth.users by email
    let supabaseUser = null;

    try {
      const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('get_user_id_by_email', {
        email_address: email,
      });

      if (rpcError && (rpcError.code === '42883' || rpcError.message?.includes('get_user_id_by_email'))) {
        // Fallback: RPC function does not exist, use listUsers() linear lookup
        const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) throw listError;
        supabaseUser = existingUsers.users.find(u => u.email === email) || null;
      } else if (rpcError) {
        throw rpcError;
      } else if (rpcData && rpcData.length > 0) {
        // We have the user ID from the RPC, fetch user by ID
        const { data: userData, error: getErr } = await supabaseAdmin.auth.admin.getUserById(rpcData[0].id);
        if (getErr) throw getErr;
        supabaseUser = userData.user;
      }
    } catch (err) {
      console.warn('Efficient email lookup failed, using listUsers fallback:', err);
      const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) throw listError;
      supabaseUser = existingUsers.users.find(u => u.email === email) || null;
    }

    // 2. If not found, create a dummy auth.users row
    if (!supabaseUser) {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: crypto.randomUUID(), // Random password they'll never use
        email_confirm: true,
        user_metadata: {
          name: email.split('@')[0],
          role: 'RIGHTS_HOLDER'
        }
      });
      
      if (createError) throw createError;
      supabaseUser = newUser.user;
    }

    // 3. Update or fetch their profile from users_profile
    const walletAddress = privyUser.wallet?.address || null;
    const walletType = privyUser.wallet?.walletClientType || 'privy';
    
    // Check if profile exists
    let { data: profile, error: profileError } = await supabaseAdmin
      .from('users_profile')
      .select('*')
      .eq('id', supabaseUser.id)
      .maybeSingle();

    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError;
    }

    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);

    const isDesignatedAdmin = adminEmails.includes(email.toLowerCase());

    if (profile) {
      const updates: Record<string, any> = {};

      if (walletAddress && profile.wallet_address !== walletAddress.toLowerCase()) {
        updates.wallet_address = walletAddress.toLowerCase();
        updates.wallet_type = walletType;
      }

      if (isDesignatedAdmin && profile.role !== 'ADMIN') {
        updates.role = 'ADMIN';
      }

      if (Object.keys(updates).length > 0) {
        const { data: updatedProfile, error: updateError } = await supabaseAdmin
          .from('users_profile')
          .update(updates)
          .eq('id', supabaseUser.id)
          .select()
          .single();

        if (!updateError && updatedProfile) {
          profile = updatedProfile;
        }
      }
    } else {
      const role = isDesignatedAdmin ? 'ADMIN' : 'RIGHTS_HOLDER';
      const { data: newProfile, error: insertError } = await supabaseAdmin
        .from('users_profile')
        .insert({
          id: supabaseUser.id,
          display_name: email.split('@')[0],
          role,
          wallet_address: walletAddress ? walletAddress.toLowerCase() : null,
          wallet_type: walletAddress ? walletType : null
        })
        .select()
        .single();

      if (!insertError && newProfile) {
        profile = newProfile;
      } else if (insertError) {
        console.error('Failed to insert fallback profile on sync:', insertError);
      }
    }

    // 4. Return the profile data
    // If handle_new_user trigger worked, profile should exist. 
    // If not, we still have the user ID.
    return NextResponse.json({
      user: profile || {
        id: supabaseUser.id,
        display_name: email.split('@')[0],
        role: 'RIGHTS_HOLDER'
      }
    });
  } catch (error: any) {
    console.error('Auth Sync Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
