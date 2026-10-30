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
    <div className="flex items-center gap-2 font-mono text-[13px] text-panel-inkMuted">
      <span className="uppercase tracking-wide">Showing</span>
      <select
        value={month}
        disabled={saving}
        onChange={(e) => changeMonth(e.target.value)}
        className="rounded-full border border-panel-line bg-panel-surface px-3 py-1.5 text-panel-ink"
      >
        {MONTH_NAMES.map((m) => (
          <option key={m} value={m}>
            {MONTH_LABELS[m]}
          </option>
        ))}
      </select>
      {error && <span className="text-[#F43F5E]">{error}</span>}
    </div>
  );
}
