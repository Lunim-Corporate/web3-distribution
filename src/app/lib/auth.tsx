'use client';

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { isSandboxLoginEnabled, readDemoMode } from '@/lib/demoAccess';
import { usePrivy } from '@privy-io/react-auth';

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

// ----------------------------------------------------
// Privy Auth Provider (Used when app ID is present)
// ----------------------------------------------------
function PrivyAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isAuthHydrated, setIsAuthHydrated] = useState(false);
  const [isDemo, setIsDemo] = useState(() => {
    if (typeof window === 'undefined') return false;
    return readDemoMode();
  });

  const privy = usePrivy();
  const syncedUserIdRef = React.useRef<string | null>(null);

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

    const { ready, user: pUser, getAccessToken } = privy;

    if (!ready) return;

    if (!pUser) {
      clearCookie();
      setUser(null);
      syncedUserIdRef.current = null;
      setIsAuthHydrated(true);
      return;
    }

    if (syncedUserIdRef.current === pUser.id) {
      setIsAuthHydrated(true);
      return;
    }

    syncedUserIdRef.current = pUser.id;
    setIsAuthHydrated(false);

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
          wallet_connected: !!supabaseProfile.wallet_address,
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
    localStorage.setItem('demo_mode', 'false');
    localStorage.removeItem('active_demo_wallet');
    window.dispatchEvent(new CustomEvent('demo-mode-changed', { detail: false }));
    window.dispatchEvent(new CustomEvent('demo-wallet-changed', { detail: null }));

    try { await privy.logout(); } catch { /* ignore */ }
    try { await supabase.auth.signOut(); } catch { /* ignore */ }
    clearCookie();
    setUser(null);
    syncedUserIdRef.current = null;
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

// ----------------------------------------------------
// Demo Auth Provider (Used when app ID is missing)
// ----------------------------------------------------
function DemoAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isAuthHydrated, setIsAuthHydrated] = useState(false);

  const effectiveSettings = useMemo<Settings>(() => {
    return settings ?? DEFAULT_SETTINGS;
  }, [settings]);

  useEffect(() => {
    const raw = localStorage.getItem(SETTINGS_LS_KEY);
    if (raw) {
      try { setSettings(JSON.parse(raw) as Settings); } catch { /* ignore */ }
    }
  }, []);

  // Sync user state on mount
  useEffect(() => {
    const activeWallet = localStorage.getItem('active_demo_wallet');
    const demoUser: User = {
      id: 'demo-admin-id',
      email: 'demo@lunim.io',
      name: 'Demo Admin',
      isAdmin: true,
      role: 'admin',
      isDemo: true,
      wallet_address: activeWallet || null,
      wallet_connected: !!activeWallet,
    };

    const storedUser = localStorage.getItem('demo_user_logged_in');
    if (storedUser === 'true') {
      setUser(demoUser);
      setCookie(demoUser);
    } else {
      setUser(null);
      clearCookie();
    }
    setIsAuthHydrated(true);
  }, []);

  const login = useCallback(async () => {
    const demoUser: User = {
      id: 'demo-admin-id',
      email: 'demo@lunim.io',
      name: 'Demo Admin',
      isAdmin: true,
      role: 'admin',
      isDemo: true,
    };
    localStorage.setItem('demo_mode', 'true');
    localStorage.setItem('demo_user_logged_in', 'true');
    window.dispatchEvent(new CustomEvent('demo-mode-changed', { detail: true }));
    setUser(demoUser);
    setCookie(demoUser);
    setIsAuthHydrated(true);
  }, []);

  const logout = useCallback(async () => {
    localStorage.setItem('demo_mode', 'false');
    localStorage.removeItem('demo_user_logged_in');
    localStorage.removeItem('active_demo_wallet');
    window.dispatchEvent(new CustomEvent('demo-mode-changed', { detail: false }));
    window.dispatchEvent(new CustomEvent('demo-wallet-changed', { detail: null }));
    clearCookie();
    setUser(null);
    setIsAuthHydrated(true);
    window.location.href = '/login';
  }, []);

  function setNotifyResurfacingHours(hours: number) {
    setSettings((prev) => {
      const next = { ...(prev ?? DEFAULT_SETTINGS), notifyResurfacingHours: hours };
      localStorage.setItem(SETTINGS_LS_KEY, JSON.stringify(next));
      return next;
    });
  }

  async function connectUserWallet(walletAddress: string, _walletType: 'metamask' | 'local' = 'local') {
    localStorage.setItem('active_demo_wallet', walletAddress);
    setUser((prev) => (prev ? { ...prev, wallet_address: walletAddress, wallet_connected: true } : null));
    window.dispatchEvent(new CustomEvent('demo-wallet-changed', { detail: walletAddress }));
  }

  async function disconnectUserWallet() {
    localStorage.removeItem('active_demo_wallet');
    setUser((prev) => (prev ? { ...prev, wallet_address: null, wallet_connected: false } : null));
    window.dispatchEvent(new CustomEvent('demo-wallet-changed', { detail: null }));
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
      throw new Error('Private key export is not available in demo mode.');
    },
    linkWallet: async () => {
      throw new Error('Wallet linking is not available in demo mode.');
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ----------------------------------------------------
// Main Auth Provider router
// ----------------------------------------------------
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const hasAppId = typeof window !== 'undefined' && !!process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (hasAppId) {
    return <PrivyAuthProvider>{children}</PrivyAuthProvider>;
  } else {
    return <DemoAuthProvider>{children}</DemoAuthProvider>;
  }
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
