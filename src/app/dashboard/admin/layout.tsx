'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { motion } from 'framer-motion';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthHydrated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthHydrated && (!user || user.role !== 'admin')) {
      router.replace('/dashboard');
    }
  }, [isAuthHydrated, user, router]);

  if (!isAuthHydrated || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#02040A]">
      <Sidebar />
      <main className="flex-1 min-h-screen relative overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="p-8 md:p-12 pb-24"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
