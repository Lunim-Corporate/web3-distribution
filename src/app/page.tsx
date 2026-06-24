"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { motion } from "framer-motion";

export default function HomePage() {
  const { user, isAuthHydrated } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (isAuthHydrated && user) {
      router.push('/dashboard');
    }
  }, [isAuthHydrated, user, router]);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 overflow-hidden selection:bg-blue-500/30 font-sans">
      
      {/* ── BACKGROUND MESH ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#020617] z-10" />
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -right-[10%] w-[60vw] h-[60vw] bg-cyan-600/20 rounded-full blur-[140px] mix-blend-screen"
        />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute -bottom-[10%] -left-[10%] w-[50vw] h-[50vw] bg-blue-600/20 rounded-full blur-[140px] mix-blend-screen"
        />
        <div className="absolute inset-0 bg-[url('/textures/stardust.png')] opacity-[0.05] z-20 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#020617]/70 to-[#020617] z-30" />
      </div>

      {/* ── HERO SECTION ── */}
      <main className="relative z-40 min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 1, delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/40 border border-slate-700/50 backdrop-blur-md mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">Live Network Sync</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[1.05]">
            <span className="text-slate-100">
              The Standard For
            </span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 animate-gradient-x">
              Creative Rights.
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-400 font-light max-w-2xl mx-auto mb-12 leading-relaxed">
            Distribute cinematic revenues instantly via smart contracts. Unmatched transparency for <strong className="text-white font-medium">HBO</strong> productions and creative royalties.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <Link href="/dashboard">
                <button className="group relative px-8 py-4 bg-slate-100 rounded-full font-bold text-slate-900 shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-[0_0_50px_rgba(255,255,255,0.3)] transition-all overflow-hidden flex items-center gap-3">
                  <div className="absolute inset-0 bg-blue-100 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  <span className="relative z-10">Access Dashboard</span>
                  <svg className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </button>
              </Link>
            ) : (
              <Link href="/login">
                <button className="group relative px-8 py-4 bg-slate-100 text-slate-900 rounded-full font-bold shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-[0_0_50px_rgba(255,255,255,0.3)] transition-all overflow-hidden flex items-center gap-3">
                  <div className="absolute inset-0 bg-blue-100 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  <span className="relative z-10">Enter LUNIM</span>
                  <svg className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </button>
              </Link>
            )}
          </div>
        </motion.div>
      </main>

      {/* ── FOOTER STATS ── */}
      <div className="absolute bottom-0 left-0 right-0 p-8 z-40 hidden md:flex items-center justify-between border-t border-slate-800/50 bg-[#020617]/50 backdrop-blur-md">
        <div className="flex gap-12">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Network</p>
            <p className="text-sm text-slate-200 font-mono">Ethereum Mainnet (Simulated)</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Status</p>
            <p className="text-sm text-emerald-400 font-mono flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Operational
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}