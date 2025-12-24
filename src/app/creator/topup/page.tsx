'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { CreatorLayout } from '@/components/layouts/CreatorLayout';
import { OnRampService, OnRampProvider, OnRampSession } from '@/lib/services/OnRampService';
import { WalletService } from '@/lib/services/WalletService';
import { toast } from 'react-hot-toast';

export default function CreatorTopUpPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [providers, setProviders] = useState<OnRampProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<'stripe' | 'moonpay' | 'transak'>('moonpay');
  const [fiatAmount, setFiatAmount] = useState('100');
  const [fiatCurrency, setFiatCurrency] = useState('USD');
  const [cryptoCurrency, setCryptoCurrency] = useState('USDC');
  const [walletAddress, setWalletAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [recentSessions, setRecentSessions] = useState<OnRampSession[]>([]);

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role !== 'creator' && user.role !== 'admin') {
      router.replace('/unauthorized');
      return;
    }

    const onRampService = OnRampService.getInstance();
    setProviders(onRampService.getProviders());
    setRecentSessions(onRampService.getRecentSessions(5));

    // Load wallet address if available
    const savedSettings = localStorage.getItem(`creator_settings_${user.id}`);
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      if (settings.walletAddress) {
        setWalletAddress(settings.walletAddress);
      }
    }
  }, [user, router]);

  if (!user || (user.role !== 'creator' && user.role !== 'admin')) {
    return null;
  }

  const selectedProviderData = providers.find(p => p.name === selectedProvider);

  const handleConnectWallet = async () => {
    try {
      const walletService = WalletService.getInstance();
      const walletInfo = await walletService.linkAccount();
      setWalletAddress(walletInfo.address);
      toast.success('Wallet connected!');
    } catch (error) {
      toast.error('Failed to connect wallet');
      console.error(error);
    }
  };

  const handleTopUp = async () => {
    if (!walletAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    const amount = parseFloat(fiatAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const onRampService = OnRampService.getInstance();
      const session = await onRampService.createOnRampSession({
        provider: selectedProvider,
        fiatAmount: amount,
        fiatCurrency,
        cryptoCurrency,
        walletAddress,
        email: user.email,
      });

      toast.success(`On-ramp session created! Session ID: ${session.sessionId}`);
      
      // Simulate completion after 3 seconds
      setTimeout(async () => {
        await onRampService.completeOnRampSession(
          session.sessionId,
          `0x${Math.random().toString(16).slice(2, 66)}`
        );
        toast.success('Top-up completed successfully!');
        setRecentSessions(onRampService.getRecentSessions(5));
      }, 3000);

      setRecentSessions(onRampService.getRecentSessions(5));
    } catch (error) {
      toast.error('Failed to create on-ramp session');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CreatorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Top Up
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Add funds to your wallet using fiat currency.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Up Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Wallet Connection */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Wallet Address
              </h3>
              {walletAddress ? (
                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <span className="text-2xl">✅</span>
                  <div className="flex-1">
                    <p className="font-medium text-green-900 dark:text-green-100">
                      Wallet Connected
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300 font-mono">
                      {walletAddress.slice(0, 10)}...{walletAddress.slice(-8)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-gray-600 dark:text-gray-400">
                    Connect your wallet to receive funds.
                  </p>
                  <button
                    onClick={handleConnectWallet}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Connect Wallet
                  </button>
                </div>
              )}
            </div>

            {/* Provider Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Select Provider
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {providers.map(provider => (
                  <button
                    key={provider.name}
                    onClick={() => setSelectedProvider(provider.name)}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      selectedProvider === provider.name
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {provider.displayName}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {provider.supportedCurrencies.length} currencies
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount and Currency */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Amount
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fiat Amount
                    </label>
                    <input
                      type="number"
                      value={fiatAmount}
                      onChange={(e) => setFiatAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fiat Currency
                    </label>
                    <select
                      value={fiatCurrency}
                      onChange={(e) => setFiatCurrency(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {selectedProviderData?.supportedCurrencies.map(currency => (
                        <option key={currency} value={currency}>{currency}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Receive Crypto
                  </label>
                  <select
                    value={cryptoCurrency}
                    onChange={(e) => setCryptoCurrency(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {selectedProviderData?.supportedCrypto.map(crypto => (
                      <option key={crypto} value={crypto}>{crypto}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleTopUp}
                  disabled={loading || !walletAddress}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : `Top Up ${fiatAmount} ${fiatCurrency}`}
                </button>
              </div>
            </div>
          </div>

          {/* Recent Sessions */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Recent Top-Ups
              </h3>
              {recentSessions.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  No recent top-ups.
                </p>
              ) : (
                <div className="space-y-3">
                  {recentSessions.map(session => (
                    <div
                      key={session.sessionId}
                      className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {session.fiatAmount} {session.fiatCurrency}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          session.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          session.status === 'processing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          session.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {session.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {session.cryptoAmount?.toFixed(4)} {session.cryptoCurrency}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {new Date(session.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </CreatorLayout>
  );
}
