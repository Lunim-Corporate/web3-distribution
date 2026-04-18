'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { motion } from 'framer-motion';

const LoadingScreen = ({ stage }: { stage: string }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center p-6">
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-purple-500/40">
        <span className="text-3xl">💎</span>
      </div>
      <h2 className="text-2xl font-black text-white">Initializing Dashboard</h2>
      <div className="flex items-center justify-center gap-2 mt-3">
        {[0, 150, 300].map((delay) => (
          <div key={delay} className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
        ))}
      </div>
      <p className="text-purple-300 mt-4 font-medium">{stage}</p>
    </motion.div>
  </div>
);

export default function DashboardGateway() {
  const { isAuthHydrated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthHydrated) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role === 'admin') {
      router.push('/dashboard/admin');
    } else {
      router.push('/dashboard/creator');
    }
  }, [isAuthHydrated, user, router]);

  return <LoadingScreen stage="Redirecting to your workspace..." />;
}
