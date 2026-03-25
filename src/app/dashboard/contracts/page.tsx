'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { useAuth } from '@/lib/auth';
import { SmartContractPanel } from '@/components/dashboard/SmartContractPanel';

export default function ContractsPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) router.replace('/login');
  }, [user, router]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
        <SidebarNav />
        <div className="lg:col-span-10">
          <SmartContractPanel />
        </div>
      </div>
    </div>
  );
}

