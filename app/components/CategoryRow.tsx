'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { CategoryBudget } from '@/lib/sheets/budgets';
import { getStatusColor, getStatusLabel } from '@/lib/statusColor';
import { MiniSparkline } from './MiniSparkline';

type Trend = { month: string; total: number }[];

export function CategoryRow({ row, trend }: { row: CategoryBudget; trend: Trend }) {
  const [budget, setBudget] = useState(row.budget);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(newValue: number) {
    const previous = budget;
    setBudget(newValue);
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/categories/${encodeURIComponent(row.category)}/budget`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ budget: newValue }),
      });
      if (!res.ok) throw new Error('save failed');
    } catch {
      setBudget(previous);
      setError('Could not save — reverted.');
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }

  const statusColor = getStatusColor(row.status);
  const statusLabel = getStatusLabel(row.status);
  // The track always represents 0-100% of budget in the first TRACK_SPLIT% of
  // its own width, leaving the rest as a contained "over budget" zone -- so the
  // hatched overflow can never bleed past the row's own width (no more horizontal
  // page scroll when a category is far over budget).
  const TRACK_SPLIT = 82;
  const fillPct = (Math.min(row.percentUsed, 100) / 100) * TRACK_SPLIT;
  const overflowPct = (Math.min(Math.max(row.percentUsed - 100, 0), 100) / 100) * (100 - TRACK_SPLIT);

  return (
    <div className="border-b border-panel-line py-3 last:border-none">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <Link
          href={`/categories/${encodeURIComponent(row.category)}`}
          className="flex items-center gap-2 font-semibold text-panel-ink transition-colors hover:text-brass"
        >
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: statusColor }} />
          {row.category}
        </Link>
        <div className="flex items-center gap-5 font-mono text-[13px]">
          <span className="w-20 text-right text-panel-ink">${row.spent.toFixed(2)}</span>
          {editing ? (
            <input
              autoFocus
              type="number"
              defaultValue={budget}
              disabled={saving}
              onBlur={(e) => save(Number(e.target.value))}
              className="w-24 rounded border border-panel-line bg-panel-surface2 px-2 py-1 text-panel-ink"
            />
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="w-24 text-right text-panel-inkMuted underline decoration-dotted decoration-panel-line underline-offset-2 hover:text-brass"
            >
              ${budget.toFixed(2)}
            </button>
          )}
          <span className="w-14 whitespace-nowrap text-right text-panel-inkMuted">{row.percentUsed.toFixed(0)}%</span>
          <span
            className="w-[70px] rounded-full py-0.5 text-center text-[9.5px] font-bold uppercase tracking-[0.05em]"
            style={{ color: statusColor, backgroundColor: `${statusColor}22` }}
          >
            {statusLabel}
          </span>
          <MiniSparkline data={trend} color={statusColor} />
          {error && <span className="text-[#EE8478]">{error}</span>}
        </div>
      </div>
      <div className="relative mt-2.5 h-1.5 w-full">
        <div className="absolute inset-0 overflow-hidden rounded-full">
          <div
            className="absolute inset-0 bg-panel-surface2"
            style={{ backgroundImage: 'repeating-linear-gradient(90deg, #22303F 0 1px, transparent 1px 12.5%)' }}
          />
          <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${fillPct}%`, backgroundColor: statusColor }} />
          {overflowPct > 0 && (
            <div
              className="absolute inset-y-0 rounded-r-full"
              style={{
                left: `${TRACK_SPLIT}%`,
                width: `${overflowPct}%`,
                backgroundImage: 'repeating-linear-gradient(45deg, #EE8478 0 3px, transparent 3px 6px)',
              }}
            />
          )}
        </div>
        <div className="absolute -inset-y-1 w-0.5 bg-brass" style={{ left: `${TRACK_SPLIT}%` }} />
      </div>
    </div>
  );
}
