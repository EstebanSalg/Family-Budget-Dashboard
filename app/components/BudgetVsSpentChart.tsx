'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useRouter } from 'next/navigation';

type Row = { category: string; budget: number; spent: number };

export function BudgetVsSpentChart({ data }: { data: Row[] }) {
  const router = useRouter();
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={data}
        layout="vertical"
        onClick={(state) => {
          const label = state?.activeLabel;
          if (label) router.push(`/categories/${encodeURIComponent(label)}`);
        }}
      >
        <XAxis type="number" />
        <YAxis type="category" dataKey="category" width={120} />
        <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
        <Bar dataKey="budget" fill="#334155" />
        <Bar dataKey="spent" fill="#38bdf8" />
      </BarChart>
    </ResponsiveContainer>
  );
}
