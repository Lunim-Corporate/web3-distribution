'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { dedupeJsonFetch } from '@/app/lib/requestCache';

const NavItem: React.FC<{ href: string; label: string; icon: string }> = ({ href, label, icon }) => {
  const pathname = usePathname();
  const active = pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
    >
      <span className="text-base">{icon}</span>
      <span>{label}</span>
    </Link>
  );
};

export const SidebarNav: React.FC = () => {
  const [counts, setCounts] = useState({ projects: 0, rights: 0, revenue: 0, milestones: 0 });
  useEffect(() => {
    Promise.all([
      fetch('/api/projects').then(r=>r.json()),
      fetch('/api/rights').then(r=>r.json()),
      dedupeJsonFetch('revenue:sidebar', '/api/revenue'),
      fetch('/api/milestones').then(r=>r.json()),
    ]).then(([projects, rights, revenue, milestones]) => {
      setCounts({
        projects: projects.length,
        rights: rights.length,
        revenue: revenue.length,
        milestones: milestones.length,
      });
    }).catch(()=>{});
  }, []);

  return (
    <aside className="hidden lg:block lg:col-span-2">
      <div className="sticky top-20 space-y-2">
        <div className="px-3 py-2 text-xs font-semibold tracking-wide text-gray-500">Overview</div>
        <NavItem href="/dashboard/rights" label={`Rights (${counts.rights})`} icon="⚖️" />
        <NavItem href="/dashboard/projects" label={`Revenue (${counts.revenue})`} icon="💸" />
        <NavItem
          href="/dashboard/projects#upcoming-milestones"
          label={`Milestones (${counts.milestones})`}
          icon="📅"
        />
        <NavItem href="/dashboard/contracts" label="Contracts" icon="⛓️" />
      </div>
    </aside>
  );
};

export default SidebarNav;


