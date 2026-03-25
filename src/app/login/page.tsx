'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { NotificationBanner, type NotificationType } from '@/components/ui/NotificationBanner';
import { DemoSetup } from '@/components/DemoSetup';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [notification, setNotification] = useState<{
    message: string;
    type: NotificationType;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const showNotification = (message: string, type: NotificationType) => {
    setNotification({ message, type });
  };

  const handleLogin = async () => {
    // Validation
    if (!email.trim()) {
      showNotification('Please enter your email address', 'error');
      return;
    }
    if (!email.includes('@')) {
      showNotification('Please enter a valid email address', 'error');
      return;
    }
    if (!password.trim()) {
      showNotification('Please enter your password', 'error');
      return;
    }

    setIsLoading(true);
    showNotification('Logging in...', 'info');

    try {
      await login(email, password);
      showNotification('✓ Login successful! Redirecting to dashboard...', 'success');
      
      // Wait for user to see success message
      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.push('/dashboard');
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Login failed. Please check your credentials.';
      console.error('Login error:', e);
      showNotification(`Error: ${errorMessage}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      {notification && (
        <NotificationBanner
          message={notification.message}
          type={notification.type}
          autoClose={notification.type === 'error' ? 0 : 5000}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Creative Rights & Revenue Tracker
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            RISIDIO Capstone Project - Login or Setup Demo
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Regular Login */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Login with Email
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                />
              </div>

              <button
                className="w-full px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium transition-colors"
                onClick={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? 'Logging in...' : 'Continue to Dashboard'}
              </button>
              
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Don&apos;t have an account?
                </p>
                <button
                  onClick={() => router.push('/signup')}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  Sign up here
                </button>
              </div>
            </div>
          </div>

          {/* Demo Setup */}
          <div>
            <DemoSetup />
          </div>
        </div>

        {/* Admin Instructions */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            🔑 How to Login as Admin
          </h3>
          <div className="space-y-2 text-blue-800 dark:text-blue-200">
            <p><strong>Option 1:</strong> Use the &quot;Setup Demo Data&quot; button above, then click &quot;Admin User&quot;</p>
            <p><strong>Option 2:</strong> Sign up with any email and select &quot;admin&quot; as your role</p>
            <p><strong>Option 3:</strong> Login with email: <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">admin@risidio.com</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}


