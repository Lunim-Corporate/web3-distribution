'use client';

import React from 'react';
import { LoginComponent } from '@/app/components/auth/LoginComponent';

export default function LoginPage({ searchParams }: { searchParams?: { mode?: string } }) {
  const mode = searchParams?.mode === 'signup' ? 'signup' : 'login';
  return <LoginComponent initialMode={mode} />;
}
