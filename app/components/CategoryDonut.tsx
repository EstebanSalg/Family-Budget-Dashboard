'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

// Drawn from the Antigravity Finance design system's accent set (indigo,
// emerald, amber, cyan, rose, purple) plus two lighter tints to round out
// eight categories, instead of a bright chart-library rainbow.
const PALETTE = ['#6366F1', '#10B981', '#F59E0B', '#06B6D4', '#F43F5E', '#A855F7', '#818CF8', '#34D399'];

export function CategoryDonut({ data }: { data: { category: string; spent: number }[] }) {
  const nonZero = data.filter((d) => d.spent > 0);
  const total = nonZero.reduce((sum, d) => sum + d.spent, 0);

  return (
    <div>
      <div className="relative">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={nonZero}
              dataKey="spent"
              nameKey="category"
              innerRadius={60}
              outerRadius={88}
              paddingAngle={1}
              isAnimationActive={false}
            >
              {nonZero.map((entry, i) => (
                <Cell key={entry.category} fill={PALETTE[i % PALETTE.length]} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => `$${Number(value).toFixed(2)}`}
              contentStyle={{
                background: '#181B25',
                border: '1px solid #464554',
                borderRadius: 6,
                fontFamily: 'var(--font-jetbrains-mono)',
                fontSize: 12,
              }}
              itemStyle={{ color: '#DFE2EF' }}
              labelStyle={{ color: '#C7C4D7' }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-panel-inkMuted">Total</span>
          <span className="font-mono text-lg font-bold text-panel-ink">${total.toFixed(0)}</span>
        </div>
      </div>
      <ul className="mt-3 flex flex-col gap-1.5 text-xs text-panel-inkMuted">
        {nonZero.map((entry, i) => (
          <li key={entry.category} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
            <span className="flex-1 truncate">{entry.category}</span>
            <span className="font-mono text-panel-inkMuted">{total > 0 ? Math.round((entry.spent / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
