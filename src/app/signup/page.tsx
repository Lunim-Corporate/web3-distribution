'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Role, useAuth } from '@/lib/auth';
import { toast } from 'react-hot-toast';

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('creator');

  const handleSignup = () => {
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (!email.trim()) {
      toast.error('Please enter your email');
      return;
    }
    if (!email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    signup(name, email, role);
    
    // Redirect based on role
    if (role === 'admin') {
      toast.success('Admin account created. You now have full control.');
      router.push('/admin/dashboard');
    } else if (role === 'creator') {
      toast.success('Creator account created. You can now access your dashboard.');
      router.push('/creator/dashboard');
    } else if (role === 'contributor') {
      toast.success('Contributor account created. You can now access your dashboard.');
      router.push('/contributor/dashboard');
    } else {
      toast.success('Account created.');
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Create Account</h1>
            <p className="text-gray-600 dark:text-gray-400">Join the Creative Rights Tracker</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Name
              </label>
              <input 
                className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                placeholder="Enter your full name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <input 
                type="email"
                className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                placeholder="Enter your email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role
              </label>
              <select 
                className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                value={role} 
                onChange={(e) => setRole(e.target.value as Role)}
              >
                <option value="admin">Admin - Full system access</option>
                <option value="creator">Creator - Project management</option>
                <option value="contributor">Contributor - Limited access</option>
              </select>
            </div>
            
            <button
              className="w-full px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
              onClick={handleSignup}
            >
              Create Account
            </button>
            
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Already have an account?
              </p>
              <button
                onClick={() => router.push('/login')}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
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


