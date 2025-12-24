'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { toast } from 'react-hot-toast';
import { DemoSetup } from '@/components/DemoSetup';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
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
              <input
                className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button
                className="w-full px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                onClick={() => {
                  if (!email.trim()) {
                    toast.error('Please enter an email address');
                    return;
                  }
                  login(email);
                  const role = JSON.parse(localStorage.getItem('crt_user')||'{}').role;
                  if (role === 'admin') {
                    toast.success('Welcome back, Admin!');
                    router.push('/admin/dashboard');
                  } else if (role === 'creator') {
                    toast.success('Welcome back, Creator!');
                    router.push('/creator/dashboard');
                  } else {
                    toast.success('Welcome back!');
                    router.push('/dashboard');
                  }
                }}
              >
                Continue to Dashboard
              </button>
              
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Don't have an account?
                </p>
                <button
                  onClick={() => router.push('/signup')}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
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
            <p><strong>Option 1:</strong> Use the "Setup Demo Data" button above, then click "Admin User"</p>
            <p><strong>Option 2:</strong> Sign up with any email and select "admin" as your role</p>
            <p><strong>Option 3:</strong> Login with email: <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">admin@risidio.com</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}


