import type { AuthRole } from '@/lib/authCookies';

export interface RouteRule {
  prefix: string;
  roles: AuthRole[];
}

export const ROUTE_RBAC: RouteRule[] = [
  { prefix: '/admin', roles: ['admin'] },
  { prefix: '/creator', roles: ['creator', 'admin'] },
  { prefix: '/contributor', roles: ['contributor', 'admin'] },
  { prefix: '/dashboard', roles: ['admin', 'creator', 'contributor'] },
];

export function getAllowedRoles(pathname: string): AuthRole[] | null {
  const rule = ROUTE_RBAC.find((entry) => pathname.startsWith(entry.prefix));
  return rule ? rule.roles : null;
}

export function isRoleAllowed(role: AuthRole, pathname: string): boolean {
  const roles = getAllowedRoles(pathname);
  return roles ? roles.includes(role) : false;
}
