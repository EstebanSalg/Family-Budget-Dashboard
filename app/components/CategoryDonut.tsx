'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

// Muted, cohesive palette (enamel-dial swatches) instead of a bright
// chart-library rainbow -- deliberately picked to hold up on both a near-
// black and a light background.
const PALETTE = ['#B4900F', '#3F8F86', '#B06A4A', '#5C7A96', '#7C8C4A', '#A0637A', '#8C6D9C', '#4F7A5E'];

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
                background: '#171F29',
                border: '1px solid #22303F',
                borderRadius: 6,
                fontFamily: 'var(--font-plex-mono)',
                fontSize: 12,
              }}
              itemStyle={{ color: '#ECF1F4' }}
              labelStyle={{ color: '#8C99A6' }}
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
