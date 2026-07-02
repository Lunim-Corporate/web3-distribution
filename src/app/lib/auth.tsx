'use client';

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { isSandboxLoginEnabled, readDemoMode } from '@/lib/demoAccess';

export type Role = 'admin' | 'creator' | 'contributor' | 'viewer';

type Settings = {
  notifyResurfacingHours?: number;
};

export type User = {
  id: string;
  email: string;
  name?: string;
  isAdmin?: boolean;
  isDemo?: boolean;
  role?: Role;
  settings?: Settings;
  wallet_address?: string | null;
  wallet_connected?: boolean;
  wallet_connected_at?: string | null;
};

type PrivyApi = {
  ready: boolean;
  user: any;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  exportWallet: () => Promise<void>;
  linkWallet: () => Promise<void>;
};

type AuthContextType = {
  user: User | null;
  isAuthHydrated: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  settings: Settings | null;
  setNotifyResurfacingHours: (_hours: number) => void;
  connectUserWallet: (_walletAddress: string, _walletType?: 'metamask' | 'local') => Promise<void>;
  disconnectUserWallet: () => Promise<void>;
  exportWallet: () => Promise<void>;
  linkWallet: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_SETTINGS: Settings = { notifyResurfacingHours: 24 };
const SETTINGS_LS_KEY = 'crt_settings';

function setCookie(u: User) {
  try {
    const safeUser = { ...u, isAdmin: undefined };
    document.cookie = `crt_user=${encodeURIComponent(JSON.stringify(safeUser))}; path=/; SameSite=Lax; max-age=86400`;
  } catch { /* ignore */ }
}

function clearCookie() {
  try {
    document.cookie = 'crt_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
  } catch { /* ignore */ }
}

function useSafePrivy(): PrivyApi {
  let ready = false;
  let user: any = null;
  let login = async () => { throw new Error('Authentication is not configured. Use Demo mode to explore the platform.'); };
  let logout = async () => {};
  let getAccessToken = async (): Promise<string | null> => null;
  let exportWallet = async () => { throw new Error('Wallet features are not available.'); };
  let linkWallet = async () => { throw new Error('Wallet linking is not available.'); };

  try {
    const privy = require('@privy-io/react-auth');
    const result = privy.usePrivy();
    if (result && typeof result === 'object' && 'ready' in result) {
      ready = result.ready;
      user = result.user;
      login = result.login;
      logout = result.logout;
      getAccessToken = result.getAccessToken;
      exportWallet = result.exportWallet;
      linkWallet = result.linkWallet;
    }
  } catch { /* PrivyProvider not available - use fallbacks */ }

  return { ready, user, login, logout, getAccessToken, exportWallet, linkWallet };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isAuthHydrated, setIsAuthHydrated] = useState(false);
  const [isDemo, setIsDemo] = useState(() => {
    if (typeof window === 'undefined') return false;
    return readDemoMode();
  });

  const privy = useSafePrivy();
  const hydrationDone = React.useRef(false);

  const effectiveSettings = useMemo<Settings>(() => {
    return settings ?? DEFAULT_SETTINGS;
  }, [settings]);

  useEffect(() => {
    const raw = localStorage.getItem(SETTINGS_LS_KEY);
    if (raw) {
      try { setSettings(JSON.parse(raw) as Settings); } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsDemo(readDemoMode());
    const storageHandler = () => setIsDemo(readDemoMode());
    window.addEventListener('demo-mode-changed', handler as EventListener);
    window.addEventListener('storage', storageHandler);
    return () => {
      window.removeEventListener('demo-mode-changed', handler as EventListener);
      window.removeEventListener('storage', storageHandler);
    };
  }, []);

  useEffect(() => {
    if (hydrationDone.current) return;

    const { ready, user: pUser, getAccessToken } = privy;

    if (!ready && !isDemo) return;

    hydrationDone.current = true;

    if (isSandboxLoginEnabled && isDemo) {
      setUser({
        id: 'demo-admin-id',
        email: 'demo@lunim.io',
        name: 'Demo Admin',
        isAdmin: true,
        role: 'admin',
        isDemo: true,
      });
      setIsAuthHydrated(true);
      return;
    }

    if (!pUser) {
      clearCookie();
      setUser(null);
      setIsAuthHydrated(true);
      return;
    }

    const doSync = async () => {
      try {
        const token = await getAccessToken();
        const res = await fetch('/api/auth/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ privyUser: pUser }),
        });

        if (!res.ok) throw new Error('Sync failed');

        const { user: supabaseProfile } = await res.json();

        const profile: User = {
          id: supabaseProfile.id,
          email: pUser.email?.address || '',
          name: supabaseProfile.display_name || pUser.email?.address?.split('@')[0] || '',
          isAdmin: supabaseProfile.role === 'ADMIN',
          role: supabaseProfile.role?.toLowerCase() as Role || 'creator',
          wallet_address: supabaseProfile.wallet_address || null,
        };

        setUser(profile);
        setCookie(profile);
        setIsAuthHydrated(true);
      } catch (err) {
        console.error('[AUTH] Sync failed:', err);
        setUser({
          id: pUser.id.replace('did:privy:', ''),
          email: pUser.email?.address || '',
          role: 'creator',
        });
        setIsAuthHydrated(true);
      }
    };

    doSync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [privy.ready, privy.user, isDemo]);

  const login = useCallback(async () => {
    try {
      await privy.login();
    } catch (e: any) {
      if (e.message?.includes('not configured') || e.message?.includes('not available')) {
        window.location.href = '/login?mode=demo';
      }
      throw e;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [privy.login]);

  const logout = useCallback(async () => {
    localStorage.removeItem('demo_mode');
    localStorage.removeItem('active_demo_wallet');
    window.dispatchEvent(new CustomEvent('demo-mode-changed', { detail: false }));
    window.dispatchEvent(new CustomEvent('demo-wallet-changed', { detail: null }));

    try { await privy.logout(); } catch { /* ignore */ }
    try { await supabase.auth.signOut(); } catch { /* ignore */ }
    clearCookie();
    setUser(null);
    hydrationDone.current = false;
    setIsAuthHydrated(false);
    window.location.href = '/login';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [privy.logout]);

  function setNotifyResurfacingHours(hours: number) {
    setSettings((prev) => {
      const next = { ...(prev ?? DEFAULT_SETTINGS), notifyResurfacingHours: hours };
      localStorage.setItem(SETTINGS_LS_KEY, JSON.stringify(next));
      return next;
    });
  }

  async function connectUserWallet(walletAddress: string, walletType: 'metamask' | 'local' = 'local') {
    if (!user) return;
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('users_profile')
      .update({ wallet_address: walletAddress, wallet_type: walletType, updated_at: now })
      .eq('id', user.id);
    if (error) throw error;
    setUser((prev) => (prev ? { ...prev, wallet_address: walletAddress, wallet_connected: true, wallet_connected_at: now } : null));
  }

  async function disconnectUserWallet() {
    if (!user) return;
    const { error } = await supabase
      .from('users_profile')
      .update({ wallet_address: null, wallet_type: null, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    if (error) throw error;
    setUser((prev) => (prev ? { ...prev, wallet_address: null, wallet_connected: false, wallet_connected_at: null } : null));
  }

  const value: AuthContextType = {
    user,
    isAuthHydrated,
    login,
    logout,
    settings: effectiveSettings,
    setNotifyResurfacingHours,
    connectUserWallet,
    disconnectUserWallet,
    exportWallet: async () => {
      try { await privy.exportWallet(); }
      catch (err: any) { throw new Error(err.message || 'Private key export is only supported for embedded accounts.'); }
    },
    linkWallet: async () => {
      try { await privy.linkWallet(); } catch { /* ignore */ }
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
