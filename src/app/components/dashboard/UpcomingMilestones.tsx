'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
// mockMilestones removed — data now fetched from /api/milestones
import { formatDate } from '@/lib/utils';

export const UpcomingMilestones: React.FC = () => {
  const [milestones, setMilestones] = React.useState<Array<{
    id: string;
    title: string;
    description: string;
    date: string;
    priority: string;
  }>>([]);

  const fetchMilestones = React.useCallback(async () => {
    try {
      const ts = Date.now();
      const res = await fetch(`/api/milestones?ts=${ts}`, { cache: 'no-store' });
      const data = await res.json();
      
      // Filter for upcoming/pending milestones
      const upcoming = (data || []).filter((m: any) => m.status === 'pending' || m.status === 'upcoming');
      setMilestones(upcoming.slice(0, 5));
    } catch (e) {
      console.error("Failed to load milestones:", e);
      setMilestones([]);
    }
  }, []);

  React.useEffect(() => {
    fetchMilestones();
    window.addEventListener('payment-recorded', fetchMilestones);
    return () => window.removeEventListener('payment-recorded', fetchMilestones);
  }, [fetchMilestones]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Milestones</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {milestones.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No upcoming system-level milestones found.</p>
          ) : (
            milestones.map((m) => (
              <div key={m.id} className="flex items-start justify-between border-b last:border-b-0 border-gray-200 dark:border-gray-700 pb-3">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{m.title}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{m.description}</p>
                  <p className="text-xs text-gray-500 mt-1">{formatDate(m.date, 'short')}</p>
                </div>
                <Badge
                  variant={
                    (m.priority?.toLowerCase() || 'medium') === 'critical'
                      ? 'error'
                      : (m.priority?.toLowerCase() || 'medium') === 'high'
                        ? 'warning'
                        : (m.priority?.toLowerCase() || 'medium') === 'low'
                          ? 'info'
                          : 'default'
                  }
                >
                  {m.priority}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingMilestones;


