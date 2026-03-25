'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface NotificationBannerProps {
  message: string;
  type: NotificationType;
  onClose?: () => void;
  autoClose?: number; // ms, 0 = no auto-close
  className?: string;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  message,
  type,
  onClose,
  autoClose = 5000,
  className,
}) => {
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    if (autoClose > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, autoClose);
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  if (!isVisible) return null;

  const bgColor = {
    success: 'bg-green-50 dark:bg-green-900/20',
    error: 'bg-red-50 dark:bg-red-900/20',
    info: 'bg-blue-50 dark:bg-blue-900/20',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20',
  }[type];

  const borderColor = {
    success: 'border-green-200 dark:border-green-700',
    error: 'border-red-200 dark:border-red-700',
    info: 'border-blue-200 dark:border-blue-700',
    warning: 'border-yellow-200 dark:border-yellow-700',
  }[type];

  const textColor = {
    success: 'text-green-800 dark:text-green-200',
    error: 'text-red-800 dark:text-red-200',
    info: 'text-blue-800 dark:text-blue-200',
    warning: 'text-yellow-800 dark:text-yellow-200',
  }[type];

  const icon = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  }[type];

  return (
    <div
      className={cn(
        'fixed top-4 left-4 right-4 max-w-2xl mx-auto z-50 border rounded-lg p-4 flex items-start gap-3',
        bgColor,
        borderColor,
        className
      )}
    >
      <span className={cn('text-xl font-bold flex-shrink-0', textColor)}>{icon}</span>
      <p className={cn('flex-1 text-sm md:text-base', textColor)}>{message}</p>
      {onClose && (
        <button
          onClick={() => {
            setIsVisible(false);
            onClose();
          }}
          className={cn('text-xl flex-shrink-0 hover:opacity-70', textColor)}
        >
          ✕
        </button>
      )}
    </div>
  );
};
