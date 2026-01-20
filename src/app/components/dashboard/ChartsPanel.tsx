"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Line, Doughnut } from 'react-chartjs-2';
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

const LineChart: React.FC<{ data: number[] }> = ({ data }) => {
  const max = Math.max(...data, 1);
  const points = data.map((v, i) => `${(i / (data.length - 1)) * 100},${100 - (v / max) * 100}`).join(' ');
  return (
    <svg viewBox="0 0 100 100" className="w-full h-60" role="img" aria-label="Revenue trend line chart"> 
      <polyline fill="none" stroke="#22c55e" strokeWidth="2" points={points} />
      {data.map((v, i) => (
        <g key={i}>
          <circle cx={(i / (data.length - 1)) * 100} cy={100 - (v / max) * 100} r="1.5" fill="#22c55e">
            <title>${v.toLocaleString()}</title>
          </circle>
        </g>
      ))}
    </svg>
  );
};

const DonutChart: React.FC<{ segments: { label: string; value: number; color: string }[] }> = ({ segments }) => {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let offset = 25; // start at top
  return (
    <svg viewBox="0 0 36 36" className="w-full h-60"> 
      {segments.map((s, idx) => {
        const frac = s.value / total;
        const dash = 100 * frac;
        const circle = (
          <circle
            key={idx}
            cx="18"
            cy="18"
            r="15.9155"
            fill="transparent"
            stroke={s.color}
            strokeWidth="4"
            strokeDasharray={`${dash} ${100 - dash}`}
            strokeDashoffset={offset}
            >
            <title>{`${s.label}: $${s.value.toLocaleString()}`}</title>
          </circle>
        );
        offset -= dash;
        return circle;
      })}
      <circle cx="18" cy="18" r="10" fill="white" className="dark:fill-gray-900" />
    </svg>
  );
};

export const ChartsPanel: React.FC = () => {
  const [revenue, setRevenue] = React.useState<any[]>([]);
  React.useEffect(()=>{ fetch('/api/revenue').then(r=>r.json()).then(setRevenue).catch(()=>setRevenue([])); },[]);

  // Aggregate monthly
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const byMonth: number[] = Array(12).fill(0);
  revenue.forEach((r:any)=>{ const d = new Date(r.date); byMonth[d.getMonth()] += r.amount; });
  const trimmed = byMonth.slice(0, Math.max(new Date().getMonth()+1, 6));

  // Aggregate by source
  const sourceMap: Record<string, number> = {};
  revenue.forEach((r:any)=>{ sourceMap[r.source] = (sourceMap[r.source]||0) + r.amount; });
  const sourceSegments = Object.entries(sourceMap).map(([label,value],i)=>({ label, value, color: ['#06b6d4','#f59e0b','#84cc16','#8b5cf6','#ef4444'][i%5] }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <Line
            data={{
              labels: months.slice(0, trimmed.length),
              datasets: [{
                label: 'Revenue',
                data: trimmed,
                borderColor: '#22c55e',
                backgroundColor: 'rgba(34,197,94,0.2)',
                fill: true,
                tension: 0.3,
              }],
            }}
            options={{ plugins: { legend: { display: false } }, responsive: true, maintainAspectRatio: false }}
            height={240}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Source</CardTitle>
        </CardHeader>
        <CardContent>
          <Doughnut
            data={{
              labels: sourceSegments.map(s=>s.label),
              datasets: [{
                data: sourceSegments.length ? sourceSegments.map(s=>s.value) : [1],
                backgroundColor: sourceSegments.length ? sourceSegments.map(s=>s.color) : ['#e5e7eb'],
                borderWidth: 0,
              }],
            }}
            options={{ plugins: { legend: { position: 'bottom' as const } }, responsive: true, maintainAspectRatio: false }}
            height={240}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ChartsPanel;


