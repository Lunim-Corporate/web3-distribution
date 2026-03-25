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
  const { account, isConnected, balance, connectWallet, disconnectWallet } = useWallet();

  const [hours, setHours] = useState<number>(settings?.notifyResurfacingHours ?? 24);

  useEffect(() => {
    if (!user) router.replace('/login');
  }, [user, router]);

  useEffect(() => {
    setHours(settings?.notifyResurfacingHours ?? 24);
  }, [settings?.notifyResurfacingHours]);

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
            <CardTitle>Wallet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">Status</div>
              <div className="font-medium text-gray-900 dark:text-white">
                {isConnected ? 'Connected' : 'Disconnected'}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">Account</div>
              <div className="font-mono text-sm text-gray-900 dark:text-white break-all">
                {account || '-'}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">Balance</div>
              <div className="font-medium text-gray-900 dark:text-white">{balance ? `${balance} ETH` : '-'}</div>
            </div>

            <div className="flex gap-2">
              {!isConnected ? (
                <Button onClick={() => void connectWallet()} variant="primary">
                  Connect MetaMask
                </Button>
              ) : (
                <Button onClick={disconnectWallet} variant="secondary">
                  Disconnect
                </Button>
              )}
              <Button onClick={() => void logout()} variant="ghost">
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

