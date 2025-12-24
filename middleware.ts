import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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
        url.pathname = '/unauthorized';
        return NextResponse.redirect(url);
      }
    } catch {}
  }

  // Protect /creator for creator and admin roles
  if (pathname.startsWith('/creator')) {
    if (!userCookie) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    try {
      const user = JSON.parse(decodeURIComponent(userCookie.value));
      if (user.role !== 'creator' && user.role !== 'admin') {
        const url = request.nextUrl.clone();
        url.pathname = '/unauthorized';
        return NextResponse.redirect(url);
      }
    } catch {}
  }

  // Protect /contributor for contributor and admin roles
  if (pathname.startsWith('/contributor')) {
    if (!userCookie) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    try {
      const user = JSON.parse(decodeURIComponent(userCookie.value));
      if (user.role !== 'contributor' && user.role !== 'admin') {
        const url = request.nextUrl.clone();
        url.pathname = '/unauthorized';
        return NextResponse.redirect(url);
      }
    } catch {}
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/creator/:path*', '/contributor/:path*'],
};


