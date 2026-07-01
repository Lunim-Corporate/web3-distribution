import { describe, it, expect } from 'vitest';
import { cn, formatCurrency, formatPercentage, formatDate, getStatusColor, calculateGrowth, calculatePaymentSplit, normalizePaymentStatus, truncateAddress, generateId } from '@/lib/utils';

describe('cn', () => {
  it('merges tailwind classes', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });

  it('handles undefined values', () => {
    expect(cn('a', undefined, 'b')).toBe('a b');
  });
});

describe('formatCurrency', () => {
  it('formats USD by default (min 0 decimals)', () => {
    expect(formatCurrency(1234.5)).toBe('$1,234.5');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0');
  });
});

describe('formatPercentage', () => {
  it('formats with default 1 decimal', () => {
    expect(formatPercentage(25.5)).toBe('25.5%');
  });

  it('formats with custom decimals', () => {
    expect(formatPercentage(33.3333, 2)).toBe('33.33%');
  });

  it('formats zero', () => {
    expect(formatPercentage(0)).toBe('0.0%');
  });
});

describe('formatDate', () => {
  it('formats a date string in short format', () => {
    const result = formatDate('2026-06-15');
    expect(result).toContain('Jun');
    expect(result).toContain('2026');
  });

  it('returns empty for null', () => {
    expect(formatDate(null)).toBe('');
  });

  it('returns empty for invalid date', () => {
    expect(formatDate('not-a-date')).toBe('');
  });
});

describe('getStatusColor', () => {
  it('maps active to success', () => {
    expect(getStatusColor('active')).toBe('success');
  });

  it('maps paid to success', () => {
    expect(getStatusColor('paid')).toBe('success');
  });

  it('maps pending to warning', () => {
    expect(getStatusColor('pending')).toBe('warning');
  });

  it('maps failed to error', () => {
    expect(getStatusColor('failed')).toBe('error');
  });

  it('is case insensitive', () => {
    expect(getStatusColor('Paid')).toBe('success');
    expect(getStatusColor('PENDING')).toBe('warning');
  });

  it('returns default for unknown status', () => {
    expect(getStatusColor('unknown')).toBe('default');
  });
});

describe('calculateGrowth', () => {
  it('calculates positive growth', () => {
    expect(calculateGrowth(150, 100)).toBe(50);
  });

  it('calculates negative growth', () => {
    expect(calculateGrowth(50, 100)).toBe(-50);
  });

  it('returns 100 when previous is 0 and current > 0', () => {
    expect(calculateGrowth(100, 0)).toBe(100);
  });

  it('returns 0 when both are 0', () => {
    expect(calculateGrowth(0, 0)).toBe(0);
  });
});

describe('calculatePaymentSplit', () => {
  it('splits total proportionally', () => {
    const result = calculatePaymentSplit(1000, [
      { id: '1', name: 'Alice', revenueShare: 60 },
      { id: '2', name: 'Bob', revenueShare: 40 },
    ]);
    expect(result).toHaveLength(2);
    expect(result[0].amount).toBe(600);
    expect(result[1].amount).toBe(400);
    expect(result[0].status).toBe('Pending');
  });
});

describe('normalizePaymentStatus', () => {
  it('normalizes completed to Paid', () => {
    expect(normalizePaymentStatus('completed')).toBe('Paid');
  });

  it('normalizes paid to Paid', () => {
    expect(normalizePaymentStatus('paid')).toBe('Paid');
  });

  it('normalizes success to Paid', () => {
    expect(normalizePaymentStatus('success')).toBe('Paid');
  });

  it('returns Pending for unknown statuses', () => {
    expect(normalizePaymentStatus('failed')).toBe('Pending');
  });
});

describe('truncateAddress', () => {
  it('truncates an Ethereum address', () => {
    expect(truncateAddress('0x1234567890abcdef1234567890abcdef12345678')).toBe('0x1234...5678');
  });

  it('returns empty for empty input', () => {
    expect(truncateAddress('')).toBe('');
  });
});

describe('generateId', () => {
  it('generates a 9-character string', () => {
    expect(generateId()).toHaveLength(9);
  });

  it('generates unique values', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});
