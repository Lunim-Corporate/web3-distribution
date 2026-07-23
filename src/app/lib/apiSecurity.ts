import { cookies, headers } from 'next/headers';
import { supabaseAdmin, isSupabaseConfigured } from './supabaseServer';
import { createClient } from '@/utils/supabase/server';
import type { User } from './auth';
import { getOrSetCachedPromise } from './requestCache';

// ──────────────────────────────────────────────
// Audit Log (in-memory buffer, flushed to console)
// For production: ship to Supabase `audit_log` table or external SIEM
// ──────────────────────────────────────────────

interface AuditEntry {
  timestamp: string;
  action: string;
  userId: string | null;
  ip: string;
  userAgent: string;
  success: boolean;
  details?: string;
}

async function getRequestMeta(): Promise<{ ip: string; userAgent: string }> {
  const headerStore = await headers();
  const forwarded = headerStore.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : headerStore.get('x-real-ip') || 'unknown';
  const userAgent = headerStore.get('user-agent') || 'unknown';
  return { ip, userAgent };
}

export async function auditLog(
  action: string,
  userId: string | null,
  success: boolean,
  details?: string
): Promise<void> {
  const { ip, userAgent } = await getRequestMeta();
  const entry: AuditEntry = {
    timestamp: new Date().toISOString(),
    action,
    userId,
    ip,
    userAgent,
    success,
    details,
  };

  // Structured log for observability (CloudWatch, Datadog, etc.)
  console.log(`[AUDIT] ${JSON.stringify(entry)}`);

  // Optionally persist to DB (fire-and-forget, don't block the request)
  try {
    if (isSupabaseConfigured()) {
      await supabaseAdmin.from('activities').insert({
        project_id: null,
        action: `audit:${action}`,
        description: `${success ? '✓' : '✗'} ${action} by ${userId || 'anon'} from ${ip}${details ? ` — ${details}` : ''}`,
        timestamp: entry.timestamp,
      });
    }
  } catch {
    // Non-critical — don't let audit logging break the request
  }
}

// ──────────────────────────────────────────────
// User Verification (unchanged core logic, enhanced logging)
// ──────────────────────────────────────────────

export async function getVerifiedUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const configured = isSupabaseConfigured();

    // 1. Try Supabase SSR session verification first (uses httpOnly sb-* cookies)
    if (configured) {
      try {
        const supabase = createClient(cookieStore);
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (session?.user && !sessionError) {
          const cacheKey = `user-profile-${session.user.id}`;
          const dbUser = await getOrSetCachedPromise(
            cacheKey,
            async () => {
              const { data } = await supabaseAdmin
                .from('users_profile')
                .select('id, display_name, role')
                .eq('id', session.user.id)
                .maybeSingle();
              return data;
            },
            30000 // 30 seconds TTL
          );

          if (dbUser) {
            const role = dbUser.role || 'RIGHTS_HOLDER';
            return {
              id: dbUser.id,
              email: session.user.email || '',
              name: dbUser.display_name || '',
              role: role.toLowerCase() as any,
              isAdmin: role.toUpperCase() === 'ADMIN',
            };
          }
        }
      } catch (err) {
        console.warn('[SECURITY] Supabase SSR session check failed:', err);
      }
    }

    // 2. Fall back to crt_user cookie for non-demo users (client-set, verified against DB)
    const c = cookieStore.get('crt_user');
    if (!c?.value) return null;

    let userData: any;
    try {
      userData = JSON.parse(decodeURIComponent(c.value));
    } catch {
      return null;
    }
    if (!userData?.id) return null;

    // Demo sandbox mode: return demo profile so API routes work.
    // Demo data is isolated via is_demo=true DB filtering.
    if (userData.isDemo || !configured) {
      return {
        id: userData.id || 'demo-user',
        email: userData.email || 'demo@lunim.io',
        name: userData.name || 'Demo User',
        role: userData.role || 'admin',
        isAdmin: userData.isAdmin ?? true,
        isDemo: true,
      };
    }

    // 3. Verify user exists in DB and get fresh role/admin status
    const cacheKey = `user-profile-${userData.id}`;
    let dbUser = await getOrSetCachedPromise(
      cacheKey,
      async () => {
        const { data } = await supabaseAdmin
          .from('users_profile')
          .select('id, display_name, role')
          .eq('id', userData.id)
          .maybeSingle();
        return data;
      },
      15000 // 15 seconds TTL
    );

    if (!dbUser && configured) {
      // Lookup or upsert user profile so authenticating users are recognized in Supabase
      const adminEmails = (process.env.ADMIN_EMAILS || '').toLowerCase().split(',').map(e => e.trim());
      const isUserAdmin = userData.isAdmin || (userData.email && adminEmails.includes(userData.email.toLowerCase()));
      const defaultRole = isUserAdmin ? 'ADMIN' : (userData.role?.toUpperCase() || 'RIGHTS_HOLDER');

      const { data: upserted } = await supabaseAdmin
        .from('users_profile')
        .upsert({
          id: userData.id,
          display_name: userData.name || userData.email?.split('@')[0] || 'User',
          role: defaultRole,
        }, { onConflict: 'id' })
        .select('id, display_name, role')
        .maybeSingle();

      dbUser = upserted || { id: userData.id, display_name: userData.name || 'User', role: defaultRole };
    }

    if (!dbUser) {
      return {
        id: userData.id,
        email: userData.email || '',
        name: userData.name || 'User',
        role: (userData.role || 'creator') as any,
        isAdmin: !!userData.isAdmin,
      };
    }

    const role = dbUser.role || 'RIGHTS_HOLDER';
    const isAdmin = role.toUpperCase() === 'ADMIN';

    return {
      id: dbUser.id,
      email: userData.email || '',
      name: dbUser.display_name || userData.name || '',
      role: role.toLowerCase() as any,
      isAdmin,
    };
  } catch (e) {
    console.error('[SECURITY] Verification failed:', e);
    return null;
  }
}

// ──────────────────────────────────────────────
// Auth Guards
// ──────────────────────────────────────────────

export async function requireAuth(): Promise<User> {
  const user = await getVerifiedUser();
  if (!user) {
    await auditLog('auth:rejected', null, false, 'No valid session');
    throw new Error('Unauthorized');
  }
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireAuth();
  if (!user.isAdmin && user.role !== 'admin') {
    await auditLog('admin:rejected', user.id, false, `Role: ${user.role}`);
    throw new Error('Forbidden: Admins only');
  }
  return user;
}

/**
 * Require a specific role. Admins always pass.
 * Usage: await requireRole('creator');
 */
export async function requireRole(
  ...allowedRoles: string[]
): Promise<User> {
  const user = await requireAuth();

  // Admins always pass role checks
  if (user.isAdmin || user.role === 'admin') return user;

  const normalizedUserRole = (user.role || '').toLowerCase();
  const normalizedAllowed = allowedRoles.map(r => r.toLowerCase());

  if (!normalizedUserRole || !normalizedAllowed.includes(normalizedUserRole)) {
    await auditLog('role:rejected', user.id, false, `Required: ${allowedRoles.join('|')}, Has: ${user.role}`);
    throw new Error(`Forbidden: Requires role ${allowedRoles.join(' or ')}`);
  }

  return user;
}
