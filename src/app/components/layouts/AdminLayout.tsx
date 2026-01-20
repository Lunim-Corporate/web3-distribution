'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useWallet } from '@/lib/wallet';

interface AdminLayoutProps {
  children: ReactNode;
}

const NavItem: React.FC<{ href: string; label: string; icon: string }> = ({ href, label, icon }) => {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + '/');
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span className="font-medium">{label}</span>
    </Link>
  );
};

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, logout, isReady } = useAuth();
  const { account, isConnected, isConnecting, connectWallet, disconnectWallet, warning, clearWarning } = useWallet();
  const router = useRouter();

  if (!isReady || !user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Admin Dashboard
              </h1>
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                Admin
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">{user.email}</span>
              {isConnected && account ? (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-mono">Connected: {account.slice(0, 6)}...{account.slice(-4)}</span>
                  <button
                    onClick={disconnectWallet}
                    className="px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={connectWallet}
                  disabled={isConnecting}
                  className="px-3 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                </button>
              )}
              <button
                onClick={() => {
                  logout();
                  router.push('/login');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      {warning && (
        <div className="bg-yellow-50 border-b border-yellow-200 text-yellow-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between text-sm">
            <span>{warning}</span>
            <button onClick={clearWarning} className="text-yellow-900 font-medium">
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <aside className="col-span-12 lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 space-y-2">
              <div className="px-3 py-2 text-xs font-semibold tracking-wide text-gray-500 dark:text-gray-400 uppercase">
                Navigation
              </div>
              <NavItem href="/admin/dashboard" label="Dashboard" icon="📊" />
              <NavItem href="/admin/projects" label="Projects" icon="🎬" />
              <NavItem href="/admin/revenue" label="Revenue" icon="💰" />
              <NavItem href="/admin/rights" label="Rights" icon="⚖️" />
              <NavItem href="/admin/users" label="Users" icon="👥" />
              <NavItem href="/admin/contracts" label="Contracts" icon="📝" />
              <NavItem href="/admin/settings" label="Settings" icon="⚙️" />
            </div>
          </aside>

          {/* Main Content */}
          <main className="col-span-12 lg:col-span-9">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
