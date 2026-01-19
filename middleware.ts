import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Lightweight client-side localStorage auth can't be read here,
// so we simulate with a cookie when logged in client-side later.
// This middleware reads cookies to protect routes.

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userCookie = request.cookies.get('crt_user');

  // Protect /dashboard for authenticated users
  if (pathname.startsWith('/dashboard')) {
    if (!userCookie) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  // Protect /admin for admin role
  if (pathname.startsWith('/admin')) {
    if (!userCookie) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    try {
      const user = JSON.parse(decodeURIComponent(userCookie.value));
      if (user.role !== 'admin') {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
      }
    } catch {}
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};


