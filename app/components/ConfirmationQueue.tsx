'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Transaction } from '@/lib/sheets/expenseLog';
import { BTN_PRIMARY, INPUT, PANEL } from './ui';

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

  if (pending.length === 0) {
    return <p className="text-sm text-panel-inkMuted">Nothing pending confirmation.</p>;
  }

  return (
    <ul className="space-y-2.5">
      {pending.map((t) => {
        const key = t.date.toISOString().slice(0, 10) + t.description;
        return (
          <li key={key} className={`${PANEL} flex flex-wrap items-center gap-3 !p-3.5`}>
            <span className="min-w-[140px] flex-1 font-medium">{t.description}</span>
            <input
              type="number"
              defaultValue={t.amount}
              aria-label={`Amount for ${t.description}`}
              onChange={(e) => setAmounts((a) => ({ ...a, [key]: e.target.value }))}
              className={`${INPUT} w-28`}
            />
            <button type="button" onClick={() => confirm(t)} className={BTN_PRIMARY}>Confirm</button>
          </li>
        );
      })}
    </ul>
  );
}
