'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const inputClass = 'rounded border border-panel-line bg-panel-surface2 px-2 py-1 text-panel-ink';
const labelClass = 'flex flex-col gap-1 text-xs text-panel-inkMuted';

export function AddDebtForm() {
  const [showForm, setShowForm] = useState(false);
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
      setShowForm(false);
      router.refresh();
    } else {
      setError('Could not add loan');
    }
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="mb-4 rounded bg-accent px-4 py-2 text-sm font-medium text-panel-bg"
      >
        + Add loan
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 grid grid-cols-2 gap-3 rounded-lg border border-panel-line bg-panel-surface p-4 md:grid-cols-4">
      <label className={labelClass}>
        Loan name
        <input placeholder="e.g. Honda CRV 2023" value={form.name} onChange={(e) => update('name', e.target.value)} required className={inputClass} />
      </label>
      <label className={labelClass}>
        Original loan amount ($)
        <input type="number" value={form.principal} onChange={(e) => update('principal', e.target.value)} className={inputClass} />
      </label>
      <label className={labelClass}>
        Current balance owed ($)
        <input type="number" value={form.currentBalance} onChange={(e) => update('currentBalance', e.target.value)} className={inputClass} />
      </label>
      <label className={labelClass}>
        Scheduled payment ($)
        <input type="number" value={form.payment} onChange={(e) => update('payment', e.target.value)} className={inputClass} />
      </label>
      <label className={labelClass}>
        Payment frequency
        <select value={form.frequency} onChange={(e) => update('frequency', e.target.value)} className={inputClass}>
          <option value="Weekly">Every week</option>
          <option value="Biweekly">Every 2 weeks</option>
          <option value="Monthly">Every month</option>
          <option value="Annually">Every year</option>
        </select>
      </label>
      <label className={labelClass}>
        Loan start date
        <input type="date" value={form.startDate} onChange={(e) => update('startDate', e.target.value)} className={inputClass} />
      </label>
      <label className={labelClass}>
        Interest rate (% annual)
        <input type="number" value={form.rate} onChange={(e) => update('rate', e.target.value)} className={inputClass} />
      </label>
      <label className={`${labelClass} col-span-2 md:col-span-4`}>
        Match keyword (for payments)
        <input placeholder="e.g. car loan" value={form.keyword} onChange={(e) => update('keyword', e.target.value)} className={inputClass} />
      </label>
      <div className="col-span-2 flex items-center gap-3 md:col-span-4">
        <button type="submit" className="rounded bg-accent px-4 py-2 text-sm font-medium text-panel-bg">Save loan</button>
        <button type="button" onClick={() => setShowForm(false)} className="text-sm text-panel-inkMuted hover:underline">Cancel</button>
        {error && <span className="text-sm text-[#F43F5E]">{error}</span>}
      </div>
    </form>
  );
}
