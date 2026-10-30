'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function RecurringForm({ categories }: { categories: string[] }) {
  const [form, setForm] = useState({
    name: '', category: categories[0] ?? '', expectedAmount: '', frequency: 'Monthly', nextDueDate: '', autoLogEnabled: true,
  });
  const router = useRouter();

  function update(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/recurring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, expectedAmount: Number(form.expectedAmount) }),
    });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 grid grid-cols-2 gap-2 rounded-lg border border-panel-line bg-panel-surface p-4 md:grid-cols-5">
      <input placeholder="Name" value={form.name} onChange={(e) => update('name', e.target.value)} required className="rounded border border-panel-line bg-panel-surface2 px-2 py-1 text-panel-ink" />
      <select value={form.category} onChange={(e) => update('category', e.target.value)} className="rounded border border-panel-line bg-panel-surface2 px-2 py-1 text-panel-ink">
        {categories.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <input placeholder="Expected Amount" type="number" value={form.expectedAmount} onChange={(e) => update('expectedAmount', e.target.value)} className="rounded border border-panel-line bg-panel-surface2 px-2 py-1 text-panel-ink" />
      <select value={form.frequency} onChange={(e) => update('frequency', e.target.value)} className="rounded border border-panel-line bg-panel-surface2 px-2 py-1 text-panel-ink">
        <option>Weekly</option>
        <option>Biweekly</option>
        <option>Monthly</option>
        <option>Annually</option>
      </select>
      <input placeholder="Next Due Date" type="date" value={form.nextDueDate} onChange={(e) => update('nextDueDate', e.target.value)} className="rounded border border-panel-line bg-panel-surface2 px-2 py-1 text-panel-ink" />
      <button type="submit" className="col-span-2 rounded bg-accent px-4 py-2 text-sm font-medium text-panel-bg md:col-span-5">+ Add recurring expense</button>
    </form>
  );
}
