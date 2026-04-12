'use client';

import React, { createContext, useContext, useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

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
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (name: string, email: string, role: Role, password: string) => Promise<void>;
  settings: Settings | null;
  setNotifyResurfacingHours: (hours: number) => void;
  listUsers: () => Promise<User[]>;
  setUserRole: (userId: string, role: Role) => Promise<void>;
  inviteUser: (email: string, name: string, role: Role) => Promise<void>;
  connectUserWallet: (walletAddress: string) => Promise<void>;
  disconnectUserWallet: () => Promise<void>;
  pending2FA: { email: string; sessionId: string } | null;
  verify2FA: (code: string) => Promise<void>;
  cancel2FA: () => void;
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
    .from('users')
    .select('id, email, name, role, wallet_address, wallet_connected, wallet_connected_at')
    .eq('id', authUserId)
    .maybeSingle();

  const meta = (authUser?.user_metadata ?? {}) as Record<string, unknown>;
  const role = (dbUser?.role as Role | undefined) ?? (meta.role as Role | undefined) ?? 'creator';

  return {
    id: authUserId,
    email: dbUser?.email || authUser.email || '',
    name: dbUser?.name || (meta.name as string) || '',
    isAdmin: role === 'admin',
    role,
    wallet_address: dbUser?.wallet_address || null,
    wallet_connected: !!dbUser?.wallet_connected,
    wallet_connected_at: dbUser?.wallet_connected_at || null,
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

  useEffect(() => {
    // Load settings from localStorage
    const raw = localStorage.getItem(SETTINGS_LS_KEY);
    if (raw) {
      try { setSettings(JSON.parse(raw) as Settings); } catch { /* ignore */ }
    }

    // Subscribe to auth state changes
    // Supabase fires INITIAL_SESSION first, then SIGNED_IN on explicit login.
    // We handle any event that has a session to hydrate the user.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[AUTH] ${event}`, session?.user?.id ?? 'no-user');

      if (!session?.user) {
        // Signed out or no session
        clearCookie();
        setUser(null);
        setIsAuthHydrated(true);
        return;
      }

      // We have a session — hydrate the user profile
      fetchPublicProfile(session.user.id, session.user).then(profile => {
        setUser(profile);
        setCookie(profile);
        console.log('[AUTH] Profile loaded:', profile.email);
        setIsAuthHydrated(true);
      }).catch(err => {
        console.error('[AUTH] Profile fetch failed:', err);
        // Still set a minimal user from the session so the app doesn't hang
        setUser({
          id: session.user.id,
          email: session.user.email ?? '',
          role: 'creator',
        });
        setIsAuthHydrated(true);
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []); // Empty array — only runs once on mount

  async function login(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // onAuthStateChange fires SIGNED_IN → sets user + isAuthHydrated
  }

  async function logout() {
    await supabase.auth.signOut();
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
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;
    return (data || []).map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      isAdmin: u.role === 'admin',
      wallet_address: u.wallet_address,
      wallet_connected: !!u.wallet_connected,
      wallet_connected_at: u.wallet_connected_at,
    }));
  }

  async function setUserRole(userId: string, role: Role) {
    const { error } = await supabase.from('users').update({ role }).eq('id', userId);
    if (error) throw error;
  }

  async function inviteUser(email: string, name: string, role: Role) {
    const response = await fetch('/api/auth/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, role }),
    });
    if (!response.ok) throw new Error((await response.json()).error || 'Invite failed');
  }

  async function connectUserWallet(walletAddress: string) {
    if (!user) return;
    const update = {
      wallet_address: walletAddress,
      wallet_connected: true,
      wallet_connected_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('users').update(update).eq('id', user.id);
    if (error) throw error;
    setUser((prev) => (prev ? { ...prev, ...update } : null));
  }

  async function disconnectUserWallet() {
    if (!user) return;
    const update = { wallet_address: null, wallet_connected: false, wallet_connected_at: null };
    const { error } = await supabase.from('users').update(update).eq('id', user.id);
    if (error) throw error;
    setUser((prev) => (prev ? { ...prev, ...update } : null));
  }

  async function verify2FA(code: string) {
    if (!pending2FA) throw new Error('No 2FA in progress');
    if (code !== '123456') throw new Error('Invalid verification code. Use: 123456');
    if (pending2FA.password) {
      await login(pending2FA.email, pending2FA.password);
    }
    setPending2FA(null);
  }

  function cancel2FA() { setPending2FA(null); }

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
    pending2FA,
    verify2FA,
    cancel2FA,
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