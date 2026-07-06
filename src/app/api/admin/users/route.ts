import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/app/lib/supabaseServer';
import { requireAdmin, auditLog } from '@/app/lib/apiSecurity';
import { checkRateLimit } from '@/app/lib/rateLimit';
import { clearCache } from '@/app/lib/requestCache';
import { demoHolders } from '@/app/lib/demoData';

export async function GET() {
  try {
    const blocked = await checkRateLimit('read');
    if (blocked) return blocked;

    await requireAdmin();

    const configured = isSupabaseConfigured();
    if (!configured) {
      // Mock mode: Combine demo profile users with demo project rights holders
      const unified: any[] = [
        {
          id: 'demo-admin-id',
          display_name: 'Demo Admin',
          role: 'ADMIN',
          wallet_address: '0x7C4B53DeBd4fa41Ce7fB0aC3CA25aa3243675fDE',
          wallet_type: 'local',
          email: 'demo@lunim.io',
          created_at: new Date().toISOString(),
          is_registered: true
        },
        {
          id: 'user-aria',
          display_name: 'Aria Vance',
          role: 'RIGHTS_HOLDER',
          wallet_address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
          wallet_type: 'metamask',
          email: 'aria@vance.io',
          created_at: new Date().toISOString(),
          is_registered: true
        }
      ];

      // Add unregistered demo rights holders
      for (const h of demoHolders) {
        const lowerWallet = h.wallet_address.toLowerCase();
        const exists = unified.some(u => u.wallet_address.toLowerCase() === lowerWallet || u.display_name.toLowerCase() === h.full_name.toLowerCase());
        if (!exists) {
          unified.push({
            id: h.id,
            display_name: h.full_name,
            role: 'RIGHTS_HOLDER',
            wallet_address: h.wallet_address,
            wallet_type: 'external',
            email: h.email || null,
            created_at: (h as any).created_at || new Date().toISOString(),
            is_registered: false
          });
        }
      }

      return NextResponse.json(unified);
    }

    // 1. Fetch registered users from users_profile
    const { data: users, error: usersErr } = await supabaseAdmin
      .from('users_profile')
      .select('id, display_name, role, wallet_address, wallet_type, created_at')
      .order('created_at', { ascending: false });

    if (usersErr) {
      console.error('Failed to fetch users_profile:', usersErr);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // 2. Fetch all rights holders across all projects
    const { data: holders, error: holdersErr } = await supabaseAdmin
      .from('rights_holders')
      .select('id, full_name, role, wallet_address, email, user_id, created_at');

    if (holdersErr) {
      console.error('Failed to fetch rights_holders:', holdersErr);
      return NextResponse.json({ error: 'Failed to fetch rights holders' }, { status: 500 });
    }

    // 3. Merge profiles and rights holders into a unified user list
    const unifiedUsers: any[] = [];
    const processedUserIds = new Set<string>();
    const processedWallets = new Set<string>();
    const processedEmails = new Set<string>();

    if (users) {
      for (const u of users) {
        processedUserIds.add(u.id);
        if (u.wallet_address) {
          processedWallets.add(u.wallet_address.toLowerCase());
        }

        // Try to locate email from rights holders linked to this user_id
        const matchedHolder = holders?.find(h => h.user_id === u.id);
        const email = matchedHolder?.email || null;
        if (email) {
          processedEmails.add(email.toLowerCase());
        }

        unifiedUsers.push({
          id: u.id,
          display_name: u.display_name,
          role: u.role,
          wallet_address: u.wallet_address,
          wallet_type: u.wallet_type || 'local',
          email,
          created_at: u.created_at,
          is_registered: true
        });
      }
    }

    if (holders) {
      for (const h of holders) {
        // Skip if already matched via user_id
        if (h.user_id && processedUserIds.has(h.user_id)) {
          continue;
        }

        // Skip if matching wallet_address belongs to a registered user
        if (h.wallet_address && processedWallets.has(h.wallet_address.toLowerCase())) {
          continue;
        }

        // Skip if matching email belongs to a registered user
        if (h.email && processedEmails.has(h.email.toLowerCase())) {
          continue;
        }

        // De-duplicate guest user entries appearing in multiple rosters
        const duplicateGuest = unifiedUsers.find(u =>
          !u.is_registered &&
          ((h.email && u.email && h.email.toLowerCase() === u.email.toLowerCase()) ||
           (h.wallet_address && u.wallet_address && h.wallet_address.toLowerCase() === u.wallet_address.toLowerCase()))
        );

        if (duplicateGuest) {
          continue;
        }

        unifiedUsers.push({
          id: h.id,
          display_name: h.full_name,
          role: 'RIGHTS_HOLDER',
          wallet_address: h.wallet_address,
          wallet_type: 'external',
          email: h.email || null,
          created_at: (h as any).created_at || new Date().toISOString(),
          is_registered: false
        });

        if (h.wallet_address) {
          processedWallets.add(h.wallet_address.toLowerCase());
        }
        if (h.email) {
          processedEmails.add(h.email.toLowerCase());
        }
      }
    }

    return NextResponse.json(unifiedUsers);
  } catch (err: any) {
    if (err.message === 'Unauthorized' || err.message === 'Forbidden: Admins only') {
      return NextResponse.json({ error: err.message }, { status: err.message === 'Unauthorized' ? 401 : 403 });
    }
    console.error('Unified users list error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const blocked = await checkRateLimit('sensitive');
    if (blocked) return blocked;

    const admin = await requireAdmin();

    const { user_id, role, wallet_address } = await req.json();

    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }

    const configured = isSupabaseConfigured();
    if (!configured) {
      clearCache();
      return NextResponse.json({
        id: user_id,
        display_name: 'Demo Admin',
        role: role || 'ADMIN',
        wallet_address,
        wallet_type: 'local'
      });
    }

    // Check if modifying a registered user profile
    const { data: profile } = await supabaseAdmin
      .from('users_profile')
      .select('*')
      .eq('id', user_id)
      .maybeSingle();

    if (profile) {
      const updateFields: any = {};
      if (role !== undefined) {
        const validRoles = ['ADMIN', 'RIGHTS_HOLDER'];
        if (!validRoles.includes(role.toUpperCase())) {
          return NextResponse.json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` }, { status: 400 });
        }
        updateFields.role = role.toUpperCase();
      }

      if (wallet_address !== undefined) {
        updateFields.wallet_address = wallet_address || null;
        updateFields.wallet_type = wallet_address ? 'local' : null;
      }

      const { data: updated, error } = await supabaseAdmin
        .from('users_profile')
        .update(updateFields)
        .eq('id', user_id)
        .select('id, display_name, role, wallet_address, wallet_type')
        .single();

      if (error) throw error;

      // Sync wallet address to rights_holders
      if (wallet_address !== undefined) {
        await supabaseAdmin
          .from('rights_holders')
          .update({ wallet_address: wallet_address || '' })
          .eq('user_id', user_id);
      }

      clearCache();
      await auditLog('admin:update_user', admin.id, true, `target=${user_id} updates=${JSON.stringify(updateFields)}`);
      return NextResponse.json(updated);
    } else {
      // Modifying an unregistered/guest user (from rights_holders)
      const { data: holder } = await supabaseAdmin
        .from('rights_holders')
        .select('*')
        .eq('id', user_id)
        .maybeSingle();

      if (!holder) {
        return NextResponse.json({ error: 'User/Rights holder not found' }, { status: 404 });
      }

      // Check if they have an active user in auth.users by searching email
      let authUserId: string | null = null;
      if (holder.email) {
        const { data: rpcData } = await supabaseAdmin.rpc('get_user_id_by_email', {
          email_address: holder.email
        });
        if (rpcData && rpcData.length > 0) {
          authUserId = rpcData[0].id;
        }
      }

      if (role && role.toUpperCase() === 'ADMIN' && !authUserId) {
        return NextResponse.json({
          error: 'This user has not registered an account yet. They must log in to the platform before being promoted to Admin.'
        }, { status: 400 });
      }

      if (authUserId) {
        // Automatically create their profile record in users_profile
        const { data: newProfile, error: profileErr } = await supabaseAdmin
          .from('users_profile')
          .insert({
            id: authUserId,
            display_name: holder.full_name,
            role: role ? role.toUpperCase() : 'RIGHTS_HOLDER',
            wallet_address: wallet_address || holder.wallet_address,
            wallet_type: 'local'
          })
          .select()
          .single();

        if (profileErr) throw profileErr;

        // Associate rights holder record with user_id
        await supabaseAdmin
          .from('rights_holders')
          .update({
            user_id: authUserId,
            wallet_address: wallet_address || holder.wallet_address
          })
          .eq('id', user_id);

        clearCache();
        return NextResponse.json(newProfile);
      } else {
        // Not registered in Auth, update rights_holders wallet address directly
        if (wallet_address !== undefined) {
          const { error: holderErr } = await supabaseAdmin
            .from('rights_holders')
            .update({ wallet_address: wallet_address || '' })
            .eq('email', holder.email);

          if (holderErr) throw holderErr;
        }

        clearCache();
        return NextResponse.json({
          id: holder.id,
          display_name: holder.full_name,
          role: 'RIGHTS_HOLDER',
          wallet_address: wallet_address || holder.wallet_address,
          wallet_type: 'external',
          is_registered: false
        });
      }
    }
  } catch (err: any) {
    const msg = typeof err === 'string' ? err : err?.message || err?.error || (err instanceof Error ? err.message : String(err));
    if (msg === 'Unauthorized' || msg === 'Forbidden: Admins only') {
      return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 });
    }
    console.error('Update unified user error:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
