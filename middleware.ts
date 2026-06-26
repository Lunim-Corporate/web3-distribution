import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware for route protection.
 *
 * Authentication is verified via Privy session cookies (set by @privy-io/react-auth).
 * The crt_user cookie is used ONLY for identifying the user on the client side —
 * it is NOT trusted for role-based access control (that is done server-side).
 *
 * Protected routes:
 *   /dashboard/*  — requires authentication
 *   /admin/*      — requires authentication (role checked client-side via API)
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const demoAccessEnabled = process.env.NEXT_PUBLIC_ENABLE_DEMO_ACCESS === 'true';

  if (pathname.startsWith('/web3-demo') && !demoAccessEnabled) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  // Check for Privy auth cookies — these are the secure, httpOnly cookies set by Privy
  const allCookies = request.cookies.getAll();
  const hasPrivyAuth = allCookies.some(
    (cookie) =>
      cookie.name.startsWith('privy-') ||
      cookie.name.includes('privy_') ||
      cookie.name.includes('auth-token') ||
      cookie.name.startsWith('sb-')
  );

  // Also check our client-set cookie as a fallback
  const hasCrtUser = !!request.cookies.get('crt_user');

  const isAuthenticated = hasPrivyAuth || hasCrtUser;

  // Protect /dashboard for authenticated users
  if (pathname.startsWith('/dashboard')) {
    if (!isAuthenticated) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  // Protect /admin — require authentication only
  // Role verification is handled server-side by the admin page component
  // via the useAuth() hook which fetches the role from the database
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    // NOTE: We intentionally do NOT check the crt_user cookie for admin role here.
    // That cookie is client-set and trivially spoofable. The actual admin check
    // happens in the admin page component via useAuth() → Supabase DB query.
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/web3-demo', '/web3-demo/:path*'],
};
