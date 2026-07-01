'use client';

import React, { useEffect, useState } from 'react';
import { formatPercentage, calculatePaymentSplit } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { toast } from 'react-hot-toast';
import { dedupeJsonFetch } from '@/app/lib/requestCache';

const formatUSD = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

export const PaymentSplitter: React.FC = () => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [revenueSource, setRevenueSource] = useState('');
  const [calculatedSplits, setCalculatedSplits] = useState<
    Array<{
      contributorId: string;
      contributorName: string;
      percentage: number;
      amount: number;
      status: 'Pending';
    }>
  >([]);
  const [projectOptions, setProjectOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [recentPayments, setRecentPayments] = useState<
    Array<{ id: string; projectName: string; amount: number; date: string; source: string; status: string }>
  >([]);

  const fetchPaymentData = React.useCallback(async () => {
    try {
      const [projectsRes, revenueRes] = await Promise.all([
        fetch('/api/projects').then((r) => r.json()),
        dedupeJsonFetch('revenue:splitter', '/api/revenue'),
      ]);

      const projects = Array.isArray(projectsRes) ? projectsRes : [];
      setProjectOptions(
        projects.map((p) => {
          const row = p as Record<string, unknown>;
          return {
            value: String(row.id ?? ''),
            label: String(row.name ?? 'Project'),
          };
        })
      );

      const revenue = Array.isArray(revenueRes) ? revenueRes : [];
      setRecentPayments(revenue);
    } catch (e) {
      console.error('Error fetching splitter data:', e);
      setProjectOptions([]);
      setRecentPayments([]);
    }
  }, []);

  useEffect(() => {
    fetchPaymentData();
    window.addEventListener('payment-recorded', fetchPaymentData);
    return () => window.removeEventListener('payment-recorded', fetchPaymentData);
  }, [fetchPaymentData]);

  const revenueSourceOptions = [
    { value: 'streaming', label: 'Streaming Royalties' },
    { value: 'licensing', label: 'Licensing Deal' },
    { value: 'sales', label: 'Sales Revenue' },
    { value: 'performance', label: 'Performance Rights' },
    { value: 'sync', label: 'Sync Licensing' },
    { value: 'other', label: 'Other' },
  ];

  const handleCalculateSplits = async () => {
    if (!selectedProject || !paymentAmount) return;
    const cleanAmountStr = paymentAmount.replace(/,/g, '');
    const amount = parseFloat(cleanAmountStr);
    if (!Number.isFinite(amount)) return;

    try {
      const res = await fetch(`/api/projects/${selectedProject}`, { cache: 'no-store' });
      const json = await res.json();
      const project = json?.data;
      const contributorsRaw = project?.project_contributors ?? [];

      const contributors = contributorsRaw.map((pc: unknown) => {
        const pcRow = pc as Record<string, unknown>;
        const usersRow = (pcRow['users'] as Record<string, unknown> | undefined) ?? {};
        return {
          id: String(pcRow.id ?? pcRow.user_id ?? ''),
          name: String(
            (usersRow && typeof usersRow.name === 'string' ? usersRow.name : undefined) ??
              (usersRow && typeof usersRow.email === 'string' ? usersRow.email : undefined) ??
              'Unknown'
          ),
          revenueShare: Number(pcRow.revenue_share ?? 0),
        };
      });

      setCalculatedSplits(calculatePaymentSplit(amount, contributors));
    } catch {
      toast.error('Failed to load contributors for the selected project');
      setCalculatedSplits([]);
    }
  };

  const handleProcessPayment = async () => {
    if (user?.role !== 'admin') {
      toast.error('Admin only: You do not have permission to process payments.');
      return;
    }

    try {
      const cleanAmountStr = paymentAmount.replace(/,/g, '');
      const amountUSD = parseFloat(cleanAmountStr);
      if (!Number.isFinite(amountUSD) || !selectedProject) return;

      toast.loading('Processing payment...');

      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: selectedProject,
          amount_cents: Math.round(amountUSD * 100),
          source: revenueSource || 'Manual',
          tx_hash: null,
        }),
      });

      if (!res.ok) throw new Error('Payment processing failed');

      toast.dismiss();
      toast.success(`Payment of ${formatUSD(amountUSD)} recorded and split among ${calculatedSplits.length} contributors!`);

      setIsModalOpen(false);
      setSelectedProject('');
      setPaymentAmount('');
      setRevenueSource('');
      setCalculatedSplits([]);

      const revenueJson = await dedupeJsonFetch('revenue:splitter:after', '/api/revenue');
      setRecentPayments(Array.isArray(revenueJson) ? revenueJson : []);
      
      window.dispatchEvent(new CustomEvent('payment-recorded', { detail: { projectId: selectedProject, amount: amountUSD } }));
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to process payment splits. Please try again.');
      console.error('Payment processing error:', error);
    }
  };

  return (
    <>
      <div id="payment-splitter" className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl overflow-hidden relative">
        {/* Ambient glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />

        {/* Header */}
        <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-400">
              Payment Splitter
            </h2>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">Split payments based on revenue sharing agreements</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setIsModalOpen(true);
                toast.success('Opening payment split calculator...');
              }}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/20"
            >
              ✨ New Payment Split
            </button>
            <button
              onClick={() => {
                if (projectOptions.length > 0) {
                  setSelectedProject(projectOptions[0].value);
                  setPaymentAmount('1000');
                  setRevenueSource('streaming');
                  setIsModalOpen(true);
                } else {
                  toast.error('No projects available');
                }
              }}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all"
            >
              ⚡ Quick Split
            </button>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="p-6 relative z-10">
          <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Recent Payment Splits</h4>
          {recentPayments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-3xl mb-2">💳</div>
              <p className="text-sm font-medium">No payments recorded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPayments.slice(0, 5).map((revenue) => (
                <div
                  key={revenue.id}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/[0.07] transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-gray-200 group-hover:text-white transition-colors text-sm">
                        {revenue.projectName}
                      </h5>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {revenue.source} • {new Date(revenue.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white text-sm font-mono">
                        {formatUSD(revenue.amount)}
                      </p>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        revenue.status === 'Paid'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-amber-500/15 text-amber-400'
                      }`}>
                        {revenue.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
          <div className="bg-[#0d1117] rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl shadow-black/50">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-black text-white">Calculate Payment Split</h2>
                <p className="text-xs text-gray-500 mt-0.5">Split revenue automatically across contributors</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center text-lg"
              >
                ×
              </button>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Project</label>
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="" className="bg-gray-900">Choose a project</option>
                    {projectOptions.map(option => (
                      <option key={option.value} value={option.value} className="bg-gray-900">{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Revenue Source</label>
                  <select
                    value={revenueSource}
                    onChange={(e) => setRevenueSource(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="" className="bg-gray-900">Choose source</option>
                    {revenueSourceOptions.map(option => (
                      <option key={option.value} value={option.value} className="bg-gray-900">{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Payment Amount (USD)</label>
                <input
                  type="text"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount in USD"
                  className="w-full bg-white/5 border border-white/10 text-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none placeholder-gray-600"
                />
              </div>

              <button
                onClick={handleCalculateSplits}
                disabled={!selectedProject || !paymentAmount}
                className={`w-full py-3 rounded-lg text-sm font-bold transition-all ${
                  !selectedProject || !paymentAmount
                    ? 'bg-white/5 text-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/20'
                }`}
              >
                Calculate Splits
              </button>

              {calculatedSplits.length > 0 && (
                <div className="space-y-4">
                  <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
                    <h4 className="font-bold text-emerald-400 text-sm mb-1">💰 Automatic Distribution Preview</h4>
                    <p className="text-[11px] text-emerald-400/60">
                      This transaction will be split among {calculatedSplits.length} rights holders
                    </p>
                  </div>

                  <div className="bg-white/5 rounded-xl p-5 border border-white/10 space-y-3">
                    {calculatedSplits.map((split, index) => {
                      const colors = ['from-emerald-500 to-teal-500', 'from-blue-500 to-indigo-500', 'from-purple-500 to-fuchsia-500', 'from-pink-500 to-rose-500', 'from-amber-500 to-orange-500'];
                      const bgColor = colors[index % colors.length];
                      return (
                        <div key={index} className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 bg-gradient-to-br ${bgColor} rounded-lg flex items-center justify-center text-white text-[10px] font-black`}>
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-bold text-gray-200 text-sm">{split.contributorName}</p>
                                <p className="text-[10px] text-gray-500">{formatPercentage(split.percentage)} share</p>
                              </div>
                            </div>
                            <p className="font-bold text-lg text-white font-mono">{formatUSD(split.amount)}</p>
                          </div>
                          <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full bg-gradient-to-r ${bgColor} rounded-full transition-all duration-500`}
                              style={{ width: `${split.percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}

                    <div className="mt-4 pt-4 border-t border-white/10 bg-emerald-500/5 rounded-lg p-3">
                      <div className="flex items-center justify-between font-bold text-lg mb-1">
                        <span className="text-gray-300">Total:</span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 font-mono text-xl">
                          {formatUSD(parseFloat(paymentAmount.replace(/,/g, '')))}
                        </span>
                      </div>
                      <p className="text-[10px] text-emerald-400/60 flex items-center gap-1">
                        <span>✓</span> Each contributor will see earnings updated instantly
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                      Cancel
                    </button>
                    <button
                      onClick={handleProcessPayment}
                      disabled={user?.role !== 'admin'}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                        user?.role !== 'admin'
                          ? 'bg-white/5 text-gray-600 cursor-not-allowed'
                          : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-500/20'
                      }`}
                    >
                      {user?.role !== 'admin' ? '🔒 Admin Only' : '✅ Process Payment'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
