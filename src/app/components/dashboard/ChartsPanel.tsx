"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
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
}

const ChartsPanel: React.FC = () => {
  const [revenue, setRevenue] = useState<RevenueData[]>([]);
  const [timeframe, setTimeframe] = useState<'6'|'12'|'ytd'>('6');
  const [cumulative, setCumulative] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetch('/api/revenue')
      .then(r => r.json())
      .then(data => { if (mounted) setRevenue(Array.isArray(data) ? data : []); })
      .catch(() => { if (mounted) setRevenue([]); });
    return () => { mounted = false; };
  }, []);

  // Build month buckets by year-month key
  const { labels, trendData, projectedData, sourceSegments } = useMemo(() => {
    const monthly: Record<string, number> = {};
    const sourceMap: Record<string, number> = {};
    revenue.forEach((r: RevenueData) => {
      const d = new Date(r.date);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      monthly[key] = (monthly[key] || 0) + Number(r.amount || 0);
      const src = r.source || 'Direct Payment';
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

    // demo fallback when empty
    const hasRevenue = revenue && revenue.length > 0;
    const demo = [0,12000,8000,20000,4000,65000,5000,12000,25000,8000,15000,10000];
    const trimmed = hasRevenue ? vals.slice(0, monthsCount) : demo.slice(-monthsCount);
    const trend = cumulative ? trimmed.reduce((acc, v, i) => { acc.push((acc[i-1]||0) + v); return acc; }, [] as number[]) : trimmed;
    
    // Add projection paddings to trend array so it aligns with labels
    const displayTrend = [...trend, null, null, null];

    // top sources + other
    const colors = ['#06b6d4','#f59e0b','#84cc16','#8b5cf6','#ef4444','#3b82f6'];
    const sources = Object.entries(sourceMap).sort((a,b)=>b[1]-a[1]);
    const top = sources.slice(0,5).map((s,i)=>({ label: s[0], value: s[1], color: colors[i%colors.length] }));
    const otherTotal = sources.slice(5).reduce((s,a)=>s+a[1],0);
    if (otherTotal > 0) top.push({ label: 'Other', value: otherTotal, color: colors[top.length%colors.length] });

    return { labels: lbls, trendData: displayTrend, projectedData: projVals, sourceSegments: top };
  }, [revenue, timeframe, cumulative]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-4">
            <label className="text-sm text-gray-600">Timeframe:</label>
            <select
              value={timeframe}
              onChange={(e) => {
                const v = e.target.value;
                if (v === '6' || v === '12' || v === 'ytd') setTimeframe(v);
              }}
              className="px-2 py-1 rounded border bg-white dark:bg-gray-800"
            >
              <option value="6">Last 6 months</option>
              <option value="12">Last 12 months</option>
              <option value="ytd">Year to date</option>
            </select>
            <label className="ml-4 text-sm"><input type="checkbox" checked={cumulative} onChange={e=>setCumulative(e.target.checked)} className="mr-2"/>Cumulative</label>
          </div>

          <div style={{height:240}}>
            <Line
              data={{
                labels,
                datasets: [
                  {
                    label: 'Actual Revenue',
                    data: trendData,
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34,197,94,0.12)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                  },
                  {
                    label: 'Projected',
                    data: projectedData,
                    borderColor: '#f59e0b',
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.3,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                  }
                ],
              }}
              options={{
                plugins: {
                  legend: { display: false },
                  tooltip: {
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
                        return formatCurrency(Number(value) || 0);
                      },
                    },
                  },
                },
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: { 
                    grid: { display: false }, 
                    ticks: { maxRotation: 0, autoSkip: true, color: 'rgba(156, 163, 175, 1)' } 
                  },
                  y: { 
                    beginAtZero: true, 
                    grid: { color: 'rgba(156, 163, 175, 0.1)' },
                    ticks: { color: 'rgba(156, 163, 175, 1)', callback: (v: string | number) => formatCurrency(Number(v)) } 
                  },
                },
                elements: { line: { borderWidth: 2 }, point: { hitRadius: 8 } },
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Revenue by Source</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{height:240}}>
            <Doughnut
              data={{
                labels: sourceSegments.map(s => s.label),
                datasets: [{ data: sourceSegments.length ? sourceSegments.map(s=>s.value) : [1], backgroundColor: sourceSegments.length ? sourceSegments.map(s=>s.color) : ['#e5e7eb'], borderWidth: 0 }]
              }}
              options={{
                plugins: {
                  legend: { position: 'bottom' as const, labels: { boxWidth: 12 } },
                  tooltip: {
                    callbacks: {
                      label: (ctx: { label?: string; raw?: unknown }) => {
                        const rawValue = typeof ctx.raw === 'number' ? ctx.raw : 0;
                        return `${ctx.label ?? 'Value'}: ${formatCurrency(rawValue)}`;
                      },
                    },
                  },
                },
                responsive: true,
                maintainAspectRatio: false,
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChartsPanel;
export { ChartsPanel };
