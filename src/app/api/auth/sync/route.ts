import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseServer';
import { PrivyClient } from '@privy-io/server-auth';
import { checkRateLimit } from '@/app/lib/rateLimit';

const DEMO_WALLETS: string[] = [
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

const ADMIN_PROJECT_TEMPLATES: Record<string, {
  name: string;
  genre: string;
  description: string;
  adminLabel: string;
  activities: string[];
}> = {
  'pete@tabb.cc': {
    name: 'Neon Requiem',
    genre: 'Sci-Fi Thriller',
    description: 'A rogue AI infiltrates a megacity\'s neural grid, forcing a burned intelligence officer to confront her own manufactured memories.',
    adminLabel: 'Pete (Admin)',
    activities: [
      'Neon Requiem project created and rights holders assigned.',
      'Aria Voss assigned as Director (25%)',
      'Marcus Delgado assigned as Lead Actor (20%)',
      'Priya Nair assigned as Producer (15%)',
      'Demo distribution of 2.50 ETH ($8,000.00) for Neon Requiem',
      'Milestone: Principal Photography — Q3 2025',
    ],
  },
  'freewhynane62@gmail.com': {
    name: 'Aether Drift',
    genre: 'Cyberpunk Noir',
    description: 'In a neon-drenched megacity, a disgraced hacker uncovers a corporate conspiracy that blurs the line between reality and simulation.',
    adminLabel: 'freewhynane62 (Admin)',
    activities: [
      'Aether Drift project created and rights holders assigned.',
      'Kai Nakamura assigned as Director (25%)',
      'Lena Oshiro assigned as Lead Actress (20%)',
      'Rico Martinez assigned as Producer (15%)',
      'Demo distribution of 1.75 ETH ($5,600.00) for Aether Drift',
      'Milestone: Final Cut — Q1 2026',
    ],
  },
  'jeevesh039@gmail.com': {
    name: 'LUNIM Genesis',
    genre: 'Experimental',
    description: 'A pioneering Web3-native creative project exploring decentralized revenue distribution and smart contract rights management.',
    adminLabel: 'jeevesh039 (Admin)',
    activities: [
      'LUNIM Genesis project created and rights holders assigned.',
      'Alex Chen assigned as Director (25%)',
      'Maya Rivera assigned as Lead Producer (20%)',
      'Demo distribution of 2.00 ETH ($6,400.00) for LUNIM Genesis',
      'Milestone: Platform Launch — Q2 2026',
    ],
  },
};

// All admin email ↔ label mappings (used to cross-list admins in every project)
const ALL_ADMINS: { label: string; email: string }[] = (() => {
  try {
    return JSON.parse(process.env.ADMIN_EMAILS_JSON || '[]');
  } catch {
    return [];
  }
})();

function getKnownAdminEmails(): string[] {
  return ALL_ADMINS.map(a => a.email.toLowerCase());
}

// Holder templates: 5 creative roles (90%) + 3 admins (5% + 3% + 2% = 10%)
const HOLDER_TEMPLATES = [
  { full_name: 'Aria Voss', role: 'Director', percentage: 25, wallet_address: DEMO_WALLETS[0], email: null as string | null },
  { full_name: 'Marcus Delgado', role: 'Lead Actor', percentage: 20, wallet_address: DEMO_WALLETS[1], email: null as string | null },
  { full_name: 'Priya Nair', role: 'Producer', percentage: 15, wallet_address: DEMO_WALLETS[2], email: null as string | null },
  { full_name: 'Theo Harrington', role: 'Music Composer', percentage: 15, wallet_address: DEMO_WALLETS[3], email: null as string | null },
  { full_name: 'Simone Okafor', role: 'Screenplay Writer', percentage: 15, wallet_address: DEMO_WALLETS[4], email: null as string | null },
  // Admin slots — filled dynamically with the triggering admin getting 5%, others 3% and 2%
  { full_name: '__ADMIN_PRIMARY__', role: 'Administrator', percentage: 5, wallet_address: null as string | null, email: null as string | null },
  { full_name: '__ADMIN_SECONDARY__', role: 'Administrator', percentage: 3, wallet_address: null as string | null, email: null as string | null },
  { full_name: '__ADMIN_TERTIARY__', role: 'Administrator', percentage: 2, wallet_address: null as string | null, email: null as string | null },
];

async function seedDemoDataForAdmin(adminEmail: string) {
  const adminKey = adminEmail.toLowerCase();

  // Check if this admin already has a project (by email match in rights_holders)
  const { data: existing } = await supabaseAdmin
    .from('rights_holders')
    .select('project_id')
    .eq('email', adminKey)
    .limit(1);

  if (existing && existing.length > 0) return;

  const template = ADMIN_PROJECT_TEMPLATES[adminKey];
  if (!template) return;

  const { data: project, error: projectErr } = await supabaseAdmin
    .from('projects')
    .insert({
      name: template.name,
      genre: template.genre,
      description: template.description,
      status: 'active',
      total_distributed: 0,
    })
    .select('id')
    .single();

  if (projectErr || !project) {
    console.warn(`[SEED] Failed to create project ${template.name}:`, projectErr?.message);
    return;
  }

  // Build admin ordering: primary = triggering admin, secondary + tertiary = the other two
  const otherAdmins = ALL_ADMINS.filter(a => a.email.toLowerCase() !== adminKey);
  const adminSlots: Record<string, { label: string; email: string }> = {
    '__ADMIN_PRIMARY__': { label: template.adminLabel, email: adminKey },
    '__ADMIN_SECONDARY__': otherAdmins[0] || { label: 'Admin 2', email: '' },
    '__ADMIN_TERTIARY__': otherAdmins[1] || { label: 'Admin 3', email: '' },
  };

  for (const h of HOLDER_TEMPLATES) {
    const adminSlot = adminSlots[h.full_name];
    await supabaseAdmin.from('rights_holders').insert({
      project_id: project.id,
      full_name: adminSlot ? adminSlot.label : h.full_name,
      role: h.role,
      percentage: h.percentage,
      wallet_address: h.wallet_address,
      email: adminSlot ? adminSlot.email : null,
    });
  }

  for (const desc of template.activities) {
    await supabaseAdmin.from('activities').insert({
      project_id: project.id,
      action: 'auto_seeded',
      description: desc,
      timestamp: new Date().toISOString(),
    });
  }

  console.log(`[SEED] Demo project "${template.name}" seeded for admin ${adminEmail} (all 3 admins cross-listed)`);
}


const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID || '',
  process.env.PRIVY_APP_SECRET || ''
);

// In-memory cache for user list lookup fallback
let cachedUserList: any[] | null = null;
let cachedUserListTime = 0;
const USER_LIST_TTL = 5 * 60 * 1000; // 5 minutes

async function getOrFetchUserList() {
  if (!cachedUserList || Date.now() - cachedUserListTime > USER_LIST_TTL) {
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;
    cachedUserList = existingUsers?.users || [];
    cachedUserListTime = Date.now();
  }
  return cachedUserList;
}

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

    if (!privyUser) {
      return NextResponse.json({ error: 'Invalid privyUser payload' }, { status: 400 });
    }

    let email: string;
    let isWalletOnly = false;

    if (privyUser.email?.address) {
      email = privyUser.email.address;
    } else if (privyUser.wallet?.address) {
      email = `wallet_${privyUser.wallet.address.toLowerCase()}@lunim.internal`;
      isWalletOnly = true;
    } else {
      return NextResponse.json({ error: 'Email or wallet address required' }, { status: 400 });
    }

    // Verify Privy Access Token
    if (process.env.PRIVY_APP_SECRET) {
      try {
        const verifiedClaims = await privy.verifyAuthToken(token);
        if (verifiedClaims && verifiedClaims.userId !== privyUser.id) {
          console.warn('[SECURITY] Privy user ID mismatch:', verifiedClaims.userId, privyUser.id);
        }
      } catch (tokenErr: any) {
        console.warn('[SECURITY] Privy token verification warning:', tokenErr?.message || tokenErr);
      }
    }

    // 1. Find user in auth.users by email
    let supabaseUser = null;

    try {
      const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('get_user_id_by_email', {
        email_address: email,
      });

      if (rpcError && (rpcError.code === '42883' || rpcError.message?.includes('get_user_id_by_email'))) {
        // Fallback: RPC function does not exist, use listUsers() linear lookup
        const existingUsers = await getOrFetchUserList();
        supabaseUser = existingUsers.find(u => u.email === email) || null;
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
      try {
        const existingUsers = await getOrFetchUserList();
        supabaseUser = existingUsers.find(u => u.email === email) || null;
      } catch (listErr) {
        console.error('List users fallback also failed:', listErr);
      }
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
      cachedUserList = null; // Invalidate cache so next request includes the new user
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

    const originalEmail = privyUser.email?.address?.toLowerCase() || null;

    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);

    const knownAdminEmails = getKnownAdminEmails();

    const isDesignatedAdmin = !isWalletOnly && originalEmail !== null && (
      adminEmails.includes(originalEmail) ||
      knownAdminEmails.includes(originalEmail)
    );

    if (profile) {
      const updates: Record<string, any> = {};

      if (walletAddress && profile.wallet_address !== walletAddress.toLowerCase()) {
        updates.wallet_address = walletAddress.toLowerCase();
        updates.wallet_type = walletType;
      }

      if (isDesignatedAdmin && profile.role !== 'ADMIN') {
        updates.role = 'ADMIN';
      }

      let correctedDisplayName = profile.display_name || '';
      if (correctedDisplayName === 'admin') {
        correctedDisplayName = 'Demo Admin';
      }
      if (correctedDisplayName !== profile.display_name) {
        updates.display_name = correctedDisplayName;
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
      let displayName = email.split('@')[0];
      if (displayName === 'admin') {
        displayName = 'Demo Admin';
      }

      const targetId = supabaseUser?.id || privyUser.id.replace('did:privy:', '');

      const profilePayload = {
        id: targetId,
        display_name: displayName,
        role,
        wallet_address: walletAddress ? walletAddress.toLowerCase() : null,
        wallet_type: walletAddress ? walletType : null
      };

      const { data: newProfile, error: insertError } = await supabaseAdmin
        .from('users_profile')
        .upsert(profilePayload, { onConflict: 'id' })
        .select()
        .maybeSingle();

      if (!insertError && newProfile) {
        profile = newProfile;
        if (isDesignatedAdmin && originalEmail) {
          seedDemoDataForAdmin(originalEmail).catch(err =>
            console.warn('[SEED] Auto-seed failed (non-blocking):', err?.message)
          );
        }
      } else {
        if (insertError) {
          console.warn('Upsert user profile warning, using constructed profile:', insertError.message);
        }
        profile = profilePayload;
      }
    }

    // 4. Sync wallet address to rights_holders entries for this admin via email
    if (walletAddress && originalEmail && isDesignatedAdmin) {
      try {
        await supabaseAdmin
          .from('rights_holders')
          .update({ wallet_address: walletAddress.toLowerCase() })
          .eq('email', originalEmail)
          .is('wallet_address', null);
      } catch (walletSyncErr) {
        console.warn('[SYNC] Failed to sync wallet to rights_holders:', walletSyncErr);
      }
    }

    // 5. Return the profile data
    let fallbackDisplayName = email.split('@')[0];
    if (fallbackDisplayName === 'admin') {
      fallbackDisplayName = 'Demo Admin';
    }

    const finalUserId = profile?.id || supabaseUser?.id || privyUser.id.replace('did:privy:', '');

    return NextResponse.json({
      user: profile || {
        id: finalUserId,
        display_name: fallbackDisplayName,
        role: isDesignatedAdmin ? 'ADMIN' : 'RIGHTS_HOLDER'
      }
    });
  } catch (error: any) {
    console.error('Auth Sync Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
