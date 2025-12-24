'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { CreatorLayout } from '@/components/layouts/CreatorLayout';
import { WalletService } from '@/lib/services/WalletService';
import { toast } from 'react-hot-toast';

export default function CreatorSettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [bankAccount, setBankAccount] = useState({
    accountName: '',
    accountNumber: '',
    bankName: '',
    routingNumber: '',
  });
  const [payoutPreference, setPayoutPreference] = useState<'crypto' | 'fiat' | 'both'>('crypto');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role !== 'creator' && user.role !== 'admin') {
      router.replace('/unauthorized');
      return;
    }

    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem(`creator_settings_${user.id}`);
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setBankAccount(settings.bankAccount || bankAccount);
      setPayoutPreference(settings.payoutPreference || 'crypto');
      setWalletAddress(settings.walletAddress || '');
      setWalletConnected(!!settings.walletAddress);
    }
  }, [user, router]);

  if (!user || (user.role !== 'creator' && user.role !== 'admin')) {
    return null;
  }

  const handleConnectWallet = async () => {
    setLoading(true);
    try {
      const walletService = WalletService.getInstance();
      const walletInfo = await walletService.linkAccount();
      setWalletAddress(walletInfo.address);
      setWalletConnected(true);
      toast.success('Wallet connected successfully!');
      saveSettings({ walletAddress: walletInfo.address });
    } catch (error) {
      toast.error('Failed to connect wallet');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBankAccount = () => {
    if (!bankAccount.accountName || !bankAccount.accountNumber || !bankAccount.bankName) {
      toast.error('Please fill in all required fields');
      return;
    }
    saveSettings({ bankAccount });
    toast.success('Bank account saved successfully!');
  };

  const handleSavePayoutPreference = () => {
    saveSettings({ payoutPreference });
    toast.success('Payout preference saved!');
  };

  const saveSettings = (updates: any) => {
    const currentSettings = JSON.parse(
      localStorage.getItem(`creator_settings_${user.id}`) || '{}'
    );
    const newSettings = { ...currentSettings, ...updates };
    localStorage.setItem(`creator_settings_${user.id}`, JSON.stringify(newSettings));
  };

  return (
    <CreatorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Settings
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your wallet, bank account, and payout preferences.
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

        {/* Bank Account */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Bank Account
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Link your bank account to receive fiat payments.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Account Name *
              </label>
              <input
                type="text"
                value={bankAccount.accountName}
                onChange={(e) => setBankAccount({ ...bankAccount, accountName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Account Number *
              </label>
              <input
                type="text"
                value={bankAccount.accountNumber}
                onChange={(e) => setBankAccount({ ...bankAccount, accountNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="1234567890"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bank Name *
              </label>
              <input
                type="text"
                value={bankAccount.bankName}
                onChange={(e) => setBankAccount({ ...bankAccount, bankName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Chase Bank"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Routing Number
              </label>
              <input
                type="text"
                value={bankAccount.routingNumber}
                onChange={(e) => setBankAccount({ ...bankAccount, routingNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="021000021"
              />
            </div>
            <button
              onClick={handleSaveBankAccount}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Save Bank Account
            </button>
          </div>
        </div>

        {/* Payout Preferences */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Payout Preferences
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Choose how you want to receive payments.
          </p>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
              <input
                type="radio"
                name="payout"
                value="crypto"
                checked={payoutPreference === 'crypto'}
                onChange={(e) => setPayoutPreference(e.target.value as any)}
                className="w-4 h-4"
              />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Crypto Only</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Receive all payments in cryptocurrency
                </p>
              </div>
            </label>
            <label className="flex items-center gap-3 p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
              <input
                type="radio"
                name="payout"
                value="fiat"
                checked={payoutPreference === 'fiat'}
                onChange={(e) => setPayoutPreference(e.target.value as any)}
                className="w-4 h-4"
              />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Fiat Only</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Receive all payments in fiat currency to your bank
                </p>
              </div>
            </label>
            <label className="flex items-center gap-3 p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
              <input
                type="radio"
                name="payout"
                value="both"
                checked={payoutPreference === 'both'}
                onChange={(e) => setPayoutPreference(e.target.value as any)}
                className="w-4 h-4"
              />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Both</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Choose per transaction
                </p>
              </div>
            </label>
          </div>
          <button
            onClick={handleSavePayoutPreference}
            className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Save Preference
          </button>
        </div>
      </div>
    </CreatorLayout>
  );
}
