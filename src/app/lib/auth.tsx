'use client';

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
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
  // 2FA support
  pending2FA: { email: string; sessionId: string } | null;
  verify2FA: (code: string) => Promise<void>;
  cancel2FA: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_SETTINGS: Settings = { notifyResurfacingHours: 24 };
const SETTINGS_LS_KEY = 'crt_settings';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isAuthHydrated, setIsAuthHydrated] = useState(false);
  const [pending2FA, setPending2FA] = useState<{ email: string; sessionId: string; password?: string } | null>(null);

  const effectiveSettings = useMemo<Settings>(() => {
    return user?.settings ?? settings ?? DEFAULT_SETTINGS;
  }, [settings, user?.settings]);

  function setCookie(u: User) {
    try {
      document.cookie = `crt_user=${encodeURIComponent(JSON.stringify(u))}; path=/; SameSite=Lax`;
    } catch {
      // ignore
    }
  }

  function clearCookie() {
    try {
      document.cookie = 'crt_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    } catch {
      // ignore
    }
  }

  const hydrateUser = useCallback(async (authUserId: string) => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      console.error('No auth user found');
      setUser(null);
      return;
    }

    // Public role lives in our `users` table.
    let dbUser: Record<string, unknown> | null = null;
    const { data: fetchedUser, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUserId)
      .maybeSingle();

    if (fetchedUser) {
      dbUser = fetchedUser;
    }

    // If user not found in public.users, create it as a fallback
    if (!dbUser && !error) {
      const meta = (authUser?.user_metadata ?? {}) as Record<string, unknown>;
      const metaName = typeof meta.name === 'string' ? meta.name : undefined;
      const metaRole = (meta.role as Role | undefined) ?? 'creator';

      const { data: createdUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: authUserId,
          email: authUser.email ?? '',
          name: metaName ?? authUser.email ?? '',
          role: metaRole,
        })
        .select('*')
        .single();

      if (createError) {
        console.error('Failed to create user record:', createError);
      } else {
        dbUser = createdUser;
      }
    } else if (error) {
      console.error('Failed to fetch user:', error);
    }

    const meta = (authUser?.user_metadata ?? {}) as Record<string, unknown>;
    const metaRole = meta.role as Role | undefined;
    const role = (dbUser?.role as Role | undefined) ?? metaRole ?? 'creator';
    const hydrated: User = {
      id: authUserId,
      email: (typeof dbUser?.email === 'string' ? dbUser.email : authUser?.email) ?? '',
      name:
        (typeof dbUser?.name === 'string' ? dbUser.name : undefined) ??
        (typeof meta.name === 'string' ? meta.name : undefined) ??
        '',
      isAdmin: role === 'admin',
      role,
      wallet_address: (dbUser?.wallet_address as string | null) ?? null,
      wallet_connected: (dbUser?.wallet_connected as boolean) ?? false,
      wallet_connected_at: (dbUser?.wallet_connected_at as string | null) ?? null,
      settings: effectiveSettings,
    };

    setUser(hydrated);
    setCookie(hydrated);
  }, [effectiveSettings]);

  const hydrateFromSession = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      await hydrateUser(session.user.id);
    }
    setIsAuthHydrated(true);
  }, [hydrateUser]);

  useEffect(() => {
    // Restore UI settings (independent from auth).
    const raw = localStorage.getItem(SETTINGS_LS_KEY);
    if (raw) {
      try {
        setSettings(JSON.parse(raw) as Settings);
      } catch {
        // ignore
      }
    }

    void hydrateFromSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        clearCookie();
        setUser(null);
        setIsAuthHydrated(true);
        return;
      }
      await hydrateUser(session.user.id);
      setIsAuthHydrated(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [hydrateFromSession, hydrateUser]);

  async function login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.user) await hydrateUser(data.user.id);
  }

  async function signup(name: string, email: string, role: Role, password: string) {
    try {
      // Call server-side API that uses service role key for proper permissions
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, role, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Signup failed');
      }

      // Trigger 2FA verification - store password temporarily
      const sessionId = Math.random().toString(36).substr(2, 9);
      setPending2FA({ email, sessionId, password });

      // After successful 2FA, sign in with Supabase Auth
      // This is handled by verify2FA function
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    clearCookie();
    setUser(null);
  }

  function setNotifyResurfacingHours(hours: number) {
    setSettings((prev) => {
      const next = { ...(prev ?? effectiveSettings), notifyResurfacingHours: hours };
      localStorage.setItem(SETTINGS_LS_KEY, JSON.stringify(next));
      setUser((u) => (u ? { ...u, settings: next } : u));
      if (user) setCookie({ ...user, settings: next });
      return next;
    });
  }

  async function listUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*');
    if (error) throw error;
    const rows = (data ?? []) as Array<Record<string, unknown>>;
    return rows.map((u) => {
      const rowRole = typeof u.role === 'string' ? (u.role as Role) : undefined;
      return {
        id: String(u.id ?? ''),
        email: String(u.email ?? ''),
        name: typeof u.name === 'string' ? u.name : undefined,
        role: rowRole ?? 'creator',
        isAdmin: rowRole === 'admin',
        wallet_address: typeof u.wallet_address === 'string' ? u.wallet_address : null,
        wallet_connected: typeof u.wallet_connected === 'boolean' ? u.wallet_connected : false,
        wallet_connected_at:
          typeof u.wallet_connected_at === 'string' ? u.wallet_connected_at : null,
        settings: effectiveSettings,
      };
    });
  }

  async function setUserRole(userId: string, role: Role) {
    const { error } = await supabase.from('users').update({ role }).eq('id', userId);
    if (error) throw error;
  }

  async function inviteUser(email: string, name: string, role: Role) {
    const response = await fetch('/api/auth/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, role })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to send invite.');
    }
  }

  async function connectUserWallet(walletAddress: string) {
    if (!user) return;
    const { error } = await supabase
      .from('users')
      .update({
        wallet_address: walletAddress,
        wallet_connected: true,
        wallet_connected_at: new Date().toISOString(),
      })
      .eq('id', user.id);
    if (error) throw error;

    setUser((prev) =>
      prev
        ? {
            ...prev,
            wallet_address: walletAddress,
            wallet_connected: true,
            wallet_connected_at: new Date().toISOString(),
          }
        : prev
    );
  }

  async function disconnectUserWallet() {
    if (!user) return;
    const { error } = await supabase
      .from('users')
      .update({
        wallet_address: null,
        wallet_connected: false,
        wallet_connected_at: null,
      })
      .eq('id', user.id);
    if (error) throw error;

    setUser((prev) =>
      prev
        ? {
            ...prev,
            wallet_address: null,
            wallet_connected: false,
            wallet_connected_at: null,
          }
        : prev
    );
  }

  async function verify2FA(code: string) {
    if (!pending2FA) throw new Error('No 2FA process in progress');

    // Generate verification code (for demo, accept 123456)
    // In production, this would verify against sent code
    if (code !== '123456' && code !== pending2FA.sessionId.slice(0, 6)) {
      throw new Error('Invalid verification code. For demo, use: 123456');
    }

    // Verification successful - now sign in with the stored credentials
    if (pending2FA.password) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: pending2FA.email,
        password: pending2FA.password,
      });

      if (signInError) {
        throw new Error(signInError.message);
      }

      if (signInData.user) {
        // Wait a moment for the database record to be created
        await new Promise((resolve) => setTimeout(resolve, 500));
        await hydrateUser(signInData.user.id);
      }
    }

    // Clear pending 2FA
    setPending2FA(null);
  }

  function cancel2FA() {
    setPending2FA(null);
  }

  // Prevent UI flicker for route protection decisions.
  if (!isAuthHydrated) {
    return (
      <AuthContext.Provider
        value={{
          user,
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
        }}
      >
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}