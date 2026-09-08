'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Transaction } from '@/lib/sheets/expenseLog';

export function ConfirmationQueue({ pending }: { pending: Transaction[] }) {
  const router = useRouter();
  const [amounts, setAmounts] = useState<Record<string, string>>({});

  async function confirm(t: Transaction) {
    const dateStr = t.date.toISOString().slice(0, 10);
    const amount = Number(amounts[dateStr + t.description] ?? t.amount);
    await fetch(`/api/transactions/${dateStr}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: t.description, amount }),
    });
    router.refresh();
  }

  if (pending.length === 0) return <p className="text-slate-400">Nothing pending confirmation.</p>;

  return (
    <ul className="space-y-2">
      {pending.map((t) => {
        const key = t.date.toISOString().slice(0, 10) + t.description;
        return (
          <li key={key} className="flex items-center gap-3 rounded bg-slate-900 p-3">
            <span className="flex-1">{t.description}</span>
            <input
              type="number"
              defaultValue={t.amount}
              onChange={(e) => setAmounts((a) => ({ ...a, [key]: e.target.value }))}
              className="w-28 rounded border border-slate-700 bg-slate-800 px-2 py-1"
            />
            <button onClick={() => confirm(t)} className="rounded bg-blue-600 px-3 py-1 text-sm">Confirm</button>
          </li>
        );
      })}
    </ul>
  );
}
