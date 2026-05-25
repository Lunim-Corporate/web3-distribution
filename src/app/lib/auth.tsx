'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
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
  role?: Role;
  settings?: Settings;
  wallet_address?: string | null;
  wallet_connected?: boolean;
  wallet_connected_at?: string | null;
};

type AuthContextType = {
  user: User | null;
  isAuthHydrated: boolean;
  login: (email?: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (name: string, email: string, role: Role, password: string) => Promise<void>;
  settings: Settings | null;
  setNotifyResurfacingHours: (hours: number) => void;
  listUsers: () => Promise<User[]>;
  setUserRole: (userId: string, role: Role) => Promise<void>;
  inviteUser: (email: string, name: string, role: Role) => Promise<void>;
  connectUserWallet: (walletAddress: string, walletType?: 'metamask' | 'local') => Promise<void>;
  disconnectUserWallet: () => Promise<void>;
  pending2FA: any;
  verify2FA: (code: string) => Promise<void>;
  cancel2FA: () => void;
  exportWallet: () => Promise<void>;
  linkWallet: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_SETTINGS: Settings = { notifyResurfacingHours: 24 };
const SETTINGS_LS_KEY = 'crt_settings';

/**
 * Fetches the public user profile from the `users` table.
 * Returns a merged User object.
 */
async function fetchPublicProfile(authUserId: string, authUser: { email?: string; user_metadata?: Record<string, unknown> }): Promise<User> {
  const { data: dbUser } = await supabase
    .from('users_profile')
    .select('id, role, display_name')
    .eq('id', authUserId)
    .maybeSingle();

  const meta = (authUser?.user_metadata ?? {}) as Record<string, unknown>;
  const rawRole = (dbUser?.role as string | undefined) ?? (meta.role as string | undefined) ?? 'RIGHTS_HOLDER';
  const role = rawRole.toLowerCase() as Role;

  return {
    id: authUserId,
    email: authUser.email || '',
    name: dbUser?.display_name || (meta.name as string) || '',
    isAdmin: role === 'admin',
    role,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isAuthHydrated, setIsAuthHydrated] = useState(false);
  const [pending2FA, setPending2FA] = useState<{ email: string; sessionId: string; password?: string } | null>(null);

  const effectiveSettings = useMemo<Settings>(() => {
    return settings ?? DEFAULT_SETTINGS;
  }, [settings]);

  function setCookie(u: User) {
    try {
      document.cookie = `crt_user=${encodeURIComponent(JSON.stringify(u))}; path=/; SameSite=Lax; max-age=86400`;
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
    async function syncPrivyUser() {
      if (!privyReady) return;
      
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
  }, [privyUser, privyReady, getAccessToken]);

  async function login(email?: string, password?: string) {
    privyLogin();
  }

  async function logout() {
    await privyLogout();
    await supabase.auth.signOut(); // Clean up any lingering supabase session
    clearCookie();
    setUser(null);
    setIsAuthHydrated(true);
  }

  async function signup(name: string, email: string, role: Role, password: string) {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, role, password }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Signup failed');
    setPending2FA({ email, sessionId: Math.random().toString(36).substr(2, 9), password });
  }

  function setNotifyResurfacingHours(hours: number) {
    setSettings((prev) => {
      const next = { ...(prev ?? DEFAULT_SETTINGS), notifyResurfacingHours: hours };
      localStorage.setItem(SETTINGS_LS_KEY, JSON.stringify(next));
      return next;
    });
  }

  async function listUsers(): Promise<User[]> {
    const res = await fetch('/api/users');
    if (!res.ok) throw new Error('Failed to fetch users');
    const data = await res.json();
    return (data || []).map((u: any) => ({
      id: u.id,
      email: '', // Email not in public profile
      name: u.display_name,
      role: u.role?.toLowerCase() as Role,
      isAdmin: u.role?.toUpperCase() === 'ADMIN',
    }));
  }

  async function setUserRole(userId: string, role: Role) {
    const res = await fetch('/api/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role })
    });
    if (!res.ok) throw new Error('Failed to update role');
  }

  async function inviteUser(email: string, name: string, role: Role) {
    const response = await fetch('/api/auth/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, role }),
    });
    if (!response.ok) throw new Error((await response.json()).error || 'Invite failed');
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

  async function verify2FA(code: string) {
    throw new Error('MFA is handled by Privy securely.');
  }

  function cancel2FA() {}

  const value: AuthContextType = {
    user,
    isAuthHydrated,
    login,
    logout,
    signup,
    settings: effectiveSettings,
    setNotifyResurfacingHours,
    listUsers,
    setUserRole,
    inviteUser,
    connectUserWallet,
    disconnectUserWallet,
    pending2FA: null,
    verify2FA,
    cancel2FA,
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