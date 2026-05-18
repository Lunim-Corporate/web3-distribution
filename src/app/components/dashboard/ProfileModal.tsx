'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { useWallet } from '@/lib/wallet';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatWalletAddress = (address: string) => `${address.slice(0, 8)}...${address.slice(-6)}`;

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const {
    user,
    logout,
    settings,
    setNotifyResurfacingHours,
  } = useAuth();
  const { account, isConnected, disconnectWallet } = useWallet();
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [notifyHours, setNotifyHours] = useState(String(settings?.notifyResurfacingHours ?? 24));
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  useEffect(() => {
    setNotifyHours(String(settings?.notifyResurfacingHours ?? 24));
  }, [settings, isOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncMode = () => setIsDemoMode(localStorage.getItem('demo_mode') === 'true');
    syncMode();
    window.addEventListener('demo-mode-changed', syncMode);

    if (!isOpen) return () => window.removeEventListener('demo-mode-changed', syncMode);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('demo-mode-changed', syncMode);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!user) return null;

  const connectedAddress = account || user.wallet_address || null;
  const walletStatusLabel = isConnected ? 'Connected' : 'Not Connected';
  const walletModeLabel = isDemoMode ? 'Demo Mode' : 'Live Mode';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#06070b]/85 backdrop-blur-xl"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 24 }}
            transition={{ type: 'spring', damping: 26, stiffness: 240 }}
            className="relative z-10 w-full max-w-5xl max-h-[88vh] overflow-y-auto rounded-[2rem] border border-white/10 bg-[#171c29] shadow-[0_30px_120px_rgba(0,0,0,0.55)]"
          >
            <div className="sticky top-0 z-20 border-b border-white/8 bg-[#171c29]/95 px-6 py-5 backdrop-blur sm:px-8">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5b6cff] via-[#4d7cff] to-[#4fc3ff] text-2xl font-black text-white shadow-lg">
                      {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <span className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-[#171c29] ${isConnected ? 'bg-emerald-400' : 'bg-gray-500'}`} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-white">{user.name || 'Your Profile'}</h2>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-400">
                      <span>{user.email}</span>
                      <span className="text-gray-600">•</span>
                      <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-black uppercase tracking-widest text-emerald-300">
                        {user.role || 'user'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-gray-300 transition-all hover:bg-white/10 hover:text-white"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="space-y-8 px-6 py-6 sm:px-8 sm:py-8">
              <section className="rounded-[1.75rem] border border-white/8 bg-white/[0.04] p-6 sm:p-8">
                <h3 className="mb-8 text-2xl font-black text-white">Your details</h3>
                <div className="grid gap-6 md:grid-cols-[180px,1fr] md:items-center">
                  <div className="text-gray-400">Name</div>
                  <div className="text-right text-2xl font-black text-white md:text-left">{user.name || '-'}</div>

                  <div className="text-gray-400">Email</div>
                  <div className="text-right text-2xl font-black text-white md:text-left">{user.email}</div>

                  <div className="text-gray-400">Role</div>
                  <div className="text-right md:text-left">
                    <span className="inline-flex rounded-full bg-emerald-500/20 px-4 py-1.5 text-lg font-black lowercase text-emerald-300">
                      {user.role || 'user'}
                    </span>
                  </div>
                </div>
              </section>

              <section className="rounded-[1.75rem] border border-white/8 bg-white/[0.04] p-6 sm:p-8">
                <h3 className="mb-8 text-2xl font-black text-white">Notification settings</h3>
                <div className="grid gap-6 md:grid-cols-[1fr,180px] md:items-start">
                  <div>
                    <p className="text-xl text-gray-300">Notify resurfacing every</p>
                    <p className="mt-1 text-3xl font-black text-white">{notifyHours || '24'} hours</p>
                    <button
                      onClick={() => {
                        setIsSavingSettings(true);
                        setNotifyResurfacingHours(Math.max(1, Number(notifyHours) || 24));
                        window.setTimeout(() => setIsSavingSettings(false), 250);
                      }}
                      className="mt-8 rounded-2xl bg-gradient-to-r from-[#6a4cff] to-[#7d55ff] px-6 py-3 text-lg font-black text-white shadow-lg shadow-violet-500/20 transition-all hover:brightness-110"
                    >
                      {isSavingSettings ? 'Saving...' : 'Save settings'}
                    </button>
                  </div>

                  <div>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={notifyHours}
                      onChange={(event) => setNotifyHours(event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-[#212838] px-5 py-4 text-3xl font-black text-white outline-none transition-all focus:border-violet-400"
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-[1.75rem] border border-white/8 bg-white/[0.04] p-6 sm:p-8">
                <h3 className="mb-4 text-2xl font-black text-white">Wallet Connection</h3>
                <p className="mb-8 text-lg text-gray-400">
                  {isDemoMode
                    ? 'Demo mode: connect to the local Hardhat wallets from the top navigation.'
                    : 'Live mode: connect your Web3 wallet from the top navigation.'}
                </p>

                <div className="grid gap-5 border-b border-white/8 pb-8 md:grid-cols-[180px,1fr] md:items-center">
                  <div className="text-gray-400">Status</div>
                  <div className="text-right text-3xl font-black text-white md:text-left">{walletStatusLabel}</div>

                  <div className="text-gray-400">Mode</div>
                  <div className="text-right text-xl font-black text-violet-300 md:text-left">{walletModeLabel}</div>

                  <div className="text-gray-400">Wallet</div>
                  <div className="text-right md:text-left">
                    {connectedAddress ? (
                      <span className="font-mono text-xl font-black text-white">{formatWalletAddress(connectedAddress)}</span>
                    ) : (
                      <span className="text-xl font-black text-gray-500">Not Connected</span>
                    )}
                  </div>
                </div>

                <div className="pt-6">
                  {connectedAddress ? (
                    <button
                      onClick={async () => {
                        setIsDisconnecting(true);
                        try {
                          await disconnectWallet();
                          onClose();
                        } finally {
                          setIsDisconnecting(false);
                        }
                      }}
                      className="w-full rounded-2xl border border-rose-500/20 bg-rose-500/10 px-6 py-4 text-xl font-black text-rose-300 transition-all hover:bg-rose-500/15"
                    >
                      {isDisconnecting ? 'Disconnecting wallet...' : 'Disconnect wallet'}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        void logout();
                        onClose();
                      }}
                      className="w-full rounded-2xl border border-rose-500/15 bg-rose-500/8 px-6 py-4 text-xl font-black text-rose-300 transition-all hover:bg-rose-500/12"
                    >
                      Log Out of Platform
                    </button>
                  )}
                </div>
              </section>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
