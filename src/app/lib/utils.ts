import clsx, { type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'GBP'): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatDate(date: string | Date, format: 'short' | 'long' | 'relative' = 'short'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const options: Intl.DateTimeFormatOptions = 
    format === 'long' 
      ? { year: 'numeric', month: 'long', day: 'numeric' }
      : { year: 'numeric', month: 'short', day: 'numeric' };
  
  return new Intl.DateTimeFormat('en-GB', options).format(dateObj);
}

export function getStatusColor(status: string): 'default' | 'success' | 'warning' | 'error' | 'info' {
  const statusColorMap: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
    'active': 'success',
    'completed': 'success',
    'paid': 'success',
    'in progress': 'info',
    'processing': 'info',
    'pending': 'warning',
    'expiring soon': 'warning',
    'overdue': 'error',
    'failed': 'error',
    'expired': 'error',
    'paused': 'default',
  };
  
  return statusColorMap[status.toLowerCase()] || 'default';
}

export function calculateGrowth(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function calculatePaymentSplit(totalAmount: number, contributors: any[]): any[] {
  return contributors.map(contributor => ({
    contributorId: contributor.id,
    contributorName: contributor.name,
    percentage: contributor.revenueShare,
    amount: (totalAmount * contributor.revenueShare) / 100,
    status: 'Pending' as const
  }));
}

export function truncateAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}
