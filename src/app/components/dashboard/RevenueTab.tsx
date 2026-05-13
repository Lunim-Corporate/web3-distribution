'use client';
import React, { useState } from 'react';

const formatUSD = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(amount || 0));

export const RevenueTab = ({ transactions, totalRevenue, totalPaid, projectsList }) => {
  const [expandedTx, setExpandedTx] = useState(null);

  const totalDistributed = transactions.reduce((sum, tx) => sum + Number(tx.total_amount || 0), 0);

  const getProjectName = (id) => {
    const p = projectsList?.find(proj => proj.id === id);
    return p ? p.name : 'Unknown';
  };

  return (
    <div className="space-y-6">
      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Revenue</p>
          <p className="text-3xl font-black text-white tracking-tight">{formatUSD(totalRevenue || totalDistributed)}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Paid</p>
          <p className="text-3xl font-black text-white tracking-tight">{formatUSD(totalPaid || 0)}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Transactions</p>
          <p className="text-3xl font-black text-white tracking-tight">{transactions.length}</p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Project</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Source</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Amount</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 text-sm">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <React.Fragment key={tx.id}>
                    <tr 
                      onClick={() => setExpandedTx(expandedTx === tx.id ? null : tx.id)}
                      className="border-b border-white/5 hover:bg-white/[0.03] transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">
                          {new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-white">
                          {getProjectName(tx.project_id)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-400">
                          {tx.source || 'Client Payment'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-white font-mono">
                          {formatUSD(tx.total_amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full text-[10px] font-black tracking-wide capitalize bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                          {tx.status || 'completed'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-gray-500 hover:text-white transition-colors">
                          <svg className={`w-4 h-4 transform transition-transform ${expandedTx === tx.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                    {/* Dropdown content */}
                    {expandedTx === tx.id && (
                      <tr className="bg-black/20">
                        <td colSpan={6} className="px-6 py-6 border-b border-white/5">
                          <div className="mb-3 flex items-center justify-between">
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Revenue Split Distribution</h4>
                            <span className="text-xs text-gray-500 font-mono">Tx: {tx.tx_hash || '—'}</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {tx.transaction_splits?.map((split) => (
                              <div key={split.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/[0.08] transition-all group/card">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-sm font-bold text-indigo-400 border border-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                                    {split.name?.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="font-bold text-white text-sm">{split.name}</div>
                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">{split.role}</div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-black text-white">{split.percentage}%</div>
                                  <div className="text-[10px] font-mono text-emerald-400 font-bold">
                                    {formatUSD(split.amount_eth)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
