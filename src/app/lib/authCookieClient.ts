'use client';

import type { AuthUser } from '@/lib/auth';

function getCookieAttributes() {
  const isSecure =
    (typeof window !== 'undefined' && window.location.protocol === 'https:') ||
    process.env.NODE_ENV === 'production';
  return `path=/; SameSite=Lax${isSecure ? '; Secure' : ''}`;
}

export function setAuthCookie(user: AuthUser) {
  try {
    const attrs = getCookieAttributes();
    document.cookie = `crt_user=${encodeURIComponent(JSON.stringify(user))}; ${attrs}`;
  } catch {}
}

export function clearAuthCookie() {
  try {
    const attrs = getCookieAttributes();
    document.cookie = `crt_user=; Max-Age=0; ${attrs}`;
  } catch {}
}
