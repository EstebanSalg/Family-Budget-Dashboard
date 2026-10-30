'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const AXIS = { fill: '#94A3B8', fontSize: 12 };

export function CategoryTrendChart({ data }: { data: { month: string; total: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
        <CartesianGrid stroke="#1E293B" vertical={false} />
        <XAxis dataKey="month" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} />
        <Tooltip
          formatter={(value) => `$${Number(value).toFixed(2)}`}
          contentStyle={{ background: '#0E1524', border: '1px solid #1E293B', borderRadius: 12, color: '#F1F5F9' }}
          labelStyle={{ color: '#94A3B8' }}
          cursor={{ stroke: '#334155' }}
        />
        <Line
          type="monotone"
          dataKey="total"
          stroke="#6366F1"
          strokeWidth={2.5}
          dot={{ r: 3.5, fill: '#6366F1', strokeWidth: 0 }}
          activeDot={{ r: 5, fill: '#60A5FA', strokeWidth: 0 }}
          style={{ filter: 'drop-shadow(0 0 6px rgba(99,102,241,0.6))' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
