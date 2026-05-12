'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/lib/auth';
import { useRevenueSplitter } from '@/lib/web3';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, setNotifyResurfacingHours, settings, exportWallet, linkWallet } = useAuth();
  const { smartAccountAddress, isInitializing } = useRevenueSplitter();

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
    const onDemoChanged = (e: any) => setIsDemoMode(e.detail);
    window.addEventListener('demo-mode-changed', onDemoChanged);
    return () => window.removeEventListener('demo-mode-changed', onDemoChanged);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>

        <Card>
          <CardHeader>
            <CardTitle>Your details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">Name</div>
              <div className="font-medium text-gray-900 dark:text-white">{user?.name || '-'}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">Email</div>
              <div className="font-medium text-gray-900 dark:text-white">{user?.email || '-'}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">Role</div>
              <Badge variant={user?.role === 'admin' ? 'success' : 'default'}>{user?.role || '-'}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="text-sm text-gray-600 dark:text-gray-400">Notify resurfacing every</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {hours} hours
                </div>
              </div>
              <div className="w-32">
                <input
                  type="number"
                  min={1}
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <Button onClick={() => setNotifyResurfacingHours(hours)} variant="primary">
              Save settings
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Wallet Connection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Your account uses a Smart Account (ERC-4337) with sponsored gas fees. 
              You don't need to hold ETH to pay for transactions.
            </p>

            {isInitializing ? (
              <div className="flex items-center justify-center py-6">
                <div className="text-sm text-gray-500 animate-pulse">Initializing Smart Account...</div>
              </div>
            ) : smartAccountAddress ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Status</div>
                  <div className="font-medium text-emerald-600 dark:text-emerald-400">
                    Active (AA Enabled)
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Smart Account Address</div>
                  <div className="font-mono text-sm text-gray-900 dark:text-white break-all">
                    {smartAccountAddress}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Gas Coverage</div>
                  <div className="font-medium text-indigo-500">100% Sponsored (Zero Gas)</div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Status</div>
                  <div className="font-medium text-gray-500">Not Connected</div>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 pt-2">
                  Please login to initialize your secure smart account.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Portability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              You own your account. You can export your private key to use your wallet in other applications (like MetaMask or Coinbase Wallet) or link an existing external wallet.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button 
                onClick={() => exportWallet()} 
                variant="secondary"
                className="flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Export Private Key
              </Button>
              
              <Button 
                onClick={() => linkWallet()} 
                variant="secondary"
                className="flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Link External Wallet
              </Button>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-xl">
              <p className="text-[10px] text-amber-800 dark:text-amber-200 leading-relaxed">
                <strong>Warning:</strong> Never share your private key with anyone. LUNIM employees will never ask for your private key. Exporting your key allows you to move your funds independently of this platform.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Session Management</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => void logout()} variant="secondary" className="w-full text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40">
              Log Out of Platform
            </Button>
        </Card>
      </div>
    </div>
  );
}

