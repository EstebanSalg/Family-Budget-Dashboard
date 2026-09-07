'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AddDebtForm() {
  const [form, setForm] = useState({
    name: '', principal: '', currentBalance: '', payment: '', frequency: 'Monthly', startDate: '', rate: '', keyword: '',
  });
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch('/api/debts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        principal: Number(form.principal),
        currentBalance: Number(form.currentBalance),
        payment: Number(form.payment),
        rate: Number(form.rate),
      }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      setError('Could not add loan');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 grid grid-cols-2 gap-2 rounded-lg bg-slate-900 p-4 md:grid-cols-4">
      <input placeholder="Name" value={form.name} onChange={(e) => update('name', e.target.value)} required className="rounded border border-slate-700 bg-slate-800 px-2 py-1" />
      <input placeholder="Principal" type="number" value={form.principal} onChange={(e) => update('principal', e.target.value)} className="rounded border border-slate-700 bg-slate-800 px-2 py-1" />
      <input placeholder="Current Balance" type="number" value={form.currentBalance} onChange={(e) => update('currentBalance', e.target.value)} className="rounded border border-slate-700 bg-slate-800 px-2 py-1" />
      <input placeholder="Payment" type="number" value={form.payment} onChange={(e) => update('payment', e.target.value)} className="rounded border border-slate-700 bg-slate-800 px-2 py-1" />
      <select value={form.frequency} onChange={(e) => update('frequency', e.target.value)} className="rounded border border-slate-700 bg-slate-800 px-2 py-1">
        <option>Weekly</option>
        <option>Biweekly</option>
        <option>Monthly</option>
        <option>Annually</option>
      </select>
      <input placeholder="Start Date" type="date" value={form.startDate} onChange={(e) => update('startDate', e.target.value)} className="rounded border border-slate-700 bg-slate-800 px-2 py-1" />
      <input placeholder="Rate %" type="number" value={form.rate} onChange={(e) => update('rate', e.target.value)} className="rounded border border-slate-700 bg-slate-800 px-2 py-1" />
      <input placeholder="Keyword (matches description)" value={form.keyword} onChange={(e) => update('keyword', e.target.value)} className="rounded border border-slate-700 bg-slate-800 px-2 py-1" />
      <button type="submit" className="col-span-2 rounded bg-blue-600 px-4 py-2 text-sm font-medium md:col-span-4">+ Add loan</button>
      {error && <span className="text-sm text-red-400">{error}</span>}
    </form>
  );
}
