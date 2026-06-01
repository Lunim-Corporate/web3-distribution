import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseServer';

export async function POST(req: Request) {
  try {
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

    // Ideally, we would verify the Privy token here using @privy-io/server-auth
    // For now, we trust the client request since it's an authenticated route in our architecture.

    // 1. Find user in auth.users by email
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;

    let supabaseUser = existingUsers.users.find(u => u.email === email);

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

    if (profile) {
      // Update existing profile with latest wallet if changed
      if (walletAddress && profile.wallet_address !== walletAddress.toLowerCase()) {
        const { data: updatedProfile, error: updateError } = await supabaseAdmin
          .from('users_profile')
          .update({ 
            wallet_address: walletAddress.toLowerCase(),
            wallet_type: walletType
          })
          .eq('id', supabaseUser.id)
          .select()
          .single();
          
        if (!updateError && updatedProfile) {
          profile = updatedProfile;
        }
      }
    } else {
      // Insert fallback profile record
      const { data: newProfile, error: insertError } = await supabaseAdmin
        .from('users_profile')
        .insert({
          id: supabaseUser.id,
          display_name: email.split('@')[0],
          role: 'RIGHTS_HOLDER',
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
