import { cookies } from 'next/headers';
import { supabaseAdmin } from './supabaseServer';
import type { User } from './auth';

/**
 * Server-side authentication check.
 * Verifies the user's role and identity directly against the database
 * based on the session cookie.
 */
export async function getVerifiedUser(): Promise<User | null> {
  try {
    const cookieStore = cookies();
    const c = cookieStore.get('crt_user');
    if (!c?.value) return null;

    const userData = JSON.parse(decodeURIComponent(c.value));
    if (!userData?.id) return null;

    // Verify user exists and get fresh role/admin status from DB
    const { data: dbUser, error } = await supabaseAdmin
      .from('users_profile')
      .select('id, display_name, role')
      .eq('id', userData.id)
      .single();

    if (error || !dbUser) return null;

    const role = dbUser.role || 'RIGHTS_HOLDER';
    const isAdmin = role.toUpperCase() === 'ADMIN';

    return {
      id: dbUser.id,
      email: userData.email || '', // Email comes from the cookie (trusted from auth)
      name: dbUser.display_name || '',
      role: role.toLowerCase() as any,
      isAdmin: isAdmin
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
