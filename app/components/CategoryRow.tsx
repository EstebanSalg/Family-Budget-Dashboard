'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { CategoryBudget } from '@/lib/sheets/budgets';
import { getRatioStatus, STATUS_COLORS } from '@/lib/statusColor';
import { CHIP_CLASS, DOT_CLASS, STATUS_LABEL, ratioOf } from './overview/format';
import { ProgressBar } from './overview/ProgressBar';
import { MiniSparkline } from './MiniSparkline';

type Trend = { month: string; total: number }[];

const SPARK_COLOR = {
  over: STATUS_COLORS.red,
  warn: STATUS_COLORS.amber,
  ok: STATUS_COLORS.green,
  none: STATUS_COLORS.neutral,
} as const;

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
      setError('Could not save, so it was reverted.');
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }

  // Recomputed from the (possibly just-edited) budget, using the sheet's own
  // Status thresholds, so the chip and bar never lag behind an edit.
  const ratio = ratioOf(row.spent, budget);
  const status = getRatioStatus(ratio);
  const pct = budget > 0 ? `${Math.round(ratio * 100)}%` : '—';

  return (
    <div className="border-b border-panel-lineSoft py-3.5 last:border-none">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <div className="flex min-w-0 flex-1 items-center justify-between gap-3 sm:flex-none sm:justify-start">
          <Link
            href={`/categories/${encodeURIComponent(row.category)}`}
            className="flex items-center gap-2.5 font-semibold text-panel-ink transition-colors hover:text-accent"
          >
            <span className={`h-2 w-2 shrink-0 rounded-full ${status === 'none' ? 'bg-panel-faint' : DOT_CLASS[status]}`} />
            {row.category}
          </Link>
          <span className={`inline-flex h-6 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[12.5px] font-semibold before:h-1.5 before:w-1.5 before:rounded-full before:bg-current sm:hidden ${CHIP_CLASS[status]}`}>
            {STATUS_LABEL[status]}
          </span>
        </div>
        <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-1.5 text-sm sm:w-auto">
          <span className="font-semibold sm:w-20 sm:text-right">${row.spent.toFixed(2)}</span>
          <span className="-mx-1.5 text-panel-faint sm:hidden">of</span>
          {editing ? (
            <input
              autoFocus
              type="number"
              defaultValue={budget}
              disabled={saving}
              onBlur={(e) => save(Number(e.target.value))}
              onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
              aria-label={`Monthly budget for ${row.category}`}
              className="w-24 rounded-lg border border-panel-line bg-panel-surface2 px-2 py-1 text-panel-ink focus:border-accent-line focus:outline-none focus:ring-2 focus:ring-accent-soft"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-label={`Edit budget for ${row.category}`}
              className="text-panel-inkMuted underline decoration-panel-faint decoration-dotted underline-offset-4 transition-colors hover:text-accent sm:w-24 sm:text-right"
            >
              ${budget.toFixed(2)}
            </button>
          )}
          <span className="whitespace-nowrap text-panel-inkMuted sm:w-12 sm:text-right">{pct}</span>
          <span className={`hidden h-6 w-[88px] items-center justify-center gap-1.5 whitespace-nowrap rounded-full text-[12.5px] font-semibold before:h-1.5 before:w-1.5 before:rounded-full before:bg-current sm:inline-flex ${CHIP_CLASS[status]}`}>
            {STATUS_LABEL[status]}
          </span>
          <span className="hidden sm:block">
            <MiniSparkline data={trend} color={SPARK_COLOR[status]} />
          </span>
          {error && <span role="alert" className="text-status-over-ink">{error}</span>}
        </div>
      </div>
      <ProgressBar ratio={ratio} status={status} size="sm" className="mt-3" />
    </div>
  );
}
