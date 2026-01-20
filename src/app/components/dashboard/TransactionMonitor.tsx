'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { TransactionService } from '@/lib/services/TransactionService';
import { TransactionReceipt, TransactionStatus } from '@/lib/services/types';
import { formatCurrency, truncateAddress } from '@/lib/utils';

export const TransactionMonitor: React.FC = () => {
  const [transactions, setTransactions] = useState<TransactionReceipt[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const transactionService = TransactionService.getInstance();

  useEffect(() => {
    loadTransactions();
    const interval = setInterval(loadTransactions, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadTransactions = () => {
    const recent = transactionService.getRecentTransactions(5);
    setTransactions(recent);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await transactionService.refreshPendingTransactions();
      loadTransactions();
    } catch (error) {
      console.error('Failed to refresh transactions:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear transaction history?')) {
      transactionService.clearTransactionHistory();
      loadTransactions();
    }
  };

  const getStatusColor = (status: TransactionStatus): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case TransactionStatus.CONFIRMED:
        return 'success';
      case TransactionStatus.PENDING:
        return 'warning';
      case TransactionStatus.FAILED:
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: TransactionStatus): string => {
    switch (status) {
      case TransactionStatus.CONFIRMED:
        return '✅';
      case TransactionStatus.PENDING:
        return '⏳';
      case TransactionStatus.FAILED:
        return '❌';
      default:
        return '❓';
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Transactions</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Monitor your blockchain transactions in real-time
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefresh}
              isLoading={isRefreshing}
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            {transactions.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearHistory}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 dark:text-gray-600 mb-2">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              No transactions yet
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              Your transaction history will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.hash}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">{getStatusIcon(tx.status)}</span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {truncateAddress(tx.hash)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTimestamp(tx.timestamp)}
                      </p>
                    </div>
                  </div>
                  <Badge variant={getStatusColor(tx.status)}>
                    {tx.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">From</p>
                    <p className="font-mono text-gray-900 dark:text-white">
                      {truncateAddress(tx.from)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">To</p>
                    <p className="font-mono text-gray-900 dark:text-white">
                      {truncateAddress(tx.to)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Value</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {tx.value} ETH
                    </p>
                  </div>
                  {tx.blockNumber > 0 && (
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Block</p>
                      <p className="font-mono text-gray-900 dark:text-white">
                        #{tx.blockNumber}
                      </p>
                    </div>
                  )}
                </div>

                {tx.status === TransactionStatus.CONFIRMED && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>Gas Used: {tx.gasUsed}</span>
                      <a
                        href={`https://etherscan.io/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      >
                        View on Explorer →
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
