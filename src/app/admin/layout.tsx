'use client';

import React from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';

export default function AdminSectionLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
