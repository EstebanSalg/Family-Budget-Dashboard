'use client';

import { useMemo, useState } from 'react';
import type { Transaction } from '@/lib/sheets/expenseLog';

export function TransactionSearch({ transactions }: { transactions: Transaction[] }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return transactions;
    return transactions.filter((t) => t.description.toLowerCase().includes(q));
  }, [transactions, query]);

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Filter transactions... e.g. gas, walmart"
        className="mb-3 w-full rounded border border-panel-line bg-panel-surface2 px-3 py-2 text-panel-ink"
      />
      <ul className="divide-y divide-panel-line">
        {filtered.map((t, i) => (
          <li key={i} className="flex justify-between py-2 text-sm">
            <span>{t.description}</span>
            <span className="font-mono">${t.amount.toFixed(2)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
