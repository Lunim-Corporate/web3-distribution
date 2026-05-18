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

interface RecentActivityProps {
  projectId?: string | null;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ projectId }) => {
  const [items, setItems] = React.useState<ActivityItem[]>([]);
  const [isDemoMode, setIsDemoMode] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsDemoMode(localStorage.getItem('demo_mode') === 'true');
    }
    const onDemoChanged = () => {
      setIsDemoMode(localStorage.getItem('demo_mode') === 'true');
    };
    window.addEventListener('demo-mode-changed', onDemoChanged);
    return () => window.removeEventListener('demo-mode-changed', onDemoChanged);
  }, []);

  const fetchActivity = React.useCallback(async () => {
    try {
      const ts = Date.now();
      const url = new URL('/api/activities', window.location.origin);
      url.searchParams.set('ts', ts.toString());
      const mode = isDemoMode ? 'demo' : 'live';
      url.searchParams.set('mode', mode);

      if (projectId) {
        url.searchParams.set('projectId', projectId);
      }
      const res = await fetch(url.toString(), { cache: 'no-store' });
      const activities = await res.json();
      
      const mapped: ActivityItem[] = (activities || []).map((a: any) => {
        let icon = '🔔';
        if (a.activity_type === 'payment_recorded') icon = '💰';
        if (a.activity_type === 'milestone_completed') icon = '✅';
        if (a.activity_type === 'rights_added') icon = '⚖️';
        
        return {
          id: a.id,
          title: a.description,
          time: formatDate(a.created_at),
          icon
        };
      });

      setItems(mapped.slice(0, 10)); // Show more items since it's full width
    } catch (e) {
      console.error("Activity fetch failed:", e);
      setItems([]);
    }
  }, [projectId, isDemoMode]);

  React.useEffect(() => {
    fetchActivity();
    window.addEventListener('payment-recorded', fetchActivity);
    return () => window.removeEventListener('payment-recorded', fetchActivity);
  }, [fetchActivity]);

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col relative">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-emerald-500/5 pointer-events-none" />
      <div className="p-6 border-b border-white/10 relative z-10 flex items-center justify-between">
        <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-emerald-400">Recent Activity</h2>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Live Updates</span>
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 relative z-10 custom-scrollbar">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-white/50">
             No recent activity found.
          </div>
        ) : (
          <div className="space-y-2">
            {items.map(i => {
              const parts = i.title.includes(' for ') ? i.title.split(' for ') : [i.title, null];
              return (
                <div key={i.id} className="flex items-center justify-between gap-6 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/5 transition-all group">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/10 to-teal-500/10 flex items-center justify-center border border-white/5 shadow-inner shrink-0 group-hover:scale-110 transition-transform">
                      <span className="text-xl">{i.icon}</span>
                    </div>
                    <div className="flex items-center gap-4 min-w-0">
                      <p className="text-[15px] font-black text-white whitespace-nowrap truncate">
                        {parts[0]}
                      </p>
                      {parts[1] && (
                        <span className="text-[10px] font-black text-indigo-400 truncate bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 uppercase tracking-widest">
                          {parts[1].replace('.', '')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-6 shrink-0">
                    <p className="text-[10px] font-mono text-gray-500 tracking-widest uppercase font-black">
                      {i.time}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivity;
