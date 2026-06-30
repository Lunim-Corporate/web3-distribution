'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Holder {
  full_name: string;
  role: string;
  percentage: number;
  wallet_address: string;
}

interface TransactionFlowVisualizerProps {
  amount: number;
  holders: Holder[];
  isAnimating: boolean;
  onAnimationComplete?: () => void;
  senderAddress?: string;
  contractAddress?: string;
}

export function TransactionFlowVisualizer({
  amount,
  holders,
  isAnimating,
  onAnimationComplete,
  senderAddress = '0xf39F...2266',
  contractAddress = '0x5FbD...0aa3',
}: TransactionFlowVisualizerProps) {
  const [animationStep, setAnimationStep] = useState<'idle' | 'sender-to-contract' | 'contract-splitting' | 'contract-to-holders' | 'complete'>('idle');

  useEffect(() => {
    if (isAnimating) {
      setAnimationStep('sender-to-contract');
      
      // Step 1: Sender sends money to Contract (lasts 1.5s)
      const timer1 = setTimeout(() => {
        setAnimationStep('contract-splitting');
      }, 1500);

      // Step 2: Contract processes splits (lasts 1s)
      const timer2 = setTimeout(() => {
        setAnimationStep('contract-to-holders');
      }, 2500);

      // Step 3: Contract releases to holders (lasts 2.5s)
      const timer3 = setTimeout(() => {
        setAnimationStep('complete');
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      }, 5000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    } else {
      setAnimationStep('idle');
    }
  }, [isAnimating, onAnimationComplete]);

  // Dynamic coordinates or sizes
  const svgWidth = 800;
  const svgHeight = 400;
  
  const senderX = 80;
  const senderY = 200;
  
  const contractX = 350;
  const contractY = 200;
  
  const holderX = 680;
  
  // Calculate vertical positions for holders
  const getHolderY = (index: number, total: number) => {
    if (total <= 1) return 200;
    const spacing = Math.min(320 / (total - 1), 60);
    const startY = 200 - ((total - 1) * spacing) / 2;
    return startY + index * spacing;
  };

  const getPath = (x1: number, y1: number, x2: number, y2: number) => {
    // Generate curved path
    const controlX = (x1 + x2) / 2;
    return `M ${x1} ${y1} C ${controlX} ${y1}, ${controlX} ${y2}, ${x2} ${y2}`;
  };

  return (
    <div className="relative w-full overflow-hidden bg-slate-950/80 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
      <div className="absolute top-4 left-6 flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping" />
        <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Interactive Ledger Flow</span>
      </div>

      <div className="absolute top-4 right-6 text-xs font-mono text-slate-500">
        Status: <span className="text-indigo-400 font-bold capitalize">{animationStep.replace(/-/g, ' ')}</span>
      </div>

      <div className="w-full h-[400px] flex items-center justify-center">
        <svg 
          viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
          className="w-full h-full max-w-[800px] select-none"
        >
          {/* Defs for gradients, filters and markers */}
          <defs>
            <linearGradient id="flow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#22d3ee" stopOpacity="1" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0.8" />
            </linearGradient>
            
            <linearGradient id="connector-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#312e81" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#065f46" stopOpacity="0.2" />
            </linearGradient>

            <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background Connective Paths from Contract to Holders */}
          {holders.map((h, i) => {
            const hY = getHolderY(i, holders.length);
            return (
              <g key={`bg-path-${i}`}>
                <path
                  d={getPath(contractX, contractY, holderX, hY)}
                  fill="none"
                  stroke="url(#connector-gradient)"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
              </g>
            );
          })}

          {/* Path from Sender to Contract */}
          <path
            d={getPath(senderX, senderY, contractX, contractY)}
            fill="none"
            stroke="rgba(99, 102, 241, 0.15)"
            strokeWidth="3"
            strokeDasharray="4 4"
          />

          {/* Active Flow Path - Sender to Contract */}
          {animationStep === 'sender-to-contract' && (
            <g>
              <path
                d={getPath(senderX, senderY, contractX, contractY)}
                fill="none"
                stroke="url(#flow-gradient)"
                strokeWidth="4"
                filter="url(#neon-glow)"
                strokeDasharray="10 200"
                className="animate-[dash_1.5s_linear_infinite]"
                style={{
                  strokeDashoffset: -10,
                }}
              />
              {/* Pulsing particle */}
              <motion.circle
                cx={senderX}
                cy={senderY}
                r="8"
                fill="#818cf8"
                filter="url(#neon-glow)"
                animate={{
                  cx: [senderX, contractX],
                  cy: [senderY, contractY],
                  scale: [1, 1.2, 0.8],
                }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
            </g>
          )}

          {/* Active Flow Paths - Contract to Holders */}
          {animationStep === 'contract-to-holders' && (
            <g>
              {holders.map((h, i) => {
                const hY = getHolderY(i, holders.length);
                const shareAmount = (amount * h.percentage) / 100;
                
                return (
                  <g key={`flow-holder-${i}`}>
                    <path
                      d={getPath(contractX, contractY, holderX, hY)}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3"
                      filter="url(#neon-glow)"
                      strokeDasharray="8 100"
                      className="animate-[dash_2s_linear_infinite]"
                    />
                    
                    {/* Animated Fund Particles */}
                    <motion.circle
                      cx={contractX}
                      cy={contractY}
                      r={Math.max(4, Math.min(10, 4 + (h.percentage / 10)))}
                      fill="#34d399"
                      filter="url(#neon-glow)"
                      animate={{
                        cx: [contractX, holderX],
                        cy: [contractY, hY],
                        opacity: [1, 1, 0.8],
                      }}
                      transition={{ 
                        duration: 2, 
                        ease: "easeOut",
                        delay: i * 0.1 
                      }}
                    />

                    {/* Floating Amount Tag */}
                    <motion.g
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: [0, 1, 1, 0], y: [-5, -20, -25, -30] }}
                      transition={{ duration: 2.2, delay: i * 0.1 + 0.3 }}
                    >
                      <text
                        x={(contractX + holderX) / 2}
                        y={((contractY + hY) / 2)}
                        fill="#34d399"
                        fontSize="11"
                        fontFamily="monospace"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        +{shareAmount.toFixed(4)} ETH
                      </text>
                    </motion.g>
                  </g>
                );
              })}
            </g>
          )}

          {/* Node 1: Sender */}
          <g transform={`translate(${senderX}, ${senderY})`}>
            <circle 
              r="34" 
              fill="#1e1b4b" 
              stroke="#6366f1" 
              strokeWidth="2.5"
              className={animationStep === 'sender-to-contract' ? "animate-pulse" : ""}
            />
            <circle r="26" fill="#312e81" />
            <text
              y="-42"
              textAnchor="middle"
              fill="#e2e8f0"
              fontSize="12"
              fontWeight="bold"
            >
              Depositor
            </text>
            <text
              y="5"
              textAnchor="middle"
              fill="#818cf8"
              fontSize="14"
              fontWeight="black"
            >
              Ξ
            </text>
            <text
              y="50"
              textAnchor="middle"
              fill="#64748b"
              fontSize="10"
              fontFamily="monospace"
            >
              {senderAddress}
            </text>
          </g>

          {/* Node 2: Contract */}
          <g transform={`translate(${contractX}, ${contractY})`}>
            {/* Pulsing ring during processing */}
            {animationStep === 'contract-splitting' && (
              <circle
                r="50"
                fill="none"
                stroke="#22d3ee"
                strokeWidth="2"
                className="animate-ping"
              />
            )}
            <circle 
              r="40" 
              fill="#083344" 
              stroke={animationStep === 'contract-splitting' ? "#22d3ee" : "#0891b2"} 
              strokeWidth="3"
            />
            <circle r="32" fill="#0e7490" />
            <text
              y="-48"
              textAnchor="middle"
              fill="#e2e8f0"
              fontSize="12"
              fontWeight="bold"
            >
              LUNIM Contract
            </text>
            <text
              y="4"
              textAnchor="middle"
              fill="#22d3ee"
              fontSize="10"
              fontWeight="bold"
              fontFamily="sans-serif"
            >
              {animationStep === 'contract-splitting' ? 'SPLITTING' : 'LEDGER'}
            </text>
            <text
              y="58"
              textAnchor="middle"
              fill="#64748b"
              fontSize="10"
              fontFamily="monospace"
            >
              {contractAddress}
            </text>
          </g>

          {/* Nodes: Holders */}
          {holders.map((h, i) => {
            const hY = getHolderY(i, holders.length);
            const isTargeted = animationStep === 'contract-to-holders' || animationStep === 'complete';
            
            return (
              <g key={`holder-node-${i}`} transform={`translate(${holderX}, ${hY})`}>
                <motion.circle 
                  r="24" 
                  fill="#064e3b" 
                  stroke={isTargeted ? "#34d399" : "#065f46"} 
                  strokeWidth="2"
                  animate={isTargeted ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.3, delay: i * 0.1 }}
                />
                
                {/* Holder Initials / Label */}
                <text
                  y="4"
                  textAnchor="middle"
                  fill="#a7f3d0"
                  fontSize="11"
                  fontWeight="bold"
                >
                  {h.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </text>

                {/* Name, Role & Percentage to the right */}
                <text
                  x="34"
                  y="-4"
                  textAnchor="start"
                  fill="#f8fafc"
                  fontSize="11"
                  fontWeight="semibold"
                >
                  {h.full_name}
                </text>
                
                <text
                  x="34"
                  y="10"
                  textAnchor="start"
                  fill="#94a3b8"
                  fontSize="9"
                >
                  {h.role} ({h.percentage}%)
                </text>

                {/* Display balance impact when complete */}
                {animationStep === 'complete' && (
                  <motion.text
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    x="34"
                    y="22"
                    textAnchor="start"
                    fill="#34d399"
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    +{(amount * h.percentage / 100).toFixed(4)} ETH
                  </motion.text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <style jsx>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -200;
          }
        }
      `}</style>
    </div>
  );
}
