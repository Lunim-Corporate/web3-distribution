import clsx, { type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
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
  
  return new Intl.DateTimeFormat('en-US', options).format(dateObj);
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
  const totalShare = contributors.reduce((sum: number, c: any) => sum + (c.revenueShare || 0), 0) || 1;
  const normalized = contributors.map((contributor: any) => {
    const normalizedPercentage = (contributor.revenueShare || 0) / totalShare * 100;
    const rawAmount = (totalAmount * normalizedPercentage) / 100;
    return {
      contributorId: contributor.id,
      contributorName: contributor.name,
      percentage: Number(normalizedPercentage.toFixed(4)),
      rawAmount,
    };
  });

  const percentageSum = normalized.reduce((sum, n) => sum + n.percentage, 0);
  const pctDiff = Number((100 - percentageSum).toFixed(4));
  if (normalized.length > 0) {
    normalized[normalized.length - 1].percentage = Number(
      (normalized[normalized.length - 1].percentage + pctDiff).toFixed(4)
    );
    normalized[normalized.length - 1].rawAmount = (totalAmount * normalized[normalized.length - 1].percentage) / 100;
  }

  const roundedAmounts = normalized.map((n) => Math.floor(n.rawAmount * 100) / 100);
  const diffCents = Math.round(totalAmount * 100 - roundedAmounts.reduce((s, v) => s + Math.round(v * 100), 0));
  if (roundedAmounts.length > 0) {
    roundedAmounts[0] = Math.round((roundedAmounts[0] * 100 + diffCents)) / 100;
  }

  return normalized.map((n, idx) => ({
    contributorId: n.contributorId,
    contributorName: n.contributorName,
    percentage: n.percentage,
    amount: roundedAmounts[idx] ?? 0,
    status: 'Pending' as const,
  }));
}

export function truncateAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}
