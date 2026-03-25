'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { mockMilestones } from '@/data/mockData';
import { formatDate } from '@/lib/utils';

export const UpcomingMilestones: React.FC = () => {
  const upcoming = [...mockMilestones]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 6);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Milestones</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {upcoming.map((m) => (
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
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingMilestones;


