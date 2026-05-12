'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { mockMilestones, mockRights } from '@/data/mockData';
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
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({});
  const [open, setOpen] = useState(true);

  const notices = useMemo<Notice[]>(() => {
    const today = new Date();
    const soon = (d: string, days: number) => {
      const diff = (new Date(d).getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= days;
    };

    const rightsSoon = mockRights
      .filter((r) => soon(r.expirationDate, 30))
      .map<Notice>((r) => ({
        id: `right_${r.id}`,
        type: 'rights',
        title: `Rights expiring soon for ${r.projectName}`,
        subtitle: `${r.rightsType} • Owner: ${r.owner}`,
        date: r.expirationDate,
        severity: 'warning',
      }));

    const criticalMilestones = mockMilestones
      .filter((m) => m.priority === 'critical' || soon(m.date, 14))
      .map<Notice>((m) => ({
        id: `mile_${m.id}`,
        type: 'milestone',
        title: m.title,
        subtitle: m.description,
        date: m.date,
        severity: m.priority === 'critical' ? 'critical' : 'warning',
      }));

    return [...rightsSoon, ...criticalMilestones].slice(0, 3);
  }, []);

  useEffect(() => {
    if (notices.length === 0) setOpen(false);

    // Restore dismissal state and resurfacing
    try {
      const raw = localStorage.getItem('crt_notify_dismissed');
      if (raw) setDismissed(JSON.parse(raw));

      const hiddenUntil = localStorage.getItem('crt_notify_hidden_until');
      if (hiddenUntil && Date.now() < Number(hiddenUntil)) {
        setOpen(false);
      }
    } catch {}
  }, [notices.length]);

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


