'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }

    // Redirect based on role
    switch (user.role) {
      case 'admin':
        router.replace('/admin/dashboard');
        break;
      case 'creator':
        router.replace('/creator/dashboard');
        break;
      case 'contributor':
        router.replace('/contributor/dashboard');
        break;
      default:
        router.replace('/login');
    }
  }, [user, router]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}
