'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'react-hot-toast';

interface MultiSigConfigProps {
  projectId: string | null;
  /** Callback when multi-sig status changes (so parent can show shield badge) */
  onStatusChange?: (enabled: boolean) => void;
}

interface MultiSigSettings {
  enabled: boolean;
  signers: string[];
  threshold: number;
}

const DEFAULT_SETTINGS: MultiSigSettings = {
  enabled: false,
  signers: [],
  threshold: 1,
};

const WALLET_REGEX = /^0x[a-fA-F0-9]{40}$/;

export const MultiSigConfig: React.FC<MultiSigConfigProps> = ({ projectId, onStatusChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<MultiSigSettings>(DEFAULT_SETTINGS);
  const [newSigner, setNewSigner] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Load existing multi-sig config from project settings
  useEffect(() => {
    if (!projectId) return;
    (async () => {
      const { data } = await supabase
        .from('projects')
        .select('settings')
        .eq('id', projectId)
        .single();
      if (data?.settings?.multisig) {
        const ms = data.settings.multisig as MultiSigSettings;
        setConfig({
          enabled: ms.enabled ?? false,
          signers: ms.signers ?? [],
          threshold: ms.threshold ?? 1,
        });
        onStatusChange?.(ms.enabled ?? false);
      }
    })();
  }, [projectId, onStatusChange]);

  const addSigner = () => {
    const addr = newSigner.trim();
    if (!WALLET_REGEX.test(addr)) {
      toast.error('Invalid Ethereum address (must be 0x + 40 hex chars)');
      return;
    }
    if (config.signers.map((s) => s.toLowerCase()).includes(addr.toLowerCase())) {
      toast.error('This address is already a signer');
      return;
    }
    setConfig((prev) => ({
      ...prev,
      signers: [...prev.signers, addr],
      // Auto-adjust threshold if needed
      threshold: Math.min(prev.threshold, prev.signers.length + 1),
    }));
    setNewSigner('');
  };

  const removeSigner = (index: number) => {
    setConfig((prev) => {
      const newSigners = prev.signers.filter((_, i) => i !== index);
      return {
        ...prev,
        signers: newSigners,
        threshold: Math.min(prev.threshold, Math.max(1, newSigners.length)),
      };
    });
  };

  const toggleEnabled = () => {
    setConfig((prev) => ({ ...prev, enabled: !prev.enabled }));
  };

  const saveConfig = async () => {
    if (!projectId) return;
    setIsSaving(true);
    try {
      // Fetch current settings to merge
      const { data: current } = await supabase
        .from('projects')
        .select('settings')
        .eq('id', projectId)
        .single();

      const existingSettings = current?.settings ?? {};
      const updatedSettings = {
        ...existingSettings,
        multisig: config,
      };

      const { error } = await supabase
        .from('projects')
        .update({ settings: updatedSettings })
        .eq('id', projectId);

      if (error) throw error;
      toast.success('Multi-sig configuration saved');
      onStatusChange?.(config.enabled);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save configuration');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const thresholdOptions = Array.from(
    { length: Math.max(1, config.signers.length) },
    (_, i) => i + 1,
  );

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
      {/* Collapsible header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-5 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">🛡️</span>
          <div className="text-left">
            <p className="text-sm font-bold text-white">Security Settings</p>
            <p className="text-[11px] text-gray-500">Multi-signature consensus for split changes</p>
          </div>
          {config.enabled && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              Active
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Collapsible body */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 space-y-6 border-t border-white/5 pt-4">
              {/* Info banner */}
              <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/20 flex items-start gap-3">
                <span className="text-indigo-400 text-sm mt-0.5">ℹ️</span>
                <p className="text-xs text-indigo-300/80 leading-relaxed">
                  Multi-sig consensus is configured for <strong>off-chain tracking</strong>. On-chain enforcement via Gnosis Safe integration coming in <strong>v3.0</strong>.
                </p>
              </div>

              {/* Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Require multi-sig for split changes</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">When enabled, roster updates require approval from multiple signers</p>
                </div>
                <button
                  onClick={toggleEnabled}
                  className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                    config.enabled ? 'bg-indigo-600' : 'bg-gray-700'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
                      config.enabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Signer management — only visible when enabled */}
              {config.enabled && (
                <>
                  {/* Add signer */}
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
                      Authorized Signers ({config.signers.length})
                    </label>
                    <div className="flex gap-2">
                      <input
                        value={newSigner}
                        onChange={(e) => setNewSigner(e.target.value)}
                        placeholder="0x... signer address"
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                      <button
                        onClick={addSigner}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Signer list */}
                  {config.signers.length > 0 && (
                    <div className="space-y-2">
                      {config.signers.map((signer, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-xs font-bold text-indigo-400">
                              {i + 1}
                            </div>
                            <code className="text-[11px] text-indigo-300 font-mono">
                              {signer.slice(0, 10)}…{signer.slice(-6)}
                            </code>
                          </div>
                          <button
                            onClick={() => removeSigner(i)}
                            className="text-gray-600 hover:text-rose-400 transition-colors text-xs font-bold"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Threshold selector */}
                  {config.signers.length > 0 && (
                    <div className="flex items-center gap-4">
                      <label className="text-sm text-gray-300 font-medium">Require</label>
                      <select
                        value={config.threshold}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, threshold: parseInt(e.target.value) }))
                        }
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {thresholdOptions.map((n) => (
                          <option key={n} value={n} className="bg-gray-900">
                            {n}
                          </option>
                        ))}
                      </select>
                      <span className="text-sm text-gray-300 font-medium">
                        of {config.signers.length} signer{config.signers.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </>
              )}

              {/* Save */}
              <button
                onClick={saveConfig}
                disabled={isSaving}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-30"
              >
                {isSaving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
