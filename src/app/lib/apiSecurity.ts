import { cookies } from 'next/headers';
import { User } from './auth';

export function getUserFromCookie(): User | null {
  try {
    const cookieStore = cookies();
    const c = cookieStore.get('crt_user');
    if (!c?.value) return null;
    return JSON.parse(decodeURIComponent(c.value));
  } catch (e) {
    return null;
  }
}

export function requireAuth() {
  const user = getUserFromCookie();
  if (!user) throw new Error('Unauthorized');
  return user;
}

export function requireAdmin() {
  const user = requireAuth();
  if (user.role !== 'admin' && !user.isAdmin) {
    throw new Error('Forbidden: Admins only');
  }
  return user;
}
