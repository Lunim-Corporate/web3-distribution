'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface RightsHolder {
  id: string;
  full_name: string;
  role: string;
  wallet_address: string;
  percentage: number;
}

export function EditRightsHolderModal({
  isOpen,
  holder,
  onClose,
  onSuccess,
  allHolders = [],
}: {
  isOpen: boolean;
  holder: RightsHolder | null;
  onClose: () => void;
  onSuccess: () => void;
  allHolders?: RightsHolder[];
}) {
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [percentage, setPercentage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Calculate total allocation warning
  const currentTotal = allHolders.reduce((sum, h) => sum + Number(h.percentage), 0);
  const otherTotal = holder
    ? allHolders
        .filter(h => h.id !== holder.id)
        .reduce((sum, h) => sum + Number(h.percentage), 0)
    : currentTotal;
  const pctNum = Number(percentage) || 0;
  const projectedTotal = holder ? otherTotal + pctNum : currentTotal;
  const pctDiff = projectedTotal - 100;
  const isOver100 = pctDiff > 0.01;
  const isUnder100 = pctDiff < -0.01;
  const showWarning = percentage !== '' && (isOver100 || isUnder100);

  useEffect(() => {
    if (holder) {
      setFullName(holder.full_name || '');
      setRole(holder.role || '');
      setWalletAddress(holder.wallet_address || '');
      setPercentage(String(holder.percentage || ''));
      setError('');
      setConfirmDelete(false);
    }
  }, [holder]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!holder) return;
    if (!fullName || !walletAddress || !percentage) {
      setError('Full name, wallet address, and percentage are required');
      return;
    }

    const pctNum = Number(percentage);
    if (isNaN(pctNum) || pctNum < 0 || pctNum > 100) {
      setError('Percentage must be between 0 and 100');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/rights/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: holder.id,
          action: 'update',
          full_name: fullName,
          role: role || 'Contributor',
          wallet_address: walletAddress,
          percentage: pctNum,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update rights holder');
      }

      toast.success('Rights holder updated successfully');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!holder) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      const res = await fetch('/api/rights/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: holder.id,
          action: 'delete',
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete rights holder');
      }

      toast.success('Rights holder removed');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && holder && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
        >
          <div className="p-6 border-b border-gray-800 flex justify-between items-center">
            <h2 className="text-lg font-black text-white">Edit Rights Holder</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-xl">
                {error}
              </div>
            )}

            {showWarning && (
              <div className={`p-3 border rounded-xl text-sm ${isOver100 ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                <div className="font-bold mb-1">
                  {isOver100
                    ? `⚠️ Total would be ${projectedTotal.toFixed(2)}% (exceeds 100% by ${Math.abs(pctDiff).toFixed(2)}%)`
                    : `⚠️ Total would be ${projectedTotal.toFixed(2)}% (${Math.abs(pctDiff).toFixed(2)}% short of 100%)`}
                </div>
                <p className="text-xs opacity-80">
                  Adjust other holders or add more to keep the project allocation at exactly 100%.
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Full Name *</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="e.g. Jane Doe"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Role / Contribution</label>
              <input
                type="text"
                value={role}
                onChange={e => setRole(e.target.value)}
                placeholder="e.g. Lead Director"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Wallet Address *</label>
              <input
                type="text"
                value={walletAddress}
                onChange={e => setWalletAddress(e.target.value)}
                placeholder="0x..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Split Percentage *</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={percentage}
                  onChange={e => setPercentage(e.target.value)}
                  placeholder="20.0"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-white/5 text-gray-300 font-bold rounded-xl hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            {/* Delete section */}
            <div className="pt-4 border-t border-white/5">
              {confirmDelete ? (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-rose-400 font-bold flex-1">Are you sure? This cannot be undone.</span>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-4 py-2 bg-white/5 text-gray-300 text-xs font-bold rounded-xl hover:bg-white/10 transition-colors"
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold rounded-xl hover:bg-rose-500/30 transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="text-xs font-bold text-rose-400/70 hover:text-rose-400 transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Remove Holder
                </button>
              )}
            </div>
          </form>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
}
