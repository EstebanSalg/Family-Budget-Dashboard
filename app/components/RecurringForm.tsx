'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BTN_PRIMARY, INPUT, PANEL } from './ui';

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
    <form onSubmit={handleSubmit} className={`${PANEL} grid grid-cols-2 gap-3 !p-4 md:grid-cols-5 md:!p-5`}>
      <input placeholder="Name" aria-label="Name" value={form.name} onChange={(e) => update('name', e.target.value)} required className={INPUT} />
      <select aria-label="Category" value={form.category} onChange={(e) => update('category', e.target.value)} className={INPUT}>
        {categories.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <input placeholder="Expected amount" aria-label="Expected amount" type="number" value={form.expectedAmount} onChange={(e) => update('expectedAmount', e.target.value)} className={INPUT} />
      <select aria-label="Frequency" value={form.frequency} onChange={(e) => update('frequency', e.target.value)} className={INPUT}>
        <option>Weekly</option>
        <option>Biweekly</option>
        <option>Monthly</option>
        <option>Annually</option>
      </select>
      <input aria-label="Next due date" type="date" value={form.nextDueDate} onChange={(e) => update('nextDueDate', e.target.value)} className={INPUT} />
      <button type="submit" className={`${BTN_PRIMARY} col-span-2 md:col-span-5`}>+ Add recurring expense</button>
    </form>
  );
}
