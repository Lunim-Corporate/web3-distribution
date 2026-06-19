'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface TwoFactorVerificationProps {
  email: string;
  onVerify: (_code: string) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const TwoFactorVerification: React.FC<TwoFactorVerificationProps> = ({
  email,
  onVerify,
  onCancel,
  isLoading = false,
}) => {
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!code.trim()) {
      setError('Please enter the verification code');
      return;
    }

    if (code.length < 6) {
      setError('Verification code must be 6 digits');
      return;
    }

    try {
      await onVerify(code);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 flex items-center justify-center">
      <div className="max-w-md mx-auto px-4 w-full">
        <Card className="p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Two-Factor Verification
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              A verification code has been sent to<br />
              <span className="font-semibold">{email}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded text-red-800 dark:text-red-200 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Verification Code
              </label>
              <Input
                type="text"
                placeholder="000000"
                maxLength={6}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, ''));
                  setError('');
                }}
                disabled={isLoading}
                className="text-center text-2xl tracking-widest font-mono"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Enter the 6-digit code from your email
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading || code.length !== 6}
                className="flex-1"
              >
                {isLoading ? 'Verifying...' : 'Verify'}
              </Button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Didn&apos;t receive a code? Check your spam folder or try again.
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
};
