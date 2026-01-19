'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { setAuthCookie, clearAuthCookie } from '@/lib/authCookieClient';

export type Role = 'admin' | 'creator' | 'contributor';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface UserSettings {
  notifyResurfacingHours: number;
}

interface AuthContextValue {
  user: AuthUser | null;
  isReady: boolean;
  settings: UserSettings;
  login: (email: string, name?: string, role?: Role) => void;
  signup: (name: string, email: string, role: Role) => void;
  logout: () => void;
  setNotifyResurfacingHours: (hours: number) => void;
  listUsers: () => AuthUser[];
  setUserRole: (email: string, role: Role) => void;
  inviteUser: (name: string, email: string, role: Role) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const DEFAULT_SETTINGS: UserSettings = {
  notifyResurfacingHours: 6,
};

function getUserKey(userId: string) {
  return `crt_settings_${userId}`;
}

const VALID_ROLES: Role[] = ['admin', 'creator', 'contributor'];

function normalizeUser(raw: any): AuthUser | null {
  if (!raw || typeof raw !== 'object') return null;
  if (!raw.id || typeof raw.id !== 'string') return null;
  if (!raw.email || typeof raw.email !== 'string') return null;
  const role: Role = VALID_ROLES.includes(raw.role) ? raw.role : 'creator';
  return {
    id: raw.id,
    name: typeof raw.name === 'string' ? raw.name : raw.email.split('@')[0],
    email: raw.email,
    role,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  // Load user and settings from localStorage
  useEffect(() => {
    try {
      const rawUser = localStorage.getItem('crt_user');
      if (rawUser) {
        const parsed = normalizeUser(JSON.parse(rawUser));
        if (parsed) {
          setUser(parsed);
          localStorage.setItem('crt_user', JSON.stringify(parsed));
          setAuthCookie(parsed);
        }
        const rawSettings = parsed ? localStorage.getItem(getUserKey(parsed.id)) : null;
        if (rawSettings) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(rawSettings) });
      }
    } catch {}
    setIsReady(true);
  }, []);

  // Persist settings per user
  useEffect(() => {
    try {
      if (user) localStorage.setItem(getUserKey(user.id), JSON.stringify(settings));
    } catch {}
  }, [user, settings]);

  const login = (email: string, name?: string, role: Role = 'creator') => {
    const existing = JSON.parse(localStorage.getItem('crt_users') || '[]') as AuthUser[];
    const found = existing.find((u) => u.email === email);
    const authUser: AuthUser =
      normalizeUser(found) ||
      ({
        id: `user_${Math.random().toString(36).slice(2, 9)}`,
        name: name || email.split('@')[0],
        email,
        role,
      } as AuthUser);
    if (!found) localStorage.setItem('crt_users', JSON.stringify([...existing, authUser]));
    setUser(authUser);
    localStorage.setItem('crt_user', JSON.stringify(authUser));
    // Also set cookie for middleware
    setAuthCookie(authUser);
    const rawSettings = localStorage.getItem(getUserKey(authUser.id));
    setSettings(rawSettings ? { ...DEFAULT_SETTINGS, ...JSON.parse(rawSettings) } : DEFAULT_SETTINGS);
  };

  const signup = (name: string, email: string, role: Role) => {
    const authUser: AuthUser = {
      id: `user_${Math.random().toString(36).slice(2, 9)}`,
      name,
      email,
      role,
    };
    const existing = JSON.parse(localStorage.getItem('crt_users') || '[]') as AuthUser[];
    localStorage.setItem('crt_users', JSON.stringify([...existing, authUser]));
    localStorage.setItem('crt_user', JSON.stringify(authUser));
    localStorage.setItem(getUserKey(authUser.id), JSON.stringify(DEFAULT_SETTINGS));
    setUser(authUser);
    setSettings(DEFAULT_SETTINGS);
    setAuthCookie(authUser);
  };

  const inviteUser = (name: string, email: string, role: Role) => {
    const invited: AuthUser = {
      id: `user_${Math.random().toString(36).slice(2, 9)}`,
      name,
      email,
      role,
    };
    const existing = JSON.parse(localStorage.getItem('crt_users') || '[]') as AuthUser[];
    localStorage.setItem('crt_users', JSON.stringify([...existing, invited]));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('crt_user');
    clearAuthCookie();
  };

  const setNotifyResurfacingHours = (hours: number) => {
    setSettings((prev) => ({ ...prev, notifyResurfacingHours: hours }));
  };

  const listUsers = () => {
    try {
      return JSON.parse(localStorage.getItem('crt_users') || '[]') as AuthUser[];
    } catch { return []; }
  };

  const setUserRole = (email: string, role: Role) => {
    try {
      const users = listUsers();
      const updated = users.map((u) => (u.email === email ? { ...u, role } : u));
      localStorage.setItem('crt_users', JSON.stringify(updated));
      const current = JSON.parse(localStorage.getItem('crt_user') || 'null') as AuthUser | null;
      if (current && current.email === email) {
        const next = { ...current, role };
        localStorage.setItem('crt_user', JSON.stringify(next));
        setUser(next);
        setAuthCookie(next);
      }
    } catch {}
  };

  const value = useMemo(
    () => ({
      user,
      isReady,
      settings,
      login,
      signup,
      logout,
      setNotifyResurfacingHours,
      listUsers,
      setUserRole,
      inviteUser,
    }),
    [user, isReady, settings]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
