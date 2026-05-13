'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/lib/auth';
import { useWallet } from '@/lib/wallet';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, setNotifyResurfacingHours, settings } = useAuth();
  const { account, isConnected } = useWallet();

  const [hours, setHours] = useState<number>(settings?.notifyResurfacingHours ?? 24);
  const [isDemoMode, setIsDemoMode] = useState(true);

  useEffect(() => {
    if (!user) router.replace('/login');
  }, [user, router]);

  useEffect(() => {
    setHours(settings?.notifyResurfacingHours ?? 24);
  }, [settings?.notifyResurfacingHours]);

  useEffect(() => {
    // Read initial mode
    setIsDemoMode(localStorage.getItem('demo_mode') === 'true');
    const onDemoChanged = () => {
      setIsDemoMode(localStorage.getItem('demo_mode') === 'true');
    };
    window.addEventListener('demo-mode-changed', onDemoChanged);
    return () => window.removeEventListener('demo-mode-changed', onDemoChanged);
  }, []);

  return (
    <div className="min-h-screen pt-8">
      <div className="max-w-3xl mx-auto px-6 space-y-6">
        
        <Card className="!p-0 overflow-hidden bg-white/5 border-white/5">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-xl">Your details</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-2 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-400">Name</div>
              <div className="font-bold text-white">{user?.name || '-'}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-400">Email</div>
              <div className="font-bold text-white">{user?.email || '-'}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-400">Role</div>
              <div className="font-bold text-emerald-400 text-sm">{user?.role || '-'}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="!p-0 overflow-hidden bg-white/5 border-white/5">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-xl">Notification settings</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-2 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-400">Notify resurfacing every</div>
                <div className="text-sm font-bold text-white mt-1">
                  {hours} hours
                </div>
              </div>
              <div className="w-24">
                <input
                  type="number"
                  min={1}
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-white/10 rounded-xl bg-white/5 text-white outline-none focus:border-indigo-500/50 transition-colors"
                />
              </div>
            </div>
            <button 
              onClick={() => setNotifyResurfacingHours(hours)} 
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-indigo-500 to-purple-500 hover:brightness-110 text-white transition-all shadow-lg shadow-indigo-500/20"
            >
              Save settings
            </button>
          </CardContent>
        </Card>

        <Card className="!p-0 overflow-hidden bg-white/5 border-white/5">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-xl">Wallet Connection</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-2 space-y-4">
            <p className="text-sm text-gray-400">
              {isDemoMode 
                ? "Demo mode: Wallet connection is simulated via Hardhat accounts."
                : "Live mode: Connect your Web3 wallet from the top navigation."}
            </p>

            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-400">Status</div>
              <div className="font-bold text-white">
                {isConnected ? 'Connected' : 'Not Connected'}
              </div>
            </div>

            <p className="text-sm text-gray-400">
              Click the wallet icon in the top navigation to connect your wallet.
            </p>

            <div className="pt-2">
              <button 
                onClick={() => void logout()} 
                className="w-full py-3 rounded-xl text-sm font-bold text-rose-400 border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 transition-all"
              >
                Log Out of Platform
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

