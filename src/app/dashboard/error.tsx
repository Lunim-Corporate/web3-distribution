'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[DASHBOARD ERROR]:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] bg-transparent flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-2xl mb-6 text-amber-500 text-2xl">
          ⚡
        </div>
        
        <h2 className="text-xl font-bold text-white mb-2 tracking-tight">Dashboard Loading Interrupted</h2>
        <p className="text-xs text-gray-400 mb-6 leading-relaxed">
          The panel could not retrieve the on-chain registry or project details. Please retry or verify your Web3 provider settings.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all shadow-md shadow-indigo-500/10"
          >
            Reset Panel
          </button>
          
          <Link
            href="/"
            className="px-6 py-3 border border-white/10 hover:bg-white/5 text-gray-300 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
          >
            Back Home
          </Link>
        </div>

        {error.message && (
          <div className="mt-6 p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
            <p className="text-[10px] text-red-400 font-mono break-all">{error.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
