import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { parseAuthCookie } from '@/lib/authCookies';

export default function ContributorSectionLayout({ children }: { children: React.ReactNode }) {
  const user = parseAuthCookie(cookies().get('crt_user')?.value);
  if (!user) redirect('/login?reason=not_logged_in');
  if (user.role !== 'contributor' && user.role !== 'admin') redirect('/unauthorized');
  return <>{children}</>;
}
