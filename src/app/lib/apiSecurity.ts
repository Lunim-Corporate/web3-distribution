import { cookies } from 'next/headers';
import { supabaseAdmin } from './supabaseServer';
import { createClient } from '@/utils/supabase/server';
import type { User } from './auth';

export async function getVerifiedUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();

    // 1. Try Supabase SSR session verification first (uses httpOnly sb-* cookies)
    const supabase = createClient(cookieStore);
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (session?.user && !sessionError) {
      const { data: dbUser } = await supabaseAdmin
        .from('users_profile')
        .select('id, display_name, role')
        .eq('id', session.user.id)
        .maybeSingle();

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

    // 2. Fall back to crt_user cookie (client-set, used for demo fallback)
    const c = cookieStore.get('crt_user');
    if (!c?.value) return null;

    const userData = JSON.parse(decodeURIComponent(c.value));
    if (!userData?.id) return null;

    // Demo mode bypass: skip DB verification — demo users don't exist in DB
    if (userData.isDemo) {
      return userData as User;
    }

    // 3. Verify non-demo user exists and get fresh role/admin status from DB
    const { data: dbUser, error } = await supabaseAdmin
      .from('users_profile')
      .select('id, display_name, role')
      .eq('id', userData.id)
      .maybeSingle();

    if (error || !dbUser) return null;

    const role = dbUser.role || 'RIGHTS_HOLDER';
    const isAdmin = role.toUpperCase() === 'ADMIN';

    return {
      id: dbUser.id,
      email: userData.email || '',
      name: dbUser.display_name || '',
      role: role.toLowerCase() as any,
      isAdmin,
    };
  } catch (e) {
    console.error('[SECURITY] Verification failed:', e);
    return null;
  }
}

export async function requireAuth() {
  const user = await getVerifiedUser();
  if (!user) throw new Error('Unauthorized');
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (!user.isAdmin && user.role !== 'admin') {
    throw new Error('Forbidden: Admins only');
  }
  return user;
}
