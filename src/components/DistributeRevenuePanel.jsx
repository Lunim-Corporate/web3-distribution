import React from 'react';

const formatUSD = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(amount || 0));

const DistributeRevenuePanel = ({
  isConnected,
  walletAddress,
  connectWallet,
  sendRevenue,
  txStatus,
  lastTxHash,
  errorMessage,
  rightsHolders,
  distributeAmount,
  setDistributeAmount,
  isDemoMode,
  project,
  projectsList,
  onProjectChange
}) => {
  const ETH_USD_RATE = 3500;

  const getPreviewSplit = (percentage) => {
    if (!distributeAmount || isNaN(distributeAmount)) return 0;
    const totalUSD = Number(distributeAmount) * ETH_USD_RATE;
    return (totalUSD * Number(percentage)) / 100;
  };

  const totalSplit = rightsHolders.reduce((sum, h) => sum + getPreviewSplit(h.percentage), 0);
  const totalPercentage = rightsHolders.reduce((sum, h) => sum + Number(h.percentage || 0), 0);

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-xl relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 relative z-10 gap-3">
        <div>
          <h2 className="text-base font-black text-white uppercase tracking-tighter">Distribute Revenue</h2>
          <p className="text-[10px] font-bold text-gray-500 mt-0.5 uppercase tracking-widest">
            {isDemoMode ? 'Simulated Blockchain Settlement' : 'On-Chain Settlement'}
          </p>
        </div>

        {isConnected ? (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="text-xs font-mono font-bold text-emerald-400">
              {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
            </span>
          </div>
        ) : (
          <button
            onClick={connectWallet}
            className="text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105 active:scale-95"
          >
            {isDemoMode ? '⚡ Connect (Demo)' : '🦊 Connect Wallet'}
          </button>
        )}
      </div>

      {/* Demo Mode indicator */}
      {isDemoMode && isConnected && (
        <div className="mb-4 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 relative z-10">
          <span className="text-sm">🟢</span>
          <span className="text-[11px] font-bold text-emerald-400">
            Ready — Enter ETH amount below and click Distribute to process a transaction
          </span>
        </div>
      )}

      <div className="space-y-5 relative z-10">
        {/* Amount Input */}
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex justify-between">
            <span>Revenue Amount (ETH)</span>
            <span className="text-indigo-400">1 ETH = $3,500</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="text-gray-400 font-bold text-lg">Ξ</span>
            </div>
            <input
              type="number"
              step="0.1"
              min="0"
              value={distributeAmount}
              onChange={(e) => setDistributeAmount(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-9 pr-6 text-2xl font-mono font-bold text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder-gray-600"
              placeholder="0.5"
            />
          </div>
          {distributeAmount && Number(distributeAmount) > 0 && (
            <div className="mt-2 text-right text-sm font-mono text-indigo-400">
              ≈ {formatUSD(Number(distributeAmount) * ETH_USD_RATE)}
            </div>
          )}
        </div>

        {/* Split Preview */}
        {rightsHolders.length > 0 && (
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Live Split Preview</h3>
              {totalPercentage !== 100 && (
                <span className="text-[10px] font-bold text-amber-500">⚠ {totalPercentage}% allocated</span>
              )}
            </div>
            <div className="space-y-2">
              {rightsHolders.map((holder) => (
                <div
                  key={holder.id}
                  className="flex justify-between items-center bg-white/5 px-3 py-2.5 rounded-lg border border-white/5"
                >
                  <div className="min-w-0 flex-1 mr-2">
                    <div className="text-xs font-bold text-gray-200 truncate">{holder.name}</div>
                    <div className="text-[10px] text-gray-500 truncate">({holder.percentage}%)</div>
                  </div>
                  <span className="text-xs font-mono font-bold text-indigo-400">
                    +{formatUSD(getPreviewSplit(holder.percentage))}
                  </span>
                </div>
              ))}
            </div>
            {totalSplit > 0 && (
              <div className="flex justify-between items-center pt-3 mt-3 border-t border-white/10">
                <span className="text-xs font-bold text-gray-500">Total</span>
                <span className="text-sm font-mono font-bold text-white">{formatUSD(totalSplit)}</span>
              </div>
            )}
          </div>
        )}

        {/* Distribute Button */}
        <button
          onClick={() => sendRevenue(distributeAmount)}
          disabled={!isConnected || txStatus === 'pending' || !distributeAmount || Number(distributeAmount) <= 0}
          className={`w-full py-4 rounded-xl text-sm font-black tracking-widest uppercase transition-all shadow-lg transform active:scale-[0.98] ${
            txStatus === 'pending'
              ? 'bg-indigo-500/30 cursor-wait text-white/70 border border-indigo-500/30'
              : !isConnected || !distributeAmount || Number(distributeAmount) <= 0
                ? 'bg-white/5 text-gray-600 cursor-not-allowed shadow-none border border-white/5'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.01]'
          }`}
        >
          {txStatus === 'pending' ? (
            <div className="flex items-center justify-center gap-3">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Processing Transaction...</span>
            </div>
          ) : (
            isConnected ? `⚡ Distribute ${distributeAmount ? formatUSD(Number(distributeAmount) * ETH_USD_RATE) : 'Revenue'}` : 'Connect Wallet to Continue'
          )}
        </button>

        {/* Transaction Status */}
        {txStatus !== 'idle' && (
          <div className={`p-4 rounded-xl border ${
            txStatus === 'confirmed'
              ? 'bg-emerald-500/10 border-emerald-500/20'
              : txStatus === 'pending'
                ? 'bg-indigo-500/10 border-indigo-500/20'
                : 'bg-red-500/10 border-red-500/20'
          }`}>
            <div className="flex items-start gap-3">
              <span className="text-xl">
                {txStatus === 'confirmed' ? '✅' : txStatus === 'pending' ? '⏳' : '❌'}
              </span>
              <div className="flex-1">
                <div className={`text-sm font-bold ${
                  txStatus === 'confirmed' ? 'text-emerald-400' :
                  txStatus === 'pending' ? 'text-indigo-400' :
                  'text-red-400'
                }`}>
                  {txStatus === 'confirmed'
                    ? '🎉 Distribution Confirmed!'
                    : txStatus === 'pending'
                      ? 'Processing Transaction...'
                      : 'Transaction Failed'}
                </div>
                {txStatus === 'confirmed' && (
                  <p className="text-xs text-gray-400 mt-1">
                    Revenue has been distributed to all rights holders. Dashboard updated.
                  </p>
                )}
                {txStatus === 'pending' && (
                  <div className="mt-2">
                    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full"
                           style={{ width: '70%', animation: 'progress 2s ease-in-out infinite' }} />
                    </div>
                  </div>
                )}
                {errorMessage && (
                  <p className="text-xs text-red-400 mt-1">{errorMessage}</p>
                )}
                {lastTxHash && (
                  <div className="mt-2 pt-2 border-t border-white/5">
                    <span className="text-[10px] font-mono text-gray-500 mr-1 uppercase">Hash:</span>
                    <span className="text-[10px] font-mono text-indigo-400 break-all">
                      {lastTxHash.substring(0, 20)}...
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CSS for progress animation */}
      <style jsx>{`
        @keyframes progress {
          0% { width: 10%; }
          50% { width: 85%; }
          100% { width: 10%; }
        }
      `}</style>
    </div>
  );
};

export default DistributeRevenuePanel;
