'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MONTH_NAMES, MONTH_LABELS } from '@/lib/sheets/months';

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
      setError('Could not change month — reverted.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-2 text-sm text-slate-400">
      <span>Showing</span>
      <select
        value={month}
        disabled={saving}
        onChange={(e) => changeMonth(e.target.value)}
        className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-slate-100"
      >
        {MONTH_NAMES.map((m) => (
          <option key={m} value={m}>
            {MONTH_LABELS[m]}
          </option>
        ))}
      </select>
      {error && <span className="text-red-400">{error}</span>}
    </div>
  );
}
