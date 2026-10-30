'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BTN_PRIMARY, ERROR_TEXT, INPUT, LABEL, PANEL } from './ui';

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
    <form onSubmit={handleSubmit} className={`${PANEL} flex flex-wrap items-end gap-3 !p-4 md:!p-5`}>
      <label className={LABEL}>
        Emoji
        <input value={emoji} onChange={(e) => setEmoji(e.target.value)} className={`${INPUT} w-16 text-center`} />
      </label>
      <label className={`${LABEL} min-w-[160px] flex-1`}>
        Name
        <input value={name} onChange={(e) => setName(e.target.value)} required className={`${INPUT} w-full`} />
      </label>
      <label className={LABEL}>
        Starting budget
        <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} className={`${INPUT} w-32`} />
      </label>
      <button type="submit" className={BTN_PRIMARY}>
        + Add category
      </button>
      {error && <span role="alert" className={ERROR_TEXT}>{error}</span>}
    </form>
  );
}
