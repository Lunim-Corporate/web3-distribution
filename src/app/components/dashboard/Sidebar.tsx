'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';

const NAV_ITEMS = [
  { href: '/dashboard/admin', label: 'Overview', icon: '📊' },
  { href: '/dashboard/admin/projects', label: 'Projects', icon: '📁' },
  { href: '/dashboard/admin/roster', label: 'Roster', icon: '👥' },
  { href: '/dashboard/admin/settings', label: 'Settings', icon: '⚙️' },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 h-[calc(100vh-64px)] sticky top-16 bg-[#0B0C10] border-r border-white/5 flex flex-col pt-8 pb-8 px-4">
      {/* Brand Section */}
      <div className="px-4 mb-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-lg shadow-lg">
            💎
          </div>
          <span className="text-lg font-black text-white tracking-tight">Moonstone</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none">Admin Panel</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div className="relative group px-1">
                <motion.div 
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer relative z-10 ${
                    isActive ? 'text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="activePill"
                      className="absolute inset-0 bg-white/5 border border-white/10 rounded-xl z-[-1] shadow-[0_4px_24px_rgba(99,102,241,0.1)]"
                      transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
                    />
                  )}
                  <span className={`text-xl transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110 opacity-70 group-hover:opacity-100'}`}>
                    {item.icon}
                  </span>
                  <span className={`text-sm tracking-tight transition-all duration-300 ${isActive ? 'font-black' : 'font-bold'}`}>
                    {item.label}
                  </span>
                  
                  {isActive && (
                    <motion.div 
                      layoutId="activeIndicator"
                      className="absolute left-0 w-1 h-5 bg-indigo-500 rounded-full"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </motion.div>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Area */}
      <div className="pt-6 border-t border-white/5 space-y-4">
        <div className="px-4">
          <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Connected as</p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center border border-white/10">
              <span className="text-xs uppercase font-bold text-gray-400">{user?.name?.charAt(0) || user?.email?.charAt(0)}</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.name || user?.email?.split('@')[0]}</p>
              <p className="text-[10px] font-medium text-gray-500 truncate">{user?.role}</p>
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:text-rose-400 hover:bg-rose-500/5 transition-all font-bold text-sm"
        >
          <span className="text-xl">🚪</span>
          Logout
        </button>
      </div>
    </aside>
  );
};
