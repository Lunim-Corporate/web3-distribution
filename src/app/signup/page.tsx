'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Role, useAuth } from '@/lib/auth';
import { NotificationBanner, type NotificationType } from '@/components/ui/NotificationBanner';
import { TwoFactorVerification } from '@/components/TwoFactorVerification';

export default function SignupPage() {
  const { signup, pending2FA, verify2FA, cancel2FA } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('creator');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [notification, setNotification] = useState<{
    message: string;
    type: NotificationType;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [is2FALoading, setIs2FALoading] = useState(false);

  const showNotification = (message: string, type: NotificationType) => {
    setNotification({ message, type });
  };

  const handle2FAVerify = async (code: string) => {
    setIs2FALoading(true);
    try {
      await verify2FA(code);
      showNotification('✓ Email verified! Logging you in...', 'success');
      
      // Wait then redirect
      await new Promise((resolve) => setTimeout(resolve, 1500));
      router.push('/dashboard');
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Verification failed';
      console.error('2FA verification error:', e);
      showNotification(`Error: ${errorMessage}`, 'error');
    } finally {
      setIs2FALoading(false);
    }
  };

  // Show 2FA form if waiting for verification
  if (pending2FA) {
    return (
      <>
        {notification && (
          <NotificationBanner
            message={notification.message}
            type={notification.type}
            autoClose={notification.type === 'error' ? 0 : 5000}
            onClose={() => setNotification(null)}
          />
        )}
        <TwoFactorVerification
          email={pending2FA.email}
          onVerify={handle2FAVerify}
          onCancel={cancel2FA}
          isLoading={is2FALoading}
        />
      </>
    );
  }

  const handleSignup = async () => {
    // Validation
    if (!name.trim()) {
      showNotification('Please enter your full name', 'error');
      return;
    }
    if (!email.trim()) {
      showNotification('Please enter your email address', 'error');
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      showNotification('Please enter a valid email address', 'error');
      return;
    }
    if (!password.trim()) {
      showNotification('Please enter a password', 'error');
      return;
    }
    if (password.length < 8) {
      showNotification('Password must be at least 8 characters long', 'error');
      return;
    }
    if (password !== confirmPassword) {
      showNotification('Passwords do not match', 'error');
      return;
    }

    setIsLoading(true);
    showNotification('Creating your account...', 'info');

    try {
      await signup(name, email, role, password);
      showNotification('✓ Account created successfully! Redirecting to dashboard...', 'success');
      
      // Wait a moment for user to see success message
      await new Promise((resolve) => setTimeout(resolve, 1500));
      router.push('/dashboard');
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Signup failed. Please try again.';
      console.error('Signup error:', e);
      showNotification(`Error: ${errorMessage}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSignup();
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

      <div className="max-w-md mx-auto px-4 mt-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Create Account</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Join the Creative Rights Tracker</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Name
              </label>
              <input 
                className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed" 
                placeholder="Enter your full name" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
              />
            </div>
            
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
                Role
              </label>
              <select 
                className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed" 
                value={role} 
                onChange={(e) => setRole(e.target.value as Role)}
                disabled={isLoading}
              >
                <option value="admin">Admin - Full system access</option>
                <option value="creator">Creator - Project management</option>
                <option value="contributor">Contributor - Limited access</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Create a password (min 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                At least 8 characters, mix of letters and numbers recommended
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
              />
            </div>

            <button
              className="w-full px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium transition-colors"
              onClick={handleSignup}
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
            
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Already have an account?
              </p>
              <button
                onClick={() => router.push('/login')}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                Sign in here
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


