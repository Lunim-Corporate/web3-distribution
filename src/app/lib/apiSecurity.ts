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
  // In development, bypass the auth gate so distribution can be tested without login
  if (process.env.NODE_ENV === 'development') {
    return { id: 'dev-admin', role: 'admin', isAdmin: true };
  }
  const user = requireAuth();
  if (user.role !== 'admin' && !user.isAdmin) {
    throw new Error('Forbidden: Admins only');
  }
  return user;
}
