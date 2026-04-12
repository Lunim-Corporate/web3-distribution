import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Next.js Middleware for route protection.
 * 
 * This middleware checks TWO sources for authentication:
 *   1. The `crt_user` cookie (set by client-side auth.tsx after login)
 *   2. The Supabase auth tokens (`sb-*-auth-token` cookies set by Supabase SDK)
 * 
 * If EITHER is present, the user is considered authenticated.
 * This prevents the race condition where router.push('/dashboard')
 * fires before the crt_user cookie fully propagates.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userCookie = request.cookies.get('crt_user');

  // Check for Supabase auth cookies as a fallback
  // Supabase stores tokens in cookies like `sb-<project-ref>-auth-token`
  // or `sb-<project-ref>-auth-token.0`, etc.
  const allCookies = request.cookies.getAll();
  const hasSupabaseAuth = allCookies.some(
    (cookie) => 
      cookie.name.includes('auth-token') || 
      cookie.name.startsWith('sb-') ||
      cookie.name.includes('supabase-auth')
  );

  const isAuthenticated = !!userCookie || hasSupabaseAuth;

  // Protect /dashboard for authenticated users
  if (pathname.startsWith('/dashboard')) {
    if (!isAuthenticated) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  // Protect /admin for admin role
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    // If we have the crt_user cookie, validate the role
    if (userCookie) {
      try {
        const user = JSON.parse(decodeURIComponent(userCookie.value));
        if (user.role !== 'admin') {
          const url = request.nextUrl.clone();
          url.pathname = '/dashboard';
          return NextResponse.redirect(url);
        }
      } catch {
        // If cookie is malformed, let through — auth.tsx will handle it client-side
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
