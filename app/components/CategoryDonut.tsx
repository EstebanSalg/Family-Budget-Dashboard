'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#38bdf8', '#fb923c', '#a78bfa', '#f472b6', '#4ade80', '#facc15'];

export function CategoryDonut({ data }: { data: { category: string; spent: number }[] }) {
  const nonZero = data.filter((d) => d.spent > 0);
  return (
    <div>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={nonZero}
            dataKey="spent"
            nameKey="category"
            innerRadius={60}
            outerRadius={90}
            isAnimationActive={false}
          >
            {nonZero.map((entry, i) => (
              <Cell key={entry.category} fill={COLORS[i % COLORS.length]} stroke="none" />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
        </PieChart>
      </ResponsiveContainer>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
        {nonZero.map((entry, i) => (
          <li key={entry.category} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            {entry.category}
          </li>
        ))}
      </ul>
    </div>
  );
}
