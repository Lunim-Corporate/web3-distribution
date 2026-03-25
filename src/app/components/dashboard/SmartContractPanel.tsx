'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth';
import { useWallet } from '@/lib/wallet';
import { RevenueSplitterService } from '@/lib/web3';
import { truncateAddress } from '@/lib/utils';
import { toast } from 'react-hot-toast';

const requiredChainIdDec = (() => {
  const raw = process.env.NEXT_PUBLIC_CHAIN_ID;
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) ? n : null;
})();

const requiredChainIdHex =
  requiredChainIdDec != null ? `0x${requiredChainIdDec.toString(16)}` : null;

export const SmartContractPanel: React.FC = () => {
  const { user } = useAuth();
  const {
    account,
    isConnected,
    chainId,
    balance,
    connectWallet,
    disconnectWallet,
    switchNetwork,
  } = useWallet();

  const [contractBalanceEth, setContractBalanceEth] = useState<string>('0');
  const [loadingBalance, setLoadingBalance] = useState<boolean>(false);
  const [sendAmountEth, setSendAmountEth] = useState<string>('0.01');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [executing, setExecuting] = useState<boolean>(false);

  const refreshContractBalance = async () => {
    try {
      setLoadingBalance(true);
      const svc = RevenueSplitterService.create();
      const bal = await svc.getContractBalanceEth();
      setContractBalanceEth(bal);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to read contract balance');
    } finally {
      setLoadingBalance(false);
    }
  };

  useEffect(() => {
    void refreshContractBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isConnected) void refreshContractBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, chainId]);

  const ensureCorrectNetwork = async () => {
    if (!requiredChainIdHex) return;
    if (typeof chainId !== 'number') return;
    if (requiredChainIdDec == null) return;
    if (chainId === requiredChainIdDec) return;
    await switchNetwork(requiredChainIdHex);
  };

  const handleSendETH = async () => {
    if (!user || user.role !== 'admin') {
      toast.error('Admin only: You do not have permission to send transactions.');
      return;
    }
    if (!isConnected) {
      toast.error('Please connect your wallet first.');
      return;
    }

    try {
      setExecuting(true);
      setTxHash(null);
      await ensureCorrectNetwork();

      toast.loading('Sending ETH to contract...');
      const svc = RevenueSplitterService.create();
      const hash = await svc.sendETHToContract(sendAmountEth);
      toast.dismiss();
      setTxHash(hash);
      toast.success('Transaction submitted!');
      await refreshContractBalance();
    } catch (e) {
      toast.dismiss();
      toast.error(e instanceof Error ? e.message : 'Failed to send ETH');
    } finally {
      setExecuting(false);
    }
  };

  const handleReleasePayments = async () => {
    if (!user || user.role !== 'admin') {
      toast.error('Admin only: You do not have permission to release payments.');
      return;
    }
    if (!isConnected) {
      toast.error('Please connect your wallet first.');
      return;
    }

    try {
      setExecuting(true);
      setTxHash(null);
      await ensureCorrectNetwork();

      toast.loading('Releasing payments...');
      const svc = RevenueSplitterService.create();
      const hash = await svc.releasePayments();
      toast.dismiss();
      setTxHash(hash);
      toast.success('Release transaction submitted!');
      await refreshContractBalance();
    } catch (e) {
      toast.dismiss();
      toast.error(e instanceof Error ? e.message : 'Failed to release payments');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Smart Contract Panel</CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Wallet-connected reads/writes via ethers.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Wallet</div>
              <div className="font-medium text-gray-900 dark:text-white mt-1">
                {account ? truncateAddress(account) : 'Not connected'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {balance ? `Balance: ${balance} ETH` : 'Balance: -'}
              </div>
              {requiredChainIdDec != null && typeof chainId === 'number' && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Network: {chainId}{' '}
                  {chainId === requiredChainIdDec ? (
                    <Badge variant="success">OK</Badge>
                  ) : (
                    <Badge variant="warning">Switch required</Badge>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 items-end">
              {!isConnected ? (
                <Button onClick={() => void connectWallet()} variant="primary">
                  Connect Wallet
                </Button>
              ) : (
                <Button onClick={disconnectWallet} variant="secondary">
                  Disconnect
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Contract balance</div>
              <div className="font-medium text-gray-900 dark:text-white mt-1">
                {loadingBalance ? 'Loading...' : `${contractBalanceEth} ETH`}
              </div>
            </div>
            <div>
              <Button
                onClick={() => void refreshContractBalance()}
                variant="ghost"
                disabled={loadingBalance}
              >
                Refresh
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Send ETH to contract
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Transfers ETH value to the splitter address.
              </div>

              <div className="mt-3 flex gap-2">
                <input
                  type="number"
                  step="0.0001"
                  value={sendAmountEth}
                  onChange={(e) => setSendAmountEth(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <Button
                  onClick={() => void handleSendETH()}
                  disabled={executing}
                  variant="primary"
                >
                  Send
                </Button>
              </div>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Release payments
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Calls `releasePayments()` on the deployed contract.
              </div>

              <div className="mt-3 flex justify-end">
                <Button
                  onClick={() => void handleReleasePayments()}
                  disabled={executing}
                  variant="secondary"
                >
                  Release
                </Button>
              </div>
            </div>
          </div>

          {txHash && (
            <div className="text-sm">
              <div className="text-gray-600 dark:text-gray-400">Last transaction</div>
              <div className="font-mono text-gray-900 dark:text-white break-all">
                {txHash}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

