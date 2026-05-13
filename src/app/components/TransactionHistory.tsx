import React, { useState } from 'react';

const formatUSD = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(amount || 0));

const TransactionHistory = ({ transactions }) => {
  const [expandedTx, setExpandedTx] = useState(null);

  if (!transactions || transactions.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-dashed border-white/10 p-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none" />
        <div className="text-4xl mb-3 relative z-10">📜</div>
        <h3 className="text-base font-bold text-gray-300 relative z-10">No transactions yet</h3>
        <p className="text-gray-500 max-w-xs mx-auto mt-2 text-sm relative z-10">
          Execute a revenue distribution to see your transaction history here.
        </p>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const styles = {
      confirmed: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
      completed: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
      pending: 'bg-amber-500/15 text-amber-400 border border-amber-500/20 animate-pulse',
      failed: 'bg-red-500/15 text-red-400 border border-red-500/20',
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide capitalize ${styles[status] || 'bg-gray-500/15 text-gray-400 border border-gray-500/20'}`}>
        {status || 'unknown'}
      </span>
    );
  };

  const formatHash = (hash) => {
    if (!hash) return '—';
    return `${hash.substring(0, 10)}...${hash.substring(hash.length - 6)}`;
  };

  const totalDistributed = transactions.reduce((sum, tx) => sum + Number(tx.total_amount || 0), 0);

  return (
    <div className="rounded-xl overflow-hidden border border-white/10">
      {/* Summary bar */}
      <div className="px-5 py-3.5 bg-white/5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            {transactions.length} Transaction{transactions.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="text-sm font-bold text-gray-300">
          Total: <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 font-mono">{formatUSD(totalDistributed)}</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02]">
              <th className="px-5 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">Date</th>
              <th className="px-5 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">Tx Hash</th>
              <th className="px-5 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Amount (USD)</th>
              <th className="px-5 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</th>
              <th className="px-5 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Details</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <React.Fragment key={tx.id}>
                <tr className="border-b border-white/5 hover:bg-white/[0.03] transition-colors group">
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                      {new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="text-[10px] text-gray-600 font-mono mt-0.5">
                      {new Date(tx.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {tx.tx_hash ? (
                      <span className="font-mono text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-default" title={tx.tx_hash}>
                        {formatHash(tx.tx_hash)}
                      </span>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="text-sm font-bold text-white font-mono tracking-tight">{formatUSD(tx.total_amount)}</span>
                  </td>
                  <td className="px-5 py-4">
                    {getStatusBadge(tx.status)}
                  </td>
                  <td className="px-5 py-4 text-center">
                    {tx.transaction_splits && tx.transaction_splits.length > 0 ? (
                      <button
                        onClick={() => setExpandedTx(expandedTx === tx.id ? null : tx.id)}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all border ${
                          expandedTx === tx.id
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                            : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {expandedTx === tx.id ? '▲ Hide' : '▼ View'} Splits
                      </button>
                    ) : (
                      <span className="text-[10px] text-gray-700">—</span>
                    )}
                  </td>
                </tr>
                {expandedTx === tx.id && (
                  <tr className="bg-indigo-500/5">
                    <td colSpan={5} className="px-5 py-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {tx.transaction_splits?.map((split) => (
                          <div key={split.id} className="bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10 hover:border-indigo-500/20 transition-all">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <div className="font-bold text-gray-200 text-sm">{split.name}</div>
                                <div className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">{split.role}</div>
                              </div>
                              <div className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                                {split.percentage}%
                              </div>
                            </div>
                            <div className="text-lg font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                              +{formatUSD(split.amount_eth)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionHistory;
