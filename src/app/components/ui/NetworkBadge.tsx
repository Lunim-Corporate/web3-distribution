'use client';

import React from 'react';
import { motion } from 'framer-motion';

type NetworkType = 'mainnet' | 'testnet' | 'localhost' | 'demo';

interface NetworkBadgeProps {
  /** Override the auto-detected network type */
  networkType?: NetworkType;
  /** Whether demo mode is active */
  isDemoMode?: boolean;
  /** Show compact version (icon only) */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID || '84532';

function detectNetwork(isDemoMode?: boolean): NetworkType {
  if (isDemoMode) return 'demo';
  switch (CHAIN_ID) {
    case '8453': return 'mainnet';
    case '31337': return 'localhost';
    case '84532':
    default: return 'testnet';
  }
}

const NETWORK_CONFIG: Record<NetworkType, {
  label: string;
  sublabel: string;
  color: string;
  bgColor: string;
  borderColor: string;
  pulseColor: string;
  icon: string;
}> = {
  mainnet: {
    label: 'MAINNET',
    sublabel: 'Base (Production)',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    pulseColor: 'bg-emerald-400',
    icon: '🟢',
  },
  testnet: {
    label: 'TESTNET',
    sublabel: 'Base Sepolia',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    pulseColor: 'bg-amber-400',
    icon: '🟡',
  },
  localhost: {
    label: 'LOCAL',
    sublabel: 'Hardhat (31337)',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    pulseColor: 'bg-blue-400',
    icon: '🔵',
  },
  demo: {
    label: 'DEMO',
    sublabel: 'Simulation Mode',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    pulseColor: 'bg-purple-400',
    icon: '🟣',
  },
};

export function NetworkBadge({ networkType, isDemoMode, compact, className = '' }: NetworkBadgeProps) {
  const network = networkType || detectNetwork(isDemoMode);
  const config = NETWORK_CONFIG[network];

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${config.bgColor} ${config.borderColor} border ${className}`}>
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.pulseColor} opacity-75`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${config.pulseColor}`} />
        </span>
        <span className={`text-[9px] font-black uppercase tracking-widest ${config.color}`}>
          {config.label}
        </span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl ${config.bgColor} ${config.borderColor} border backdrop-blur-lg ${className}`}
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.pulseColor} opacity-75`} />
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${config.pulseColor}`} />
      </span>
      <div>
        <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${config.color}`}>
          {config.label}
        </p>
        <p className="text-[10px] text-gray-400 font-medium">
          {config.sublabel}
        </p>
      </div>
    </motion.div>
  );
}
