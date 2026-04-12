'use client';

import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { Revenue } from '@/lib/types';

interface RevenueFilterProps {
  revenues: Revenue[];
  onFiltered: (filtered: Revenue[]) => void;
  className?: string;
}

type FilterStatus = 'all' | 'Paid' | 'Pending';
type FilterPeriod = '7d' | '30d' | '90d' | 'ytd' | 'all';

export const RevenueFilter: React.FC<RevenueFilterProps> = ({
  revenues,
  onFiltered,
  className,
}) => {
  const [status, setStatus] = useState<FilterStatus>('all');
  const [period, setPeriod] = useState<FilterPeriod>('30d');
  const [minAmount, setMinAmount] = useState<number>(0);
  const [maxAmount, setMaxAmount] = useState<number>(999999);
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set());

  // Extract unique sources from revenues
  const uniqueSources = Array.from(new Set(revenues.map((r) => r.source))).sort();

  // Apply filters
  const applyFilters = useCallback(() => {
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case 'ytd':
        startDate.setMonth(0);
        startDate.setDate(1);
        break;
      case 'all':
        startDate = new Date('2000-01-01');
        break;
    }

    const filtered = revenues.filter((r) => {
      const rDate = new Date(r.date);

      // Date filter
      if (rDate < startDate) return false;

      // Status filter
      if (status !== 'all' && r.status !== status) return false;

      // Amount filter
      if (r.amount < minAmount || r.amount > maxAmount) return false;

      // Source filter
      if (selectedSources.size > 0 && !selectedSources.has(r.source)) return false;

      return true;
    });

    onFiltered(filtered);
  }, [revenues, status, period, minAmount, maxAmount, selectedSources, onFiltered]);

  // Call applyFilters when filters change
  React.useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const toggleSource = (source: string) => {
    const newSources = new Set(selectedSources);
    if (newSources.has(source)) {
      newSources.delete(source);
    } else {
      newSources.add(source);
    }
    setSelectedSources(newSources);
  };

  const resetFilters = () => {
    setStatus('all');
    setPeriod('30d');
    setMinAmount(0);
    setMaxAmount(999999);
    setSelectedSources(new Set());
  };

  return (
    <Card className={cn('bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700', className)}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filter Revenue</h3>
        <Button variant="secondary" size="sm" onClick={resetFilters}>
          🔄 Reset
        </Button>
      </div>

      <div className="space-y-6">
        {/* Time Period Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Time Period
          </label>
          <div className="flex flex-wrap gap-2">
            {(['7d', '30d', '90d', 'ytd', 'all'] as const).map((p) => (
              <Button
                key={p}
                variant={period === p ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setPeriod(p)}
              >
                {p === '7d' ? 'Last 7 days' : p === '30d' ? 'Last 30 days' : p === '90d' ? 'Last 90 days' : p === 'ytd' ? 'YTD' : 'All Time'}
              </Button>
            ))}
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Payment Status
          </label>
          <div className="flex gap-2">
            {(['all', 'Paid', 'Pending'] as const).map((s) => (
              <Button
                key={s}
                variant={status === s ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setStatus(s)}
              >
                {s === 'all' ? 'All' : s}
              </Button>
            ))}
          </div>
        </div>

        {/* Amount Range Filter */}
        <div className="p-4 bg-white dark:bg-gray-600 rounded-lg">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Amount Range
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400">Min ($)</label>
              <input
                type="number"
                value={minAmount}
                onChange={(e) => setMinAmount(Math.max(0, Number(e.target.value)))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                min="0"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400">Max ($)</label>
              <input
                type="number"
                value={maxAmount}
                onChange={(e) => setMaxAmount(Math.max(minAmount, Number(e.target.value)))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                min={minAmount}
              />
            </div>
          </div>
        </div>

        {/* Source Filter */}
        {uniqueSources.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Revenue Sources
            </label>
            <div className="flex flex-wrap gap-2">
              {uniqueSources.map((source) => (
                <button
                  key={source}
                  onClick={() => toggleSource(source)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-semibold transition-colors',
                    selectedSources.has(source)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-500'
                  )}
                >
                  {source}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filter Summary */}
        <div className="p-3 bg-white dark:bg-gray-600 rounded-lg border-l-4 border-blue-500">
          <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
            <span className="font-semibold">Active Filters:</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="info">Period: {period}</Badge>
            {status !== 'all' && <Badge variant="warning">Status: {status}</Badge>}
            {selectedSources.size > 0 && (
              <Badge variant="success">Sources: {selectedSources.size}</Badge>
            )}
            {(minAmount > 0 || maxAmount < 999999) && (
              <Badge variant="info">Amount: ${minAmount.toLocaleString()}-${maxAmount.toLocaleString()}</Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
