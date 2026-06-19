"use client";

import React, { useState, useEffect, useMemo } from 'react';
// Card components unused in ChartsPanel
import { Line, Doughnut } from 'react-chartjs-2';
import { formatCurrency } from '@/lib/utils';
// formatCurrencyFromCentsGB unused in ChartsPanel
import { ETH_PRICE_USD } from '@/app/lib/constants';
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

const PROJECT_COLORS: Record<string, string> = {
  'Neon Requiem': '#ec4899', // Pink
  'The Salt Coast': '#6366f1', // Indigo
  'Glass Republic': '#f43f5e', // Rose
  'Dust & Dynasty': '#a855f7', // Purple
  'Binary Fault': '#06b6d4', // Cyan
  'Aether Drift': '#84cc16', // Lime
  'Solaris': '#eab308', // Yellow
  'Night Caster': '#f97316', // Orange
  'Deep State': '#ef4444', // Red
  'Lunar Gate': '#3b82f6', // Blue
};

const DEFAULT_COLORS = ['#6366f1','#a855f7','#ec4899','#f43f5e','#f97316','#eab308','#84cc16','#10b981','#06b6d4','#3b82f6'];

const getProjectColor = (name: string, index: number) => {
  return PROJECT_COLORS[name] || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
};

interface RevenueData {
  id: string;
  projectId: string;
  projectName: string;
  amount: number;
  source: string;
  date: string;
  status: string;
}

interface ChartsPanelProps {
  projectId?: string | null;
  isDemoMode?: boolean;
}

const ChartsPanel: React.FC<ChartsPanelProps> = ({ projectId, isDemoMode }) => {
  const [revenue, setRevenue] = useState<RevenueData[]>([]);
  const [timeframe, setTimeframe] = useState<'6'|'12'|'ytd'>('6');
  const [cumulative, setCumulative] = useState(false);

  const fetchRevenue = React.useCallback(() => {
    fetch(`/api/revenue?demo=${isDemoMode}&ts=${Date.now()}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(data => { setRevenue(Array.isArray(data) ? data : []); })
      .catch(() => { setRevenue([]); });
  }, [isDemoMode]);

  useEffect(() => {
    fetchRevenue();
    window.addEventListener('payment-recorded', fetchRevenue);
    return () => window.removeEventListener('payment-recorded', fetchRevenue);
  }, [fetchRevenue]);

  // Build month buckets by year-month key
  const { labels, trendData, projectedData, projectSegments } = useMemo(() => {
    // Filter revenue by project if needed
    // filteredRevenue unused — logic handled in loop below

    const monthly: Record<string, number> = {};
    const projectMap: Record<string, number> = {};
    const transactionsList: { label: string, value: number, id: string }[] = [];

    revenue.forEach((r: RevenueData) => {
      const d = new Date(r.date);
      if (isNaN(d.getTime())) return;
      
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      // Data in DB is ETH, convert to USD for chart consistency with Reports
      const amountUSD = Number(r.amount || 0) * ETH_PRICE_USD;
      
      // Trend data uses filtered revenue
      if (!projectId || projectId === 'all' || r.projectId === projectId) {
        monthly[key] = (monthly[key] || 0) + amountUSD;
      }

      // Project shares always use total revenue to calculate relative share
      const pName = r.projectName || 'Unknown Project';
      projectMap[pName] = (projectMap[pName] || 0) + amountUSD;
      
      // Transaction list for internal breakdown when a project is selected
      if (r.projectId === projectId) {
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        transactionsList.push({
          label: `Tx on ${dateStr}`,
          value: amountUSD,
          id: r.id
        });
      }
    });

    const now = new Date();
    const monthsCount = timeframe === '6' ? 6 : timeframe === '12' ? 12 : (now.getMonth() + 1);
    const lbls: string[] = [];
    const vals: number[] = [];
    const projVals: (number | null)[] = [];
    for (let i = monthsCount - 1; i >= -3; i--) {
      const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${dt.getFullYear()}-${dt.getMonth()}`;
      lbls.push(`${monthsNames[dt.getMonth()]} '${String(dt.getFullYear()).slice(-2)}`);
      if (i >= 0) {
        vals.push(monthly[key] || 0);
        projVals.push(i === 0 ? (monthly[key] || 0) : null);
      } else {
        vals.push(0);
        const average = vals.filter(v => v > 0).reduce((a, b) => a + b, 0) / (vals.filter(v => v > 0).length || 1);
        projVals.push(average * (1.1 ** Math.abs(i)));
      }
    }

    const hasRevenue = revenue && revenue.length > 0;
    const demo = [0,12000,8000,20000,4000,65000,5000,12000,25000,8000,15000,10000];
    
    // Only use demo fallback if explicitly in demo mode AND no data exists
    const shouldShowDemo = isDemoMode && (!hasRevenue || Object.keys(monthly).length === 0);
    const trimmed = shouldShowDemo ? demo.slice(-monthsCount) : vals.slice(0, monthsCount);
    const trend = cumulative ? trimmed.reduce((acc, v, i) => { acc.push((acc[i-1]||0) + v); return acc; }, [] as number[]) : trimmed;
    
    const displayTrend = [...trend, null, null, null];
    const displayProjected = projVals.map(v => v === undefined ? null : v);

    // Build segments for Donut
    let segments: { label: string, value: number, color: string }[] = [];

    if (!projectId || projectId === 'all') {
      // Global View: Share by Project
      const projects = Object.entries(projectMap).sort((a,b)=>b[1]-a[1]);
      segments = projects.slice(0, 9).map((p, i) => ({
        label: p[0],
        value: p[1],
        color: getProjectColor(p[0], i)
      }));
      const otherProj = projects.slice(9).reduce((sum, p) => sum + p[1], 0);
      if (otherProj > 0) segments.push({ label: 'Others', value: otherProj, color: '#94a3b8' });
    } else {
      // Project View: Individual Transactions for THIS project
      const activeProjectName = revenue.find(r => r.projectId === projectId)?.projectName || 'Project';
      const baseColor = getProjectColor(activeProjectName, 0);
      const sortedTxs = [...transactionsList].sort((a,b) => b.value - a.value);
      
      segments = sortedTxs.slice(0, 10).map((tx, i) => {
        // High contrast themed palette: Start with base color, then use distinct high-contrast colors
        const highContrastPalette = [
          baseColor,
          '#10b981', // Emerald
          '#3b82f6', // Blue
          '#f59e0b', // Amber
          '#8b5cf6', // Violet
          '#ef4444', // Red
          '#06b6d4', // Cyan
          '#f97316', // Orange
          '#ec4899', // Pink
          '#84cc16', // Lime
        ];
        return {
          label: tx.label,
          value: tx.value,
          color: highContrastPalette[i % highContrastPalette.length]
        };
      });

      const otherTxs = sortedTxs.slice(10).reduce((sum, tx) => sum + tx.value, 0);
      if (otherTxs > 0) segments.push({ label: 'Other Txs', value: otherTxs, color: `${baseColor}40` });
    }

    return { labels: lbls, trendData: displayTrend, projectedData: displayProjected, projectSegments: segments };
  }, [revenue, timeframe, cumulative, projectId, isDemoMode]);

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
                if (v === '6' || v === '12' || v === 'ytd') setTimeframe(v);
              }}
              className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/90 text-sm focus:ring-1 focus:ring-emerald-500 outline-none backdrop-blur-md"
            >
              <option value="6" className="bg-gray-900">Last 6 months</option>
              <option value="12" className="bg-gray-900">Last 12 months</option>
              <option value="ytd" className="bg-gray-900">Year to date</option>
            </select>
            <label className="ml-4 text-sm text-gray-400 flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
              <input type="checkbox" checked={cumulative} onChange={e=>setCumulative(e.target.checked)} className="accent-emerald-500 w-4 h-4 rounded bg-white/10 border-white/20"/>
              Cumulative Check
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
                      label: (ctx: unknown) => {
                        const c = ctx as { parsed?: { y?: number } | number };
                        const parsed = c.parsed;
                        const value =
                          typeof parsed === 'number'
                            ? parsed
                            : parsed && typeof parsed === 'object'
                              ? (parsed as { y?: number }).y ?? 0
                              : 0;
                        // BUG FIX #4: Use USD formatting for consistency
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
                    ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { family: 'ui-monospace, monospace' }, callback: (v: string | number) => formatCurrency(Number(v), 'USD') } 
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
            {(!projectId || projectId === 'all') ? 'Revenue Share by Project' : 'Transaction Distribution'}
          </h2>
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-center h-[350px] gap-8">
          <div className="w-full max-w-[350px] flex-shrink-0">
            <Doughnut
              data={{
                labels: projectSegments.map(s => s.label),
                datasets: [{ data: projectSegments.length ? projectSegments.map(s=>s.value) : [1], backgroundColor: projectSegments.length ? projectSegments.map(s=>s.color) : ['rgba(255,255,255,0.05)'], borderWidth: 0, hoverOffset: 4 }]
              }}
              options={{
                cutout: '65%',
                plugins: {
                  legend: { 
                    position: 'right' as const, 
                    labels: { 
                      color: 'rgba(255,255,255,0.7)', 
                      font: { family: 'ui-monospace, monospace', size: 12 }, 
                      padding: 15, 
                      usePointStyle: true,
                      boxWidth: 8
                    } 
                  },
                  tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                      label: (ctx: { label?: string; raw?: unknown }) => {
                        const rawValue = typeof ctx.raw === 'number' ? ctx.raw : 0;
                        const total = (ctx as any).dataset.data.reduce((a: number, b: number) => a + b, 0);
                        const percentage = ((rawValue / total) * 100).toFixed(1);
                        return ` ${ctx.label ?? 'Value'}: ${formatCurrency(rawValue, 'USD')} (${percentage}%)`;
                      },
                    },
                  },
                },
                responsive: true,
                maintainAspectRatio: false,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartsPanel;
export { ChartsPanel };
