export type AuthRole = 'admin' | 'creator' | 'contributor';

export interface AuthCookieUser {
  id: string;
  role: AuthRole;
  email?: string;
  name?: string;
}

export function parseAuthCookie(rawValue?: string | null): AuthCookieUser | null {
  if (!rawValue) return null;
  try {
    const decoded = decodeURIComponent(rawValue);
    const parsed = JSON.parse(decoded) as Partial<AuthCookieUser> | null;
    if (!parsed || typeof parsed !== 'object') return null;
    if (!parsed.id || typeof parsed.id !== 'string') return null;
    if (parsed.role !== 'admin' && parsed.role !== 'creator' && parsed.role !== 'contributor') return null;
    return {
      id: parsed.id,
      role: parsed.role,
      email: typeof parsed.email === 'string' ? parsed.email : undefined,
      name: typeof parsed.name === 'string' ? parsed.name : undefined,
    };
  } catch {
    return null;
  }
}
