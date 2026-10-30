'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MONTH_NAMES, MONTH_LABELS } from '@/lib/sheets/months';

// Switches the month the sheet reports on (a single selector cell in the
// Monthly Budget tab), then refreshes the server-rendered page. Arrows step
// through the year and wrap; the select jumps straight to a month.
export function MonthSelector({ currentMonth }: { currentMonth: string }) {
  const router = useRouter();
  const [month, setMonth] = useState(currentMonth);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function changeMonth(newMonth: string) {
    const previous = month;
    setMonth(newMonth);
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/settings/month', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: newMonth }),
      });
      if (!res.ok) throw new Error('save failed');
      router.refresh();
    } catch {
      setMonth(previous);
      setError('Could not change month, so it was reverted.');
    } finally {
      setSaving(false);
    }
  }

  const index = (MONTH_NAMES as readonly string[]).indexOf(month);
  const step = (delta: number) => changeMonth(MONTH_NAMES[(index + delta + 12) % 12]);

  const arrow =
    'grid h-[34px] w-[34px] place-items-center rounded-[7px] text-panel-ink transition-colors hover:bg-panel-tint disabled:cursor-not-allowed disabled:opacity-30';

  return (
    <div className="inline-flex flex-col items-end gap-1.5">
      <div role="group" aria-label="Choose month" className="inline-flex items-center gap-1 rounded-xl border border-panel-line bg-panel-surface2 p-1">
        <button type="button" onClick={() => step(-1)} disabled={saving} aria-label="Previous month" className={arrow}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
            <path d="M14.5 5.5 8 12l6.5 6.5" />
          </svg>
        </button>
        <label className="relative">
          <span className="sr-only">Month</span>
          <select
            value={month}
            disabled={saving}
            onChange={(e) => changeMonth(e.target.value)}
            className="min-w-[132px] cursor-pointer appearance-none rounded-[7px] bg-transparent px-2 py-1.5 text-center text-sm font-semibold text-panel-ink hover:bg-panel-tint disabled:opacity-60"
          >
            {MONTH_NAMES.map((m) => (
              <option key={m} value={m}>
                {MONTH_LABELS[m]}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={() => step(1)} disabled={saving} aria-label="Next month" className={arrow}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
            <path d="M9.5 5.5 16 12l-6.5 6.5" />
          </svg>
        </button>
      </div>
      {error && (
        <p role="alert" className="text-xs text-status-over-ink">
          {error}
        </p>
      )}
    </div>
  );
}
