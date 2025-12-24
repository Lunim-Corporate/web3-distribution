'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function UnauthorizedPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Access Denied
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          You don't have permission to access this page.
        </p>
        
        {user && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Logged in as:
            </p>
            <p className="font-medium text-gray-900 dark:text-white">
              {user.email}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Role: <span className="font-medium">{user.role}</span>
            </p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={() => {
              if (user) {
                if (user.role === 'admin') {
                  router.push('/admin/dashboard');
                } else if (user.role === 'creator') {
                  router.push('/creator/dashboard');
                } else {
                  router.push('/dashboard');
                }
              } else {
                router.push('/login');
              }
            }}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Go to My Dashboard
          </button>
          
          <button
            onClick={() => {
              logout();
              router.push('/login');
            }}
            className="w-full px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
