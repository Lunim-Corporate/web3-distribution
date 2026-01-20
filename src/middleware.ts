import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { parseAuthCookie } from '@/lib/authCookies';
import { getAllowedRoles } from '@/lib/rbac';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const allowedRoles = getAllowedRoles(pathname);
  if (!allowedRoles) return NextResponse.next();

  const userCookie = request.cookies.get('crt_user');
  const user = parseAuthCookie(userCookie?.value);

  if (!user) {
    console.log('[rbac-deny]', {
      pathname,
      hasCookie: !!userCookie,
      role: null,
      userId: null,
      reason: 'missing_or_invalid_cookie',
    });
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('reason', 'not_logged_in');
    return NextResponse.redirect(url);
  }

  if (!allowedRoles.includes(user.role)) {
    console.log('[rbac-deny]', {
      pathname,
      hasCookie: true,
      role: user.role,
      userId: user.id,
      reason: 'forbidden_role',
    });
    const url = request.nextUrl.clone();
    url.pathname = '/unauthorized';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|login|unauthorized).*)'],
};
