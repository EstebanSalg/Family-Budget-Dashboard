'use client';

import Link from 'next/link';
import { getStatusColor } from '@/lib/statusColor';

type Row = { category: string; budget: number; spent: number; status: string };

// Hand-rolled instead of a Recharts bar: each row needs its own percentage
// scale (track = 100% of that category's own budget) plus a fixed brass tick
// marking the budget line and a hatched overflow past it when over -- a
// shared-axis bar chart can't produce a per-row "redline" like this.
export function BudgetVsSpentChart({ data }: { data: Row[] }) {
  return (
    <div className="flex flex-col gap-3.5">
      {data.map((row) => {
        const pct = row.budget > 0 ? (row.spent / row.budget) * 100 : row.spent > 0 ? 100 : 0;
        // The track always represents 0-100% of budget in the first TRACK_SPLIT% of
        // its own width, leaving the rest as a contained "over budget" zone -- so the
        // hatched overflow can never bleed past the track into the numbers column.
        const TRACK_SPLIT = 82;
        const fillPct = (Math.min(pct, 100) / 100) * TRACK_SPLIT;
        const overflowPct = (Math.min(Math.max(pct - 100, 0), 100) / 100) * (100 - TRACK_SPLIT);
        const color = getStatusColor(row.status);

        return (
          <Link
            key={row.category}
            href={`/categories/${encodeURIComponent(row.category)}`}
            className="grid grid-cols-[minmax(0,124px)_1fr_96px] items-center gap-3 rounded px-1 py-1 transition-colors hover:bg-panel-surface2"
          >
            <span className="truncate text-[13px] font-semibold text-panel-ink">{row.category}</span>

            <span className="relative block h-4">
              <span className="absolute inset-0 overflow-hidden rounded-[3px]">
                <span
                  className="absolute inset-0 bg-panel-surface2"
                  style={{ backgroundImage: 'repeating-linear-gradient(90deg, #22303F 0 1px, transparent 1px 12.5%)' }}
                />
                <span
                  className="absolute inset-y-0.5 left-0 rounded-[2px]"
                  style={{ width: `${fillPct}%`, backgroundColor: color }}
                />
                {overflowPct > 0 && (
                  <span
                    className="absolute inset-y-0.5 rounded-r-[2px]"
                    style={{
                      left: `${TRACK_SPLIT}%`,
                      width: `${overflowPct}%`,
                      backgroundImage: 'repeating-linear-gradient(45deg, #EE8478 0 3px, transparent 3px 6px)',
                    }}
                  />
                )}
              </span>
              <span className="absolute -inset-y-1 w-0.5 bg-brass" style={{ left: `${TRACK_SPLIT}%` }} />
            </span>

            <span className="text-right font-mono text-[11px] text-panel-inkMuted">
              <b className="block text-[13px] font-semibold text-panel-ink">${row.spent.toFixed(2)}</b>
              of ${row.budget.toFixed(2)}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
