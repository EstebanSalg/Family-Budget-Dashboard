'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BTN_GHOST, BTN_PRIMARY, ERROR_TEXT, INPUT, LABEL, PANEL } from './ui';

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
      <button type="button" onClick={() => setShowForm(true)} className={BTN_PRIMARY}>
        + Add loan
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`${PANEL} grid grid-cols-2 gap-3 md:grid-cols-4`}>
      <label className={LABEL}>
        Loan name
        <input placeholder="e.g. Honda CRV 2023" value={form.name} onChange={(e) => update('name', e.target.value)} required className={INPUT} />
      </label>
      <label className={LABEL}>
        Original loan amount ($)
        <input type="number" value={form.principal} onChange={(e) => update('principal', e.target.value)} className={INPUT} />
      </label>
      <label className={LABEL}>
        Current balance owed ($)
        <input type="number" value={form.currentBalance} onChange={(e) => update('currentBalance', e.target.value)} className={INPUT} />
      </label>
      <label className={LABEL}>
        Scheduled payment ($)
        <input type="number" value={form.payment} onChange={(e) => update('payment', e.target.value)} className={INPUT} />
      </label>
      <label className={LABEL}>
        Payment frequency
        <select value={form.frequency} onChange={(e) => update('frequency', e.target.value)} className={INPUT}>
          <option value="Weekly">Every week</option>
          <option value="Biweekly">Every 2 weeks</option>
          <option value="Monthly">Every month</option>
          <option value="Annually">Every year</option>
        </select>
      </label>
      <label className={LABEL}>
        Loan start date
        <input type="date" value={form.startDate} onChange={(e) => update('startDate', e.target.value)} className={INPUT} />
      </label>
      <label className={LABEL}>
        Interest rate (% annual)
        <input type="number" value={form.rate} onChange={(e) => update('rate', e.target.value)} className={INPUT} />
      </label>
      <label className={`${LABEL} col-span-2 md:col-span-4`}>
        Match keyword (for payments)
        <input placeholder="e.g. car loan" value={form.keyword} onChange={(e) => update('keyword', e.target.value)} className={INPUT} />
      </label>
      <div className="col-span-2 flex flex-wrap items-center gap-3 md:col-span-4">
        <button type="submit" className={BTN_PRIMARY}>Save loan</button>
        <button type="button" onClick={() => setShowForm(false)} className={BTN_GHOST}>Cancel</button>
        {error && <span role="alert" className={ERROR_TEXT}>{error}</span>}
      </div>
    </form>
  );
}
