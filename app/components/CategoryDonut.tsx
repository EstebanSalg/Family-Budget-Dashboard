'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#38bdf8', '#fb923c', '#a78bfa', '#f472b6', '#4ade80', '#facc15'];

export function CategoryDonut({ data }: { data: { category: string; spent: number }[] }) {
  const nonZero = data.filter((d) => d.spent > 0);
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={nonZero} dataKey="spent" nameKey="category" innerRadius={60} outerRadius={90}>
          {nonZero.map((entry, i) => (
            <Cell key={entry.category} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
      </PieChart>
    </ResponsiveContainer>
  );
}
