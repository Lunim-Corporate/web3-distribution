'use client';

import React from 'react';
import { formatDate } from '@/lib/utils';

interface ActivityItem {
  id: string;
  title: string;
  time: string;
  icon: string;
}



interface RecentActivityProps {
  isDemoMode?: boolean;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ isDemoMode }) => {
  const [items, setItems] = React.useState<ActivityItem[]>([]);
  const fetchActivity = React.useCallback(async () => {
    try {
      const ts = Date.now();
      const isDemoMode = localStorage.getItem('demo_mode') === 'true';
      const res = await fetch(`/api/activities?ts=${ts}&demo=${isDemoMode}`, { cache: 'no-store' });
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

      setItems(mapped.slice(0, 8));
    } catch (e) {
      console.error("Activity fetch failed:", e);
      setItems([]);
    }
  }, []);

  React.useEffect(() => {
    fetchActivity();
    window.addEventListener('payment-recorded', fetchActivity);
    
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('lunim-realtime');
      bc.onmessage = (ev) => {
        if (ev.data?.type === 'payment-recorded') fetchActivity();
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported');
    }

    return () => {
      window.removeEventListener('payment-recorded', fetchActivity);
      if (bc) bc.close();
    };
  }, [fetchActivity, isDemoMode]);
  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col h-full relative">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-emerald-500/5 pointer-events-none" />
      <div className="p-6 border-b border-white/10 relative z-10 flex items-center justify-between">
        <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-emerald-400">Recent Activity</h2>
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
      </div>
      <div className="flex-1 overflow-y-auto p-2 relative z-10 custom-scrollbar" style={{maxHeight:'400px'}}>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-white/50">
             No recent activity
          </div>
        ) : (
          <div className="space-y-1">
            {items.map(i => (
              <div key={i.id} className="flex items-start gap-4 p-3 rounded-2xl hover:bg-white/5 transition-all group">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/10 to-teal-500/10 flex items-center justify-center border border-white/5 shadow-inner group-hover:scale-110 transition-transform">
                  <span className="text-xl">{i.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-300 group-hover:text-white transition-colors">{i.title}</p>
                  <p className="text-[11px] font-mono text-gray-500 tracking-wide mt-0.5">{i.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivity;


