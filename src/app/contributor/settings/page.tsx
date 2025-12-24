'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { ContributorLayout } from '@/components/layouts/ContributorLayout';
import { WalletService } from '@/lib/services/WalletService';
import { toast } from 'react-hot-toast';

export default function ContributorSettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role !== 'contributor' && user.role !== 'admin') {
      router.replace('/unauthorized');
      return;
    }

    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem(`contributor_settings_${user.id}`);
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setWalletAddress(settings.walletAddress || '');
      setWalletConnected(!!settings.walletAddress);
    }
  }, [user, router]);

  if (!user || (user.role !== 'contributor' && user.role !== 'admin')) {
    return null;
  }

  const handleConnectWallet = async () => {
    setLoading(true);
    try {
      const walletService = WalletService.getInstance();
      const walletInfo = await walletService.linkAccount();
      setWalletAddress(walletInfo.address);
      setWalletConnected(true);
      
      // Save to localStorage
      const settings = { walletAddress: walletInfo.address };
      localStorage.setItem(`contributor_settings_${user.id}`, JSON.stringify(settings));
      
      toast.success('Wallet connected successfully!');
    } catch (error) {
      toast.error('Failed to connect wallet');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ContributorLayout>
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Settings
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your wallet and payout preferences.
          </p>
        </div>

        {/* Wallet Connection */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Wallet Connection
          </h3>
          {walletConnected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <span className="text-2xl">✅</span>
                <div className="flex-1">
                  <p className="font-medium text-green-900 dark:text-green-100">
                    Wallet Connected
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300 font-mono">
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </p>
                </div>
              </div>
              <button
                onClick={handleConnectWallet}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Reconnect Wallet
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-gray-600 dark:text-gray-400">
                Connect your Web3 wallet to receive crypto payments.
              </p>
              <button
                onClick={handleConnectWallet}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Connecting...' : 'Connect Wallet'}
              </button>
            </div>
          )}
        </div>

        {/* Profile Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Profile Information
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name
              </label>
              <p className="text-gray-900 dark:text-white">{user.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <p className="text-gray-900 dark:text-white">{user.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role
              </label>
              <span className="px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded">
                {user.role}
              </span>
            </div>
          </div>
        </div>
      </div>
    </ContributorLayout>
  );
}
