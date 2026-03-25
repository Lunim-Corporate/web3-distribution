'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { formatCurrency, formatDate } from '@/lib/utils';

interface ActivityItem {
  id: string;
  title: string;
  time: string;
  icon: string;
}

interface RevenueData {
  id: string;
  projectId: string;
  projectName: string;
  amount: number;
  date: string;
}

interface SplitData {
  id: string;
  projectId: string;
  projectName?: string;
  amount: number;
  date?: string;
}

interface RightsData {
  id: string;
  projectName: string;
  status?: string;
  createdDate?: string;
  expirationDate?: string;
}

interface MilestoneData {
  id: string;
  title: string;
  date?: string;
  target_date?: string;
}

export const RecentActivity: React.FC = () => {
  const [items, setItems] = React.useState<ActivityItem[]>([]);
  React.useEffect(() => {
    Promise.all([
      fetch('/api/revenue').then(r=>r.json()),
      fetch('/api/rights').then(r=>r.json()),
      fetch('/api/milestones').then(r=>r.json())
    ]).then(([revenue, rights, milestones]) => {
      let splits: SplitData[] = [];
      try { splits = JSON.parse(localStorage.getItem('crt_recent_splits')||'[]'); } catch {}
      const revItems = (revenue as RevenueData[]).slice(0,5).map((r: RevenueData)=>({ id: r.id, title: `Payment of ${formatCurrency(r.amount)} received for ${r.projectName}`, time: formatDate(r.date), icon: '💰' }));
      const splitItems = splits.slice(0,3).map((s: SplitData)=>({ id: `split_${s.id}`, title: `Split ${formatCurrency(s.amount)} for ${(() => {
        const match = (revenue as RevenueData[]).find((rr: RevenueData) => rr.projectId === s.projectId || rr.projectName === s.projectId);
        return match ? match.projectName : (s.projectName || s.projectId || 'Unknown Project');
      })()}`, time: formatDate(s.date || new Date()), icon: '🧮' }));
      const rightsItems = (rights as RightsData[]).slice(0,3).map((x: RightsData)=>({ id: `right_${x.id}`, title: `Rights ${x.status?.toLowerCase()} for ${x.projectName}`, time: formatDate(x.createdDate||x.expirationDate||new Date()), icon: '⚖️' }));
      const mileItems = (milestones as MilestoneData[]).slice(0,3).map((m: MilestoneData)=>({ id: m.id, title: m.title, time: formatDate(m.date||m.target_date||new Date()), icon: '📅' }));
      setItems([...revItems, ...splitItems, ...rightsItems, ...mileItems].slice(0,8));
    }).catch(()=>setItems([]));
  }, []);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map(i => (
            <div key={i.id} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">{i.icon}</div>
              <div>
                <p className="text-sm text-gray-900 dark:text-white">{i.title}</p>
                <p className="text-xs text-gray-500">{i.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivity;


