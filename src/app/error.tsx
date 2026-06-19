'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GLOBAL ERROR]:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col items-center justify-center p-6 font-sans selection:bg-blue-500/30">
      <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[70%] h-[70%] bg-purple-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md bg-slate-900/40 backdrop-blur-2xl border border-slate-800/80 rounded-3xl p-8 sm:p-10 shadow-[0_0_50px_rgba(0,0,0,0.6)] text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl mb-6 text-red-500 text-3xl">
          ⚠️
        </div>
        
        <h2 className="text-2xl font-black text-white mb-3 tracking-tight">System Encountered an Error</h2>
        <p className="text-sm text-slate-400 mb-8 leading-relaxed">
          Something went wrong during execution. Our decentralized sync engine is safe, but we need to reset the client state.
        </p>

        <div className="space-y-4">
          <button
            onClick={() => reset()}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-500/20"
          >
            Retry Connection
          </button>
          
          <Link
            href="/dashboard"
            className="block w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-4 rounded-xl transition-all border border-slate-700/50"
          >
            Go to Dashboard
          </Link>
        </div>

        <p className="text-[10px] text-slate-600 font-mono mt-8 uppercase tracking-widest">
          ERROR DIGEST: {error.digest || 'N/A'}
        </p>
      </div>
    </div>
  );
}
