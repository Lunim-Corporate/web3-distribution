"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import { formatCurrency } from '@/lib/utils';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend);

const monthsNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

interface RevenueData {
  id: string;
  projectId: string;
  projectName: string;
  amount: number;
  source: string;
  date: string;
  status: string;
  txHash?: string;
}

interface ChartsPanelProps {
  walletAddress?: string;
  projectId?: string | null;
}

const ChartsPanel: React.FC<ChartsPanelProps> = ({ walletAddress, projectId }) => {
  const [revenue, setRevenue] = useState<RevenueData[]>([]);
  const [timeframe, setTimeframe] = useState<'6'|'12'|'ytd'>('6');
  const [cumulative, setCumulative] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsDemoMode(localStorage.getItem('demo_mode') === 'true');
    }
    const onDemoChanged = () => {
      setIsDemoMode(localStorage.getItem('demo_mode') === 'true');
    };
    window.addEventListener('demo-mode-changed', onDemoChanged);
    return () => window.removeEventListener('demo-mode-changed', onDemoChanged);
  }, []);

  const fetchRevenue = React.useCallback(() => {
    const url = new URL('/api/revenue', window.location.origin);
    url.searchParams.set('ts', Date.now().toString());
    const mode = isDemoMode ? 'demo' : 'live';
    url.searchParams.set('mode', mode);
    
    if (walletAddress) {
      url.searchParams.set('address', walletAddress);
    }
    if (projectId) {
      url.searchParams.set('projectId', projectId);
    }

    fetch(url.toString(), { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        const items = data.revenue ? data.revenue : (Array.isArray(data) ? data : []);
        setRevenue(items);
      })
      .catch(() => { setRevenue([]); });
  }, [walletAddress, projectId, isDemoMode]);

  useEffect(() => {
    fetchRevenue();
    window.addEventListener('payment-recorded', fetchRevenue);
    return () => window.removeEventListener('payment-recorded', fetchRevenue);
  }, [fetchRevenue]);

  // Build month buckets by year-month key
  const { labels, trendData, projectedData, sourceSegments } = useMemo(() => {
    const monthly: Record<string, number> = {};
    const sourceMap: Record<string, number> = {};
    revenue.forEach((r: RevenueData) => {
      const d = new Date(r.date);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      monthly[key] = (monthly[key] || 0) + Number(r.amount || 0);
      
      let src = '';
      if (!projectId || projectId === 'all') {
        src = r.projectName || 'Unknown Project';
      } else {
        // If specific project selected, show breakdown by individual transactions
        // Format: "Tx: [hash] ([date])"
        const dateStr = new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const shortHash = r.txHash ? `${r.txHash.slice(0, 6)}...` : 'Manual';
        src = `Tx: ${shortHash} (${dateStr})`;
      }
      sourceMap[src] = (sourceMap[src] || 0) + Number(r.amount || 0);
    });

    const now = new Date();
    const monthsCount = timeframe === '6' ? 6 : timeframe === '12' ? 12 : (now.getMonth() + 1);
    const lbls: string[] = [];
    const vals: number[] = [];
    const projVals: (number | null)[] = [];
    for (let i = monthsCount - 1; i >= -3; i--) { // Project 3 months into future
      const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${dt.getFullYear()}-${dt.getMonth()}`;
      lbls.push(`${monthsNames[dt.getMonth()]} '${String(dt.getFullYear()).slice(-2)}`);
      if (i >= 0) {
        vals.push(monthly[key] || 0);
        projVals.push(i === 0 ? (monthly[key] || 0) : null); // Connect last point to projection
      } else {
        vals.push(0); // Fill empty spaces for array parity
        const average = vals.filter(v => v > 0).reduce((a, b) => a + b, 0) / (vals.filter(v => v > 0).length || 1);
        projVals.push(average * (1.1 ** Math.abs(i))); // Assume 10% month-over-month growth for projection
      }
    }

    const trimmed = vals.slice(0, monthsCount);
    const trend = cumulative ? trimmed.reduce((acc, v, i) => { acc.push((acc[i-1]||0) + v); return acc; }, [] as number[]) : trimmed;
    
    const displayTrend = [...trend, null, null, null];
    const displayProjected = projVals.map(v => v === undefined ? null : v);

    // Helper to get consistent color for a name
    const getThemeColor = (name: string, index: number) => {
      const palette = [
        '#FF3366', // Vibrant Rose/Red
        '#00D2FF', // Electric Blue/Cyan
        '#FF9900', // Bright Orange
        '#00FF99', // Neon Green
        '#9D00FF', // Deep Purple
        '#FFE600', // Yellow
        '#FF0099', // Hot Pink
        '#0066FF', // Royal Blue
        '#CCFF00', // Lime
        '#FF3300', // Bright Red
        '#00FFCC', // Turquoise
        '#6600FF', // Indigo
      ];
      
      // Use index directly to guarantee distinct colors for consecutive segments
      return palette[index % palette.length];
    };

    const segments = Object.entries(sourceMap)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value], i) => ({
        label,
        value,
        color: getThemeColor(label, i)
      }));

    const topSegments = segments.slice(0, 6);
    const otherTotal = segments.slice(6).reduce((sum, s) => sum + s.value, 0);
    if (otherTotal > 0) {
      topSegments.push({ label: 'Other', value: otherTotal, color: '#64748b' });
    }
    if (topSegments.length === 0) {
      topSegments.push({ label: 'No Data', value: 1, color: '#374151' });
    }

    return { labels: lbls, trendData: displayTrend, projectedData: displayProjected, sourceSegments: topSegments };
  }, [revenue, timeframe, cumulative, projectId]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
        <div className="mb-4 relative z-10">
          <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-400">Revenue Trends</h2>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <select
              value={timeframe}
              onChange={(e) => {
                const v = e.target.value;
                if (v === '6' || v === '12' || v === 'ytd') setTimeframe(v as any);
              }}
              className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/90 text-sm focus:ring-1 focus:ring-emerald-500 outline-none backdrop-blur-md"
            >
              <option value="6" className="bg-gray-900">Last 6 months</option>
              <option value="12" className="bg-gray-900">Last 12 months</option>
              <option value="ytd" className="bg-gray-900">Year to date</option>
            </select>
            <label className="ml-4 text-sm text-gray-400 flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
              <input type="checkbox" checked={cumulative} onChange={e=>setCumulative(e.target.checked)} className="accent-emerald-500 w-4 h-4 rounded bg-white/10 border-white/20"/>
              Cumulative
            </label>
          </div>

          <div style={{height:280}}>
            <Line
              data={{
                labels,
                datasets: [
                  {
                    label: 'Actual Revenue',
                    data: trendData,
                    borderColor: '#34d399',
                    backgroundColor: 'rgba(52, 211, 153, 0.15)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#10b981',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                  },
                  {
                    label: 'Projected',
                    data: projectedData,
                    borderColor: '#f59e0b',
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                  }
                ],
              }}
              options={{
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#e2e8f0',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                      label: (ctx: any) => {
                        const value = ctx.parsed.y ?? 0;
                        return formatCurrency(Number(value) || 0, 'USD');
                      },
                    },
                  },
                },
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: { 
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }, 
                    ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { family: 'ui-monospace, monospace' } } 
                  },
                  y: { 
                    beginAtZero: true, 
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { family: 'ui-monospace, monospace' }, callback: (v: any) => formatCurrency(Number(v), 'USD') } 
                  },
                },
                elements: { line: { borderWidth: 3 }, point: { hitRadius: 10 } },
              }}
            />
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-fuchsia-500/5 pointer-events-none" />
        <div className="mb-6 relative z-10">
          <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-400">
            {(!projectId || projectId === 'all') ? 'Project Distribution' : 'Revenue Sources'}
          </h2>
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-6 min-h-[300px]">
          <div className="w-[180px] h-[180px] shrink-0">
            <Doughnut
              data={{
                labels: sourceSegments.map(s => s.label),
                datasets: [{ 
                  data: sourceSegments.length ? sourceSegments.map(s=>s.value) : [1], 
                  backgroundColor: sourceSegments.length ? sourceSegments.map(s=>s.color) : ['rgba(255,255,255,0.05)'], 
                  borderWidth: 0, 
                  hoverOffset: 8,
                  spacing: 2
                }]
              }}
              options={{
                cutout: '70%',
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    padding: 12,
                    titleFont: { size: 13, weight: 'bold' },
                    bodyFont: { size: 13 },
                    callbacks: {
                      label: (ctx: any) => {
                        const rawValue = typeof ctx.raw === 'number' ? ctx.raw : 0;
                        const total = ctx.dataset.data.reduce((a: number, b: number) => a + b, 0);
                        const percentage = ((rawValue / total) * 100).toFixed(1);
                        return ` ${ctx.label ?? 'Value'}: ${formatCurrency(rawValue, 'USD')} (${percentage}%)`;
                      },
                    },
                  },
                },
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                  padding: 2
                }
              }}
            />
          </div>

          <div className="flex-1 w-full grid grid-cols-2 gap-3 pl-0 sm:pl-4">
            {sourceSegments.map((segment, idx) => {
              const total = sourceSegments.reduce((sum, s) => sum + s.value, 0);
              const pct = total > 0 ? ((segment.value / total) * 100).toFixed(1) : '0';
              return (
                <div key={idx} className="flex items-center gap-2.5 p-2 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-200">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: segment.color }} />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-white truncate">{segment.label}</span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {formatCurrency(segment.value, 'USD')} ({pct}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartsPanel;
export { ChartsPanel };
