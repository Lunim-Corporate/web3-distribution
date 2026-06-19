'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
// Badge available from '@/components/ui/Badge' if needed
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth';
import { useRevenueSplitter } from '@/lib/web3';
import { truncateAddress } from '@/lib/utils';
import { toast } from 'react-hot-toast';

// requiredChainIdDec unused in SmartContractPanel

// requiredChainIdHex available for wallet network switching:
// const requiredChainIdHex = requiredChainIdDec != null ? `0x${requiredChainIdDec.toString(16)}` : null;

export const SmartContractPanel: React.FC = () => {
  const { user, logout } = useAuth();
  const { 
    distributeRevenue, 
    getContractBalanceEth: getBalanceHook,
    smartAccountAddress,
    isInitializing
  } = useRevenueSplitter();

  const [contractBalanceEth, setContractBalanceEth] = useState<string>('0');
  const [loadingBalance, setLoadingBalance] = useState<boolean>(false);
  const [sendAmountEth, setSendAmountEth] = useState<string>('0.01');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [executing, setExecuting] = useState<boolean>(false);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedProjectForTx, setSelectedProjectForTx] = useState<string>('');


  const refreshContractBalance = async () => {
    try {
      setLoadingBalance(true);
      const bal = await getBalanceHook();
      setContractBalanceEth(bal);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to read contract balance');
    } finally {
      setLoadingBalance(false);
    }
  };

  // BUG FIX #5: Fetch projects for transaction linking
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch('/api/projects?ts=' + Date.now(), { cache: 'no-store' });
        const data = await res.json();
        setProjects(Array.isArray(data) ? data : []);
      } catch {
        setProjects([]);
      }
    };
    void fetchProjects();
  }, []);

  useEffect(() => {
    void refreshContractBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (smartAccountAddress) void refreshContractBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [smartAccountAddress]);

  const handleSendETH = async () => {
    if (!user || user.role !== 'admin') {
      toast.error('Admin only: You do not have permission to send transactions.');
      return;
    }
    if (!smartAccountAddress) {
      toast.error('Smart account not ready.');
      return;
    }

    try {
      setExecuting(true);
      setTxHash(null);

      toast.loading('Initiating distribution...');
      const hash = await distributeRevenue(sendAmountEth);
      toast.dismiss();
      setTxHash(hash);
      
      // BUG FIX #5: Record transaction to database if project is selected
      if (selectedProjectForTx) {
        try {
          const amountWei = parseFloat(sendAmountEth) * 100; // For USD cents equivalence
          const res = await fetch('/api/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              project_id: selectedProjectForTx,
              amount_cents: Math.round(amountWei),
              source: 'Smart Contract - ETH Transfer',
              tx_hash: hash,
            }),
          });
          if (res.ok) {
            toast.success('Transaction submitted and recorded!');
          } else {
            toast.success('Transaction submitted! (Payment recording pending)');
          }
        } catch {
          toast.success('Transaction submitted! (Payment recording failed - manual entry may be needed)');
        }
      } else {
        toast.success('Transaction submitted! (Optional: Select a project to link this transaction to a payment record)');
      }

      await refreshContractBalance();
      // Notify other components about the transaction
      window.dispatchEvent(new CustomEvent('payment-recorded', { detail: { txHash: hash } }));
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
    if (!smartAccountAddress) {
      toast.error('Smart account not ready.');
      return;
    }

    try {
      setExecuting(true);
      setTxHash(null);

      toast.loading('Distributing revenue to holders...');
      const hash = await distributeRevenue(sendAmountEth);
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
          Wallet-connected reads/writes via viem and permissionless.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Smart Account</div>
              <div className="font-medium text-gray-900 dark:text-white mt-1">
                {isInitializing ? 'Initializing...' : (smartAccountAddress ? truncateAddress(smartAccountAddress) : 'Not ready')}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Type: Alchemy SimpleAccount (ERC-4337)
              </div>
            </div>

            <div className="flex flex-col gap-2 items-end">
              {!user ? (
                <div className="text-sm text-red-500 font-medium">Please login</div>
              ) : (
                <Button onClick={() => void logout()} variant="secondary">
                  Logout
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

              <div className="mt-3">
                <label className="text-sm text-gray-600 dark:text-gray-400">Link to Project (Optional)</label>
                <select
                  value={selectedProjectForTx}
                  onChange={(e) => setSelectedProjectForTx(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">No Project Selected</option>
                  {projects.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
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
                Calls `distributeRevenue()` to split ETH among all rights holders.
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

