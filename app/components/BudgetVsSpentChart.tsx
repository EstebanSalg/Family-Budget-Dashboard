'use client';

import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useRouter } from 'next/navigation';
import { getStatusColor } from '@/lib/statusColor';

type Row = { category: string; budget: number; spent: number; status: string };

export function BudgetVsSpentChart({ data }: { data: Row[] }) {
  const router = useRouter();
  // Fixed height crowded rows into invisible slivers once there were more
  // than ~7 categories -- size to the data instead, so every category gets
  // a readable bar regardless of how many exist.
  const height = Math.max(280, data.length * 40);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        onClick={(state) => {
          const label = state?.activeLabel;
          if (label) router.push(`/categories/${encodeURIComponent(label)}`);
        }}
      >
        <XAxis type="number" />
        <YAxis type="category" dataKey="category" width={170} tick={{ fontSize: 13 }} />
        <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
        <Bar dataKey="budget" fill="#334155" radius={[0, 6, 6, 0]} barSize={14} />
        <Bar dataKey="spent" isAnimationActive={false} radius={[0, 6, 6, 0]} barSize={14}>
          {data.map((entry) => (
            <Cell key={entry.category} fill={getStatusColor(entry.status)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
