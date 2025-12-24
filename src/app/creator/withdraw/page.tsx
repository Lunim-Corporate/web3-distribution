'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { CreatorLayout } from '@/components/layouts/CreatorLayout';
import { OffRampService, OffRampProvider, OffRampTransaction, BankAccount } from '@/lib/services/OffRampService';
import { WalletService } from '@/lib/services/WalletService';
import { PaymentService } from '@/lib/services/PaymentService';
import { toast } from 'react-hot-toast';

export default function CreatorWithdrawPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [providers, setProviders] = useState<OffRampProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<'tink' | 'truelayer' | 'plaid' | 'chimoney' | 'paystack'>('chimoney');
  const [cryptoAmount, setCryptoAmount] = useState('100');
  const [cryptoCurrency, setCryptoCurrency] = useState('USDC');
  const [fiatCurrency, setFiatCurrency] = useState('USD');
  const [walletAddress, setWalletAddress] = useState('');
  const [walletBalance, setWalletBalance] = useState('0');
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedBankAccount, setSelectedBankAccount] = useState('');
  const [loading, setLoading] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<OffRampTransaction[]>([]);
  const [showAddBank, setShowAddBank] = useState(false);
  const [newBankAccount, setNewBankAccount] = useState({
    accountName: '',
    accountNumber: '',
    bankName: '',
    routingNumber: '',
    currency: 'USD',
  });

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role !== 'creator' && user.role !== 'admin') {
      router.replace('/unauthorized');
      return;
    }

    const offRampService = OffRampService.getInstance();
    setProviders(offRampService.getProviders());
    setRecentTransactions(offRampService.getRecentTransactions(5));
    setBankAccounts(offRampService.getBankAccounts());

    // Load wallet address and balance
    const savedSettings = localStorage.getItem(`creator_settings_${user.id}`);
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      if (settings.walletAddress) {
        setWalletAddress(settings.walletAddress);
        loadWalletBalance(settings.walletAddress);
      }
    }
  }, [user, router]);

  const loadWalletBalance = async (address: string) => {
    try {
      const paymentService = PaymentService.getInstance();
      const balance = await paymentService.getBalance(address);
      setWalletBalance(balance);
    } catch (error) {
      console.error('Failed to load balance:', error);
    }
  };

  if (!user || (user.role !== 'creator' && user.role !== 'admin')) {
    return null;
  }

  const selectedProviderData = providers.find(p => p.name === selectedProvider);

  const handleConnectWallet = async () => {
    try {
      const walletService = WalletService.getInstance();
      const walletInfo = await walletService.linkAccount();
      setWalletAddress(walletInfo.address);
      setWalletBalance(walletInfo.balance);
      toast.success('Wallet connected!');
    } catch (error) {
      toast.error('Failed to connect wallet');
      console.error(error);
    }
  };

  const handleAddBankAccount = () => {
    if (!newBankAccount.accountName || !newBankAccount.accountNumber || !newBankAccount.bankName) {
      toast.error('Please fill in all required fields');
      return;
    }

    const offRampService = OffRampService.getInstance();
    const account: BankAccount = {
      id: `bank_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      ...newBankAccount,
    };

    offRampService.saveBankAccount(account);
    setBankAccounts(offRampService.getBankAccounts());
    setSelectedBankAccount(account.id);
    setShowAddBank(false);
    setNewBankAccount({
      accountName: '',
      accountNumber: '',
      bankName: '',
      routingNumber: '',
      currency: 'USD',
    });
    toast.success('Bank account added successfully!');
  };

  const handleWithdraw = async () => {
    if (!walletAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!selectedBankAccount) {
      toast.error('Please select a bank account');
      return;
    }

    const amount = parseFloat(cryptoAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const balance = parseFloat(walletBalance);
    if (amount > balance) {
      toast.error('Insufficient balance');
      return;
    }

    setLoading(true);
    try {
      const offRampService = OffRampService.getInstance();
      const transaction = await offRampService.createWithdrawal({
        provider: selectedProvider,
        cryptoAmount: amount,
        cryptoCurrency,
        fiatCurrency,
        bankAccountId: selectedBankAccount,
        walletAddress,
      });

      toast.success(`Withdrawal initiated! Transaction ID: ${transaction.transactionId}`);
      
      // Simulate completion after 5 seconds
      setTimeout(async () => {
        await offRampService.completeWithdrawal(
          transaction.transactionId,
          `0x${Math.random().toString(16).slice(2, 66)}`
        );
        toast.success('Withdrawal completed successfully!');
        setRecentTransactions(offRampService.getRecentTransactions(5));
        loadWalletBalance(walletAddress);
      }, 5000);

      setRecentTransactions(offRampService.getRecentTransactions(5));
    } catch (error) {
      toast.error('Failed to create withdrawal');
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
            Withdraw
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Convert your crypto to fiat and withdraw to your bank account.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Withdraw Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Wallet Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Wallet Balance
              </h3>
              {walletAddress ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Available Balance</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {parseFloat(walletBalance).toFixed(4)} ETH
                      </p>
                    </div>
                    <span className="text-3xl">💰</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                    {walletAddress.slice(0, 10)}...{walletAddress.slice(-8)}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-gray-600 dark:text-gray-400">
                    Connect your wallet to check balance.
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

            {/* Bank Account Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Bank Account
                </h3>
                <button
                  onClick={() => setShowAddBank(!showAddBank)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {showAddBank ? 'Cancel' : '+ Add New'}
                </button>
              </div>

              {showAddBank ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Account Name *
                    </label>
                    <input
                      type="text"
                      value={newBankAccount.accountName}
                      onChange={(e) => setNewBankAccount({ ...newBankAccount, accountName: e.target.value })}
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
                      value={newBankAccount.accountNumber}
                      onChange={(e) => setNewBankAccount({ ...newBankAccount, accountNumber: e.target.value })}
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
                      value={newBankAccount.bankName}
                      onChange={(e) => setNewBankAccount({ ...newBankAccount, bankName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Chase Bank"
                    />
                  </div>
                  <button
                    onClick={handleAddBankAccount}
                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Add Bank Account
                  </button>
                </div>
              ) : bankAccounts.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">
                  No bank accounts added yet.
                </p>
              ) : (
                <select
                  value={selectedBankAccount}
                  onChange={(e) => setSelectedBankAccount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select a bank account</option>
                  {bankAccounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.bankName} - {account.accountNumber.slice(-4)}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Provider Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Select Provider
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {providers.map(provider => (
                  <button
                    key={provider.name}
                    onClick={() => setSelectedProvider(provider.name)}
                    className={`p-4 border-2 rounded-lg transition-all text-left ${
                      selectedProvider === provider.name
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {provider.displayName}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {provider.supportedRegions.join(', ')}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Withdrawal Amount
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Crypto Amount
                    </label>
                    <input
                      type="number"
                      value={cryptoAmount}
                      onChange={(e) => setCryptoAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Crypto Currency
                    </label>
                    <select
                      value={cryptoCurrency}
                      onChange={(e) => setCryptoCurrency(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="USDC">USDC</option>
                      <option value="USDT">USDT</option>
                      <option value="ETH">ETH</option>
                      <option value="MATIC">MATIC</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Receive Currency
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
                <button
                  onClick={handleWithdraw}
                  disabled={loading || !walletAddress || !selectedBankAccount}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : `Withdraw ${cryptoAmount} ${cryptoCurrency}`}
                </button>
              </div>
            </div>
          </div>

          {/* Recent Withdrawals */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Recent Withdrawals
              </h3>
              {recentTransactions.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  No recent withdrawals.
                </p>
              ) : (
                <div className="space-y-3">
                  {recentTransactions.map(tx => (
                    <div
                      key={tx.transactionId}
                      className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {tx.fiatAmount.toFixed(2)} {tx.fiatCurrency}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          tx.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          tx.status === 'processing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          tx.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {tx.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {tx.cryptoAmount} {tx.cryptoCurrency}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {new Date(tx.createdAt).toLocaleDateString()}
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
