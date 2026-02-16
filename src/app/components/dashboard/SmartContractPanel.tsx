'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency, truncateAddress } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useWallet } from '@/lib/wallet';
import { mockContracts } from '@/data/mockData';
import { getWalletByUserId } from '@/data/dummyWallets';
import MockWalletService from '@/lib/walletUtils';
import { toast } from 'react-hot-toast';

export const SmartContractPanel: React.FC = () => {
  const { user } = useAuth();
  const { account, isConnected, isConnecting, chainId, balance, connectWallet, disconnectWallet } = useWallet();
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [userWallet, setUserWallet] = useState<any>(null);
  const [walletStats, setWalletStats] = useState<any>(null);

  // Load user's dummy wallet data
  useEffect(() => {
    if (user?.id) {
      const wallet = getWalletByUserId(user.id);
      setUserWallet(wallet);
      if (wallet?.address) {
        const stats = MockWalletService.getWalletStatistics(wallet.address);
        setWalletStats(stats);
      }
    }
  }, [user?.id]);

  const getNetworkName = (chainId: number | null): string => {
    switch (chainId) {
      case 1: return 'Ethereum Mainnet';
      case 5: return 'Goerli Testnet';
      case 137: return 'Polygon Mainnet';
      case 80001: return 'Polygon Mumbai';
      case 56: return 'BSC Mainnet';
      case 97: return 'BSC Testnet';
      default: return 'Unknown Network';
    }
  };

  const handleContractInteraction = async (functionName: string) => {
    if (!isConnected && !userWallet) {
      toast.error('Please connect your wallet first.');
      return;
    }

    if (functionName && user?.role !== 'admin' && functionName !== 'getProject' && functionName !== 'getContributorShare') {
      toast.error('Admin only: You do not have permission to execute write functions.');
      return;
    }

    setIsExecuting(true);
    try {
      toast.loading(`Executing ${functionName}...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.dismiss();
      toast.success(`${functionName} executed successfully!`);
      console.log(`Contract function ${functionName} called with account:`, account);
    } catch (error) {
      toast.dismiss();
      toast.error(`Failed to execute ${functionName}`);
      console.error('Contract interaction failed:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleViewContract = (contract: any) => {
    setSelectedContract(contract);
    setIsModalOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Smart Contracts & Web3 Wallet</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage smart contracts and wallet transactions
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Wallet Information Section */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Wallet Information</h3>
            {userWallet ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Wallet Address</p>
                  <p className="text-sm font-mono font-semibold text-gray-900 dark:text-white">
                    {truncateAddress(userWallet.address)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Balance</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {userWallet.balance} MATIC
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    ≈ £{(parseFloat(userWallet.balance) * 0.85).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Network</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {userWallet.network}
                  </p>
                  <Badge variant="info">{userWallet.chainId}</Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                  <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                    ✅ Connected
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No wallet found for your account.
              </p>
            )}
          </div>

          {/* Wallet Statistics */}
          {walletStats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Earnings</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  £{walletStats.totalEarnings.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Distributed</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  £{walletStats.totalDistributed.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Completed Transactions</p>
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                  {walletStats.completedTransactions}
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Pending Transactions</p>
                <p className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                  {walletStats.pendingTransactions}
                </p>
              </div>
            </div>
          )}

          {/* Recent Transactions */}
          {userWallet && userWallet.transactions.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Recent Transactions</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {userWallet.transactions.slice(0, 5).map((tx: any) => (
                  <div
                    key={tx.id}
                    className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {tx.projectName}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {tx.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {tx.amount} MATIC
                      </p>
                      <Badge
                        variant={
                          tx.status === 'completed'
                            ? 'success'
                            : tx.status === 'pending'
                            ? 'warning'
                            : 'error'
                        }
                      >
                        {tx.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Smart Contracts */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Deployed Contracts</h4>
            <div className="space-y-4">
              {mockContracts.map((contract) => (
                <div
                  key={contract.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h5 className="font-medium text-gray-900 dark:text-white">
                          {contract.name}
                        </h5>
                        <Badge variant={contract.isActive ? 'success' : 'default'}>
                          {contract.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Address</p>
                          <p className="text-sm font-mono text-gray-900 dark:text-white">
                            {truncateAddress(contract.address)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Transactions</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {contract.totalTransactions}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Total Value</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(contract.totalValue)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {contract.functions.slice(0, 3).map((func, index) => (
                          <button
                            key={index}
                            onClick={() => handleContractInteraction(func.name)}
                            disabled={isExecuting}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors disabled:opacity-50 ${
                              func.type === 'write'
                                ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200'
                                : 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200'
                            }`}
                          >
                            {func.name}()
                          </button>
                        ))}
                        {contract.functions.length > 3 && (
                          <span className="text-sm text-gray-500 px-3 py-1">
                            +{contract.functions.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    <Button
                      onClick={() => handleViewContract(contract)}
                      size="sm"
                      variant="ghost"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contract Details Modal */}
      {isModalOpen && selectedContract && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <div className="p-6 max-w-2xl max-h-96 overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              {selectedContract.name}
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Contract Address
                </h3>
                <p className="font-mono text-sm text-gray-600 dark:text-gray-400 break-all">
                  {selectedContract.address}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Available Functions
                </h3>
                <div className="space-y-2">
                  {selectedContract.functions.map((func: any, index: number) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <p className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                        {func.name}()
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Type: {func.type} | Gas: {func.gasEstimate}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  onClick={() => setIsModalOpen(false)}
                  variant="ghost"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
