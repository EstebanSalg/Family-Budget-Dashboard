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
    <form onSubmit={handleSubmit} className="mb-4 flex items-end gap-2 rounded-lg bg-slate-900 p-4">
      <div>
        <label className="block text-xs text-slate-400">Emoji</label>
        <input value={emoji} onChange={(e) => setEmoji(e.target.value)} className="w-14 rounded border border-slate-700 bg-slate-800 px-2 py-1 text-center" />
      </div>
      <div className="flex-1">
        <label className="block text-xs text-slate-400">Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded border border-slate-700 bg-slate-800 px-2 py-1" />
      </div>
      <div>
        <label className="block text-xs text-slate-400">Starting Budget</label>
        <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} className="w-32 rounded border border-slate-700 bg-slate-800 px-2 py-1" />
      </div>
      <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-sm font-medium">+ Add category</button>
      {error && <span className="text-sm text-red-400">{error}</span>}
    </form>
  );
}
