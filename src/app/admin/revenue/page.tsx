'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { AdminLayout } from '@/components/layouts/AdminLayout';

export default function AdminRevenuePage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) router.replace('/login');
    else if (user.role !== 'admin') router.replace('/unauthorized');
  }, [user, router]);

  if (!user || user.role !== 'admin') return null;

  return (
    <AdminLayout>
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Revenue</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Track and review platform revenue streams.
        </p>
      </div>
    </AdminLayout>
  );
}
