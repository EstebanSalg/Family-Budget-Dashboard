'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { CategoryBudget } from '@/lib/sheets/budgets';

export function CategoryRow({ row }: { row: CategoryBudget }) {
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

  return (
    <div className="flex items-center justify-between border-b border-slate-800 py-3">
      <Link href={`/categories/${encodeURIComponent(row.category)}`} className="font-medium hover:underline">
        {row.category}
      </Link>
      <div className="flex items-center gap-6 text-sm">
        <span className="w-20 text-right">${row.spent.toFixed(2)}</span>
        {editing ? (
          <input
            autoFocus
            type="number"
            defaultValue={budget}
            disabled={saving}
            onBlur={(e) => save(Number(e.target.value))}
            className="w-24 rounded border border-slate-700 bg-slate-800 px-2 py-1"
          />
        ) : (
          <button onClick={() => setEditing(true)} className="w-24 text-right underline decoration-dotted">
            ${budget.toFixed(2)}
          </button>
        )}
        <span className="w-12 text-right">{row.percentUsed.toFixed(0)}%</span>
        {error && <span className="text-red-400">{error}</span>}
      </div>
    </div>
  );
}
