'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

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
  wallet_address?: string | null;     // Optional wallet address
  wallet_connected?: boolean;           // Whether wallet is connected
  wallet_connected_at?: string | null;  // When wallet was connected
};

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (name: string, email: string, role: Role) => void;
  settings: Settings | null;
  setNotifyResurfacingHours: (hours: number) => void;
  listUsers: () => User[];
  setUserRole: (userId: string, role: Role) => void;
  inviteUser: (email: string, name: string, role: Role) => void;
  connectUserWallet: (walletAddress: string) => void;  // Add wallet after login
  disconnectUserWallet: () => void;                      // Remove wallet connection
};

const ADMIN_EMAIL = 'jeevesh2515@gmail.com';
const ADMIN_PASSWORD = 'Newproject1';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('crt_user');
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        localStorage.removeItem('crt_user');
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('crt_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('crt_user');
    }
  }, [user]);

  async function login(email: string, password: string) {
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      setUser({
        id: 'admin-1',
        email,
        name: 'Admin',
        isAdmin: true,
        role: 'admin',
        settings: { notifyResurfacingHours: 24 },
      });
      return;
    }
    setUser({
      id: `u-${Date.now()}`,
      email,
      name: email.split('@')[0],
      isAdmin: false,
      role: 'creator',
      settings: { notifyResurfacingHours: 24 },
    });
  }

  function signup(name: string, email: string, role: Role) {
    const newUser: User = {
      id: `u-${Date.now()}`,
      email,
      name,
      isAdmin: role === 'admin',
      role,
      settings: { notifyResurfacingHours: 24 },
    };
    setUser(newUser);
  }

  function logout() {
    setUser(null);
  }

  function setNotifyResurfacingHours(hours: number) {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        settings: { ...(prev.settings || {}), notifyResurfacingHours: hours },
      };
      localStorage.setItem('crt_user', JSON.stringify(updated));
      return updated;
    });
  }

  const settings = user?.settings ?? null;

  function listUsers(): User[] {
    const stored = localStorage.getItem('crt_all_users');
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  function setUserRole(userId: string, role: Role) {
    const users = listUsers();
    const updated = users.map(u => u.id === userId ? { ...u, role } : u);
    localStorage.setItem('crt_all_users', JSON.stringify(updated));
  }

  function inviteUser(email: string, name: string, role: Role) {
    const users = listUsers();
    const newUser: User = {
      id: `u-${Date.now()}`,
      email,
      name,
      role,
      settings: { notifyResurfacingHours: 24 },
    };
    users.push(newUser);
    localStorage.setItem('crt_all_users', JSON.stringify(users));
  }

  function connectUserWallet(walletAddress: string) {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        wallet_address: walletAddress,
        wallet_connected: true,
        wallet_connected_at: new Date().toISOString(),
      };
      localStorage.setItem('crt_user', JSON.stringify(updated));
      return updated;
    });
  }

  function disconnectUserWallet() {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        wallet_address: null,
        wallet_connected: false,
        wallet_connected_at: null,
      };
      localStorage.setItem('crt_user', JSON.stringify(updated));
      return updated;
    });
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        signup,
        settings,
        setNotifyResurfacingHours,
        listUsers,
        setUserRole,
        inviteUser,
        connectUserWallet,
        disconnectUserWallet,
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