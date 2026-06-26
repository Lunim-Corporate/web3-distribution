'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { usePrivy } from '@privy-io/react-auth';
import { isDemoAccessEnabled, readDemoMode } from '@/lib/demoAccess';

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
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isAuthHydrated, setIsAuthHydrated] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const effectiveSettings = useMemo<Settings>(() => {
    return settings ?? DEFAULT_SETTINGS;
  }, [settings]);

  function setCookie(u: User) {
    try {
      // Strip isAdmin from cookie — server verifies role from DB, never trust client
      const safeUser = { ...u, isAdmin: undefined };
      document.cookie = `crt_user=${encodeURIComponent(JSON.stringify(safeUser))}; path=/; SameSite=Lax; max-age=86400`;
    } catch { /* ignore */ }
  }

  function clearCookie() {
    try {
      document.cookie = 'crt_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    } catch { /* ignore */ }
  }

  const { user: privyUser, ready: privyReady, login: privyLogin, logout: privyLogout, getAccessToken, exportWallet: privyExportWallet, linkWallet: privyLinkWallet } = usePrivy();

  useEffect(() => {
    // Load settings from localStorage
    const raw = localStorage.getItem(SETTINGS_LS_KEY);
    if (raw) {
      try { setSettings(JSON.parse(raw) as Settings); } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    setIsDemoMode(readDemoMode());
    if (!isDemoAccessEnabled) {
      localStorage.removeItem('demo_mode');
      localStorage.removeItem('active_demo_wallet');
    }
    const handler = (e: CustomEvent) => setIsDemoMode(isDemoAccessEnabled && e.detail);
    const storageHandler = () => setIsDemoMode(readDemoMode());
    window.addEventListener('demo-mode-changed', handler as EventListener);
    window.addEventListener('storage', storageHandler);
    return () => {
      window.removeEventListener('demo-mode-changed', handler as EventListener);
      window.removeEventListener('storage', storageHandler);
    };
  }, []);

  useEffect(() => {
    async function syncPrivyUser() {
      if (!privyReady) return;

      if (!privyUser && isDemoAccessEnabled && isDemoMode) {
        const demoUser: User = {
          id: 'demo-admin-id',
          email: 'demo@lunim.io',
          name: 'Demo Admin',
          isAdmin: true,
          role: 'admin',
          isDemo: true,
        };
        setUser(demoUser);
        setCookie(demoUser);
        setIsAuthHydrated(true);
        return;
      }

      
      if (!privyUser) {
        clearCookie();
        setUser(null);
        setIsAuthHydrated(true);
        return;
      }

      try {
        const token = await getAccessToken();
        const res = await fetch('/api/auth/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ privyUser })
        });
        
        if (!res.ok) throw new Error('Sync failed');
        
        const { user: supabaseProfile } = await res.json();
        
        const profile: User = {
          id: supabaseProfile.id,
          email: privyUser.email?.address || '',
          name: supabaseProfile.display_name || privyUser.email?.address?.split('@')[0] || '',
          isAdmin: supabaseProfile.role === 'ADMIN',
          role: supabaseProfile.role?.toLowerCase() as Role || 'creator',
        };

        setUser(profile);
        setCookie(profile);
        setIsAuthHydrated(true);
      } catch (err) {
        console.error('[AUTH] Privy Sync failed:', err);
        // Fallback user state
        const profile: User = {
          id: privyUser.id.replace('did:privy:', ''), // fallback ID
          email: privyUser.email?.address || '',
          role: 'creator',
        };
        setUser(profile);
        setIsAuthHydrated(true);
      }
    }
    
    syncPrivyUser();
  }, [privyUser, privyReady, getAccessToken, isDemoMode]);

  async function login() {
    privyLogin();
  }

  async function logout() {
    await privyLogout();
    await supabase.auth.signOut(); // Clean up any lingering supabase session
    clearCookie();
    setUser(null);
    setIsAuthHydrated(true);
  }



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
    // Update users_profile table with wallet info
    const { error } = await supabase
      .from('users_profile')
      .update({
        wallet_address: walletAddress,
        wallet_type: walletType,
        updated_at: now,
      })
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
      try {
        await privyExportWallet();
      } catch (err: any) {
        console.error('Wallet export failed:', err);
        throw new Error(err.message || 'Private key export is only supported for embedded accounts.');
      }
    },
    linkWallet: async () => {
      privyLinkWallet();
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
