import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseServer';
import { PrivyClient } from '@privy-io/server-auth';
import { checkRateLimit } from '@/app/lib/rateLimit';

const DEMO_WALLETS = [
  '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
  '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
  '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
  '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
  '0x976EA74026E726554dB657fA54763abd0C3a0aa9',
  '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955',
  '0x23618e81E3f5cdF7f94C6C2E3eA1b8B7d8F7c8b9',
  '0xa0Ee7A142d267C1f36714E4a8F75612F20a79720',
];

async function seedDemoDataForAdmin(adminUserId: string) {
  const { count, error: countError } = await supabaseAdmin
    .from('projects')
    .select('*', { count: 'exact', head: true });

  if (countError || (count ?? 0) > 0) return;

  const projects = [
    {
      name: 'Neon Requiem',
      genre: 'Sci-Fi Thriller',
      description: 'A rogue AI infiltrates a megacity\'s neural grid, forcing a burned intelligence officer to confront her own manufactured memories.',
      status: 'active',
      holders: [
        { full_name: 'Aria Voss', role: 'Director', percentage: 25, wallet_address: DEMO_WALLETS[0] },
        { full_name: 'Marcus Delgado', role: 'Lead Actor', percentage: 20, wallet_address: DEMO_WALLETS[1] },
        { full_name: 'Priya Nair', role: 'Producer', percentage: 15, wallet_address: DEMO_WALLETS[2] },
        { full_name: 'Theo Harrington', role: 'Music Composer', percentage: 15, wallet_address: DEMO_WALLETS[3] },
        { full_name: 'Simone Okafor', role: 'Screenplay Writer', percentage: 15, wallet_address: DEMO_WALLETS[4] },
        { full_name: 'Pete (Admin)', role: 'Administrator', percentage: 5, wallet_address: null },
        { full_name: 'freewhynane62 (Admin)', role: 'Administrator', percentage: 5, wallet_address: null },
        { full_name: 'jeevesh039 (Admin)', role: 'Administrator', percentage: 5, wallet_address: null },
      ],
      activities: [
        'Neon Requiem project created and rights holders assigned.',
        'Aria Voss assigned as Director (25%)',
        'Marcus Delgado assigned as Lead Actor (20%)',
        'Priya Nair assigned as Producer (15%)',
        'Demo distribution of 2.50 ETH ($8,000.00) for Neon Requiem',
        'Milestone: Principal Photography — Q3 2025',
      ],
    },
    {
      name: 'Aether Drift',
      genre: 'Cyberpunk Noir',
      description: 'In a neon-drenched megacity, a disgraced hacker uncovers a corporate conspiracy that blurs the line between reality and simulation.',
      status: 'active',
      holders: [
        { full_name: 'Kai Nakamura', role: 'Director', percentage: 25, wallet_address: DEMO_WALLETS[5] },
        { full_name: 'Lena Oshiro', role: 'Lead Actress', percentage: 20, wallet_address: DEMO_WALLETS[6] },
        { full_name: 'Rico Martinez', role: 'Producer', percentage: 15, wallet_address: DEMO_WALLETS[7] },
        { full_name: 'Zara Khan', role: 'Music Composer', percentage: 15, wallet_address: DEMO_WALLETS[8] },
        { full_name: 'Dmitri Volkov', role: 'Screenplay Writer', percentage: 15, wallet_address: DEMO_WALLETS[9] },
        { full_name: 'freewhynane62 (Admin)', role: 'Administrator', percentage: 5, wallet_address: null },
        { full_name: 'jeevesh039 (Admin)', role: 'Administrator', percentage: 5, wallet_address: null },
      ],
      activities: [
        'Aether Drift project created and rights holders assigned.',
        'Kai Nakamura assigned as Director (25%)',
        'Lena Oshiro assigned as Lead Actress (20%)',
        'Rico Martinez assigned as Producer (15%)',
        'Demo distribution of 1.75 ETH ($5,600.00) for Aether Drift',
        'Milestone: Final Cut — Q1 2026',
      ],
    },
  ];

  for (const p of projects) {
    const { data: project, error: projectErr } = await supabaseAdmin
      .from('projects')
      .insert({
        name: p.name,
        genre: p.genre,
        description: p.description,
        status: p.status,
        total_distributed: 0,
      })
      .select('id')
      .single();

    if (projectErr || !project) {
      console.warn(`[SEED] Failed to create project ${p.name}:`, projectErr?.message);
      continue;
    }

    for (const h of p.holders) {
      await supabaseAdmin.from('rights_holders').insert({
        project_id: project.id,
        full_name: h.full_name,
        role: h.role,
        percentage: h.percentage,
        wallet_address: h.wallet_address,
      });
    }

    for (const desc of p.activities) {
      await supabaseAdmin.from('activities').insert({
        project_id: project.id,
        action: 'auto_seeded',
        description: desc,
        timestamp: new Date().toISOString(),
      });
    }
  }

  console.log(`[SEED] Demo data seeded for admin user ${adminUserId}`);
}

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
        if (isDesignatedAdmin) {
          seedDemoDataForAdmin(supabaseUser.id).catch(err =>
            console.warn('[SEED] Auto-seed failed (non-blocking):', err?.message)
          );
        }
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
