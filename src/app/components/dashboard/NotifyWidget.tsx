'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { formatDate } from '@/lib/utils';

type Notice = {
  id: string;
  type: 'rights' | 'milestone';
  title: string;
  subtitle?: string;
  date?: string;
  severity: 'info' | 'warning' | 'critical';
};

export const NotifyWidget: React.FC<{ resurfacingHours?: number }> = ({ resurfacingHours = 6 }) => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({});
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    const fetchNotices = async () => {
      try {
        const res = await fetch(`/api/notifications?userId=${user.id}`);
        const data = await res.json();
        const formatted = data.map((n: any) => ({
          id: n.id,
          type: n.type === 'revenue' ? 'milestone' : 'rights', 
          title: n.title,
          subtitle: n.message,
          severity: n.type === 'revenue' ? 'info' : 'warning',
          date: n.created_at
        }));
        setNotices(formatted);
        if (formatted.length > 0) setOpen(true);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };

    fetchNotices();
    const interval = setInterval(fetchNotices, 30000); 
    return () => clearInterval(interval);
  }, [user?.id]);


  if (!open || notices.every((n) => dismissed[n.id])) return null;

  return (
    <div className="fixed top-24 right-6 z-50 w-80 space-y-3">
      {notices.filter((n) => !dismissed[n.id]).map((n) => (
        <div
          key={n.id}
          className={`rounded-xl shadow-lg border p-4 backdrop-blur bg-white/90 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700`}
        >
          <div className="flex items-start justify-between">
            <div className="mr-3">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${
                  n.severity === 'critical' ? 'bg-red-500' : n.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                }`} />
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{n.title}</p>
              </div>
              {n.subtitle && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{n.subtitle}</p>
              )}
              {n.date && (
                <p className="text-xs text-gray-500 mt-1">Due {formatDate(n.date)}</p>
              )}
              <div className="mt-2 flex gap-2">
                {n.type === 'rights' ? (
                  <button
                    onClick={() => {
                      document.getElementById('rights-ledger')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900 dark:text-amber-200"
                  >
                    View rights
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      document.getElementById('upcoming-milestones')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200"
                  >
                    Open milestone
                  </button>
                )}
              </div>
            </div>
            <button
              onClick={() => setDismissed((prev) => ({ ...prev, [n.id]: true }))}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
      <div className="flex justify-end">
        <button
          onClick={() => {
            setOpen(false);
            try {
              localStorage.setItem('crt_notify_dismissed', JSON.stringify(dismissed));
              const until = Date.now() + resurfacingHours * 60 * 60 * 1000;
              localStorage.setItem('crt_notify_hidden_until', String(until));
            } catch {}
          }}
          className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          Hide notifications
        </button>
      </div>
    </div>
  );
};

export default NotifyWidget;


