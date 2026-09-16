'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AddCategoryForm() {
  const [emoji, setEmoji] = useState('📁');
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emoji, name, startingBudget: Number(budget) || 0 }),
    });
    if (res.ok) {
      setName('');
      setBudget('');
      router.refresh();
    } else {
      setError('Could not add category');
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-1 flex flex-wrap items-end gap-3 rounded-lg border border-panel-line bg-panel-surface p-4"
    >
      <div>
        <label className="block font-mono text-[10px] uppercase tracking-[0.08em] text-panel-inkMuted">Emoji</label>
        <input
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          className="mt-1 w-14 rounded border border-panel-line bg-panel-surface2 px-2 py-1.5 text-center text-panel-ink"
        />
      </div>
      <div className="flex-1">
        <label className="block font-mono text-[10px] uppercase tracking-[0.08em] text-panel-inkMuted">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 w-full rounded border border-panel-line bg-panel-surface2 px-2 py-1.5 text-panel-ink"
        />
      </div>
      <div>
        <label className="block font-mono text-[10px] uppercase tracking-[0.08em] text-panel-inkMuted">Starting Budget</label>
        <input
          type="number"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          className="mt-1 w-32 rounded border border-panel-line bg-panel-surface2 px-2 py-1.5 font-mono text-panel-ink"
        />
      </div>
      <button
        type="submit"
        className="rounded bg-brass px-4 py-1.5 font-mono text-[13px] font-semibold text-panel-bg transition-opacity hover:opacity-90"
      >
        + Add category
      </button>
      {error && <span className="font-mono text-sm text-[#EE8478]">{error}</span>}
    </form>
  );
}
