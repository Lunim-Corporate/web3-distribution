'use client';

import React from 'react';
import { LoginComponent } from '@/app/components/auth/LoginComponent';

export default function SignupPage() {
  return <LoginComponent initialMode="signup" />;
}
