'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useEthPrice } from '@/app/lib/useEthPrice';
import { useRevenueSplitter } from '@/lib/web3';

interface RightsHolder {
  id: string;
  full_name: string;
  role: string;
  wallet_address: string;
  percentage: number;
  total_received: number;
}

interface HolderEarningsCardProps {
  projectId: string;
  holders: RightsHolder[];
  isDemoMode: boolean;
}

export function HolderEarningsCard({ holders }: Omit<HolderEarningsCardProps, 'projectId' | 'isDemoMode'>) {
  const { ethPrice } = useEthPrice();
  const { getAccruedBalanceEth, claimRevenue } = useRevenueSplitter();
  
  // Accrued balances mapping (holder_address -> ETH string)
  const [accruedBalances, setAccruedBalances] = useState<Record<string, string>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isClaiming, setIsClaiming] = useState<Record<string, boolean>>({});

  const refreshBalances = useCallback(async () => {
    if (!holders || holders.length === 0) return;
    setIsRefreshing(true);
    const balances: Record<string, string> = {};
    
    try {
      await Promise.all(
        holders.map(async (h) => {
          if (h.wallet_address) {
            const bal = await getAccruedBalanceEth(h.wallet_address);
            balances[h.wallet_address.toLowerCase()] = bal;
          }
        })
      );
      setAccruedBalances(balances);
    } catch (e) {
      console.error('Failed to retrieve accrued balances:', e);
    } finally {
      setIsRefreshing(false);
    }
  }, [holders, getAccruedBalanceEth]);

  useEffect(() => {
    refreshBalances();

    // Refresh when a new payment is recorded
    const onPaymentRecorded = () => {
      refreshBalances();
    };

    window.addEventListener('payment-recorded', onPaymentRecorded);
    return () => {
      window.removeEventListener('payment-recorded', onPaymentRecorded);
    };
  }, [refreshBalances]);

  const handleClaim = async (holderAddress: string) => {
    setIsClaiming(prev => ({ ...prev, [holderAddress.toLowerCase()]: true }));
    try {
      toast.loading('Processing claim transaction...', { id: 'claim-toast' });
      const txHash = await claimRevenue();
      
      toast.success(`Claim successful! TX: ${txHash.slice(0, 8)}...`, { id: 'claim-toast' });
      
      // Refresh database records or trigger event
      window.dispatchEvent(new Event('payment-recorded'));
      refreshBalances();
    } catch (e: any) {
      toast.error(e.message || 'Claim transaction failed', { id: 'claim-toast' });
    } finally {
      setIsClaiming(prev => ({ ...prev, [holderAddress.toLowerCase()]: false }));
    }
  };

  const getAccrued = (addr: string) => accruedBalances[addr.toLowerCase()] || '0.0';

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-4">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <h2 className="text-lg font-black text-white">Shareholder Claim Center</h2>
          <p className="text-xs text-gray-500 mt-0.5">Track individual total earnings and pull-payment claims</p>
        </div>
        <button 
          onClick={refreshBalances}
          disabled={isRefreshing}
          className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg text-gray-300 font-bold transition-all disabled:opacity-50"
        >
          {isRefreshing ? 'Refreshing...' : '🔄 Refresh Balances'}
        </button>
      </div>

      {holders.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="font-medium text-sm">No shareholders configured</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {holders.map((h) => {
            const accrued = getAccrued(h.wallet_address);
            const unclaimedUsd = parseFloat(accrued) * ethPrice;
            const totalEarnedUsd = h.total_received * ethPrice;
            const isClaimBtnDisabled = parseFloat(accrued) <= 0 || isClaiming[h.wallet_address.toLowerCase()];
            
            return (
              <div 
                key={h.id} 
                className="bg-white/3 border border-white/5 hover:border-white/10 transition-all rounded-xl p-4 flex flex-col justify-between gap-4"
              >
                {/* Holder Profile */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-300 font-black text-sm shrink-0">
                      {h.full_name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-white text-sm truncate">{h.full_name}</p>
                      <p className="text-xs text-gray-400 truncate">{h.role}</p>
                    </div>
                  </div>
                  <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-black text-xs px-2.5 py-1 rounded-full shrink-0">
                    {h.percentage}% share
                  </div>
                </div>

                {/* Earnings Summary */}
                <div className="grid grid-cols-2 gap-3 border-t border-b border-white/5 py-3 text-xs">
                  <div>
                    <p className="text-gray-500 font-bold uppercase text-[9px] tracking-wider">Total Received</p>
                    <p className="text-sm font-black text-white font-mono mt-0.5">{h.total_received.toFixed(4)} ETH</p>
                    <p className="text-[10px] text-gray-500 font-mono">≈ ${totalEarnedUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-bold uppercase text-[9px] tracking-wider">Claimable Accrued</p>
                    <p className="text-sm font-black text-emerald-400 font-mono mt-0.5">{parseFloat(accrued).toFixed(4)} ETH</p>
                    <p className="text-[10px] text-gray-500 font-mono">≈ ${unclaimedUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                  </div>
                </div>

                {/* Claim action */}
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[9px] font-mono text-gray-500 truncate" title={h.wallet_address}>
                    {h.wallet_address}
                  </span>
                  
                  <button
                    onClick={() => handleClaim(h.wallet_address)}
                    disabled={isClaimBtnDisabled}
                    className={`px-4 py-2 text-xs font-black rounded-lg transition-all shadow-md shrink-0 ${
                      isClaimBtnDisabled
                        ? 'bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed shadow-none'
                        : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black shadow-emerald-500/10'
                    }`}
                  >
                    {isClaiming[h.wallet_address.toLowerCase()] ? 'Claiming...' : 'Claim Payout'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
