'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { useAuth } from '@/lib/auth';
import { formatDate, formatPercentage, getStatusColor } from '@/lib/utils';

type RightRow = {
  id: string;
  projectName: string;
  rightsType: string;
  owner: string;
  revenueShare: number;
  status: string;
  expirationDate: string;
};

export default function RightsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [rights, setRights] = useState<RightRow[]>([]);

  useEffect(() => {
    if (!user) router.replace('/login');
  }, [user, router]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/rights');
        const json = await res.json();
        setRights(Array.isArray(json) ? (json as RightRow[]) : []);
      } catch {
        setRights([]);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
        <SidebarNav />
        <div className="lg:col-span-10">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Creative Rights Overview</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Track ownership and rights distribution across all projects
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 font-medium text-gray-700 dark:text-gray-300">Project</th>
                      <th className="text-left py-3 font-medium text-gray-700 dark:text-gray-300">Rights Type</th>
                      <th className="text-left py-3 font-medium text-gray-700 dark:text-gray-300">Owner</th>
                      <th className="text-left py-3 font-medium text-gray-700 dark:text-gray-300">Share</th>
                      <th className="text-left py-3 font-medium text-gray-700 dark:text-gray-300">Status</th>
                      <th className="text-left py-3 font-medium text-gray-700 dark:text-gray-300">Expires</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rights.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-sm text-gray-600 dark:text-gray-400">
                          No creative rights found.
                        </td>
                      </tr>
                    ) : (
                      rights.map((right) => (
                        <tr
                          key={right.id}
                          className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                          <td className="py-4 font-medium text-gray-900 dark:text-white">{right.projectName}</td>
                          <td className="py-4 text-gray-600 dark:text-gray-400">{right.rightsType}</td>
                          <td className="py-4 text-gray-900 dark:text-white">{right.owner}</td>
                          <td className="py-4 font-medium text-gray-900 dark:text-white">
                            {formatPercentage(right.revenueShare)}
                          </td>
                          <td className="py-4">
                            <Badge variant={getStatusColor(right.status)}>{right.status}</Badge>
                          </td>
                          <td className="py-4 text-gray-600 dark:text-gray-400">
                            {right.expirationDate ? formatDate(right.expirationDate) : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

