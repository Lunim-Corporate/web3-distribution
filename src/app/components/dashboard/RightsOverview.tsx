'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { CreativeRight } from '@/lib/types';

export const RightsOverview: React.FC = () => {
  const [rights, setRights] = useState<CreativeRight[]>([]);

  useEffect(() => {
    fetch('/api/rights')
      .then((r) => r.json())
      .then(setRights)
      .catch(() => setRights([]));
  }, []);

  return (
    <Card id="rights-ledger">
      <CardHeader>
        <CardTitle>Creative Rights</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 text-sm font-medium text-gray-700 dark:text-gray-300">Project</th>
                <th className="text-left py-3 text-sm font-medium text-gray-700 dark:text-gray-300">Rights Type</th>
                <th className="text-left py-3 text-sm font-medium text-gray-700 dark:text-gray-300">Owner</th>
                <th className="text-left py-3 text-sm font-medium text-gray-700 dark:text-gray-300">Share</th>
                <th className="text-left py-3 text-sm font-medium text-gray-700 dark:text-gray-300">Status</th>
                <th className="text-left py-3 text-sm font-medium text-gray-700 dark:text-gray-300">Expiry</th>
              </tr>
            </thead>
            <tbody>
              {rights.slice(0, 6).map((r) => (
                <tr key={r.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 text-gray-900 dark:text-white">{r.projectName}</td>
                  <td className="py-3 text-gray-600 dark:text-gray-400">{r.rightsType}</td>
                  <td className="py-3 text-gray-600 dark:text-gray-400">{r.owner}</td>
                  <td className="py-3 text-gray-900 dark:text-white font-medium">{r.revenueShare}%</td>
                  <td className="py-3">
                    <Badge variant={r.status === 'Active' ? 'success' : r.status === 'Expiring Soon' ? 'warning' : 'error'}>
                      {r.status}
                    </Badge>
                  </td>
                  <td className="py-3 text-gray-600 dark:text-gray-400">{formatDate(r.expirationDate, 'short')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rights.length === 0 && (
            <p className="text-sm text-gray-500">No rights available.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RightsOverview;
