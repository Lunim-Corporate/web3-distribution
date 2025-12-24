'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

interface CreatorLayoutProps {
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

export const CreatorLayout: React.FC<CreatorLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user || (user.role !== 'creator' && user.role !== 'admin')) {
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
                Creator Dashboard
              </h1>
              <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">
                Creator
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">{user.email}</span>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <aside className="col-span-12 lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 space-y-2">
              <div className="px-3 py-2 text-xs font-semibold tracking-wide text-gray-500 dark:text-gray-400 uppercase">
                Navigation
              </div>
              <NavItem href="/creator/dashboard" label="Dashboard" icon="📊" />
              <NavItem href="/creator/projects" label="My Projects" icon="🎬" />
              <NavItem href="/creator/revenue" label="Revenue" icon="💰" />
              <NavItem href="/creator/rights" label="My Rights" icon="⚖️" />
              <NavItem href="/creator/payouts" label="Payouts" icon="💸" />
              <NavItem href="/creator/topup" label="Top Up" icon="💳" />
              <NavItem href="/creator/withdraw" label="Withdraw" icon="🏦" />
              <NavItem href="/creator/settings" label="Settings" icon="⚙️" />
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
