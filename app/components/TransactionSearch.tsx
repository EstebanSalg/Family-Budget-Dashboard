'use client';

import { useMemo, useState } from 'react';
import type { Transaction } from '@/lib/sheets/expenseLog';
import { INPUT } from './ui';

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
        placeholder="Filter entries, e.g. gas, walmart"
        aria-label="Filter entries"
        className={`${INPUT} mb-3 w-full`}
      />
      {filtered.length === 0 ? (
        <p className="py-2 text-sm text-panel-inkMuted">No entries match.</p>
      ) : (
        <ul>
          {filtered.map((t, i) => (
            <li key={i} className="grid grid-cols-[1fr_auto] gap-3 border-t border-panel-lineSoft py-2.5 text-[14.5px] first:border-t-0">
              <span className="min-w-0 truncate">{t.description}</span>
              <span className="font-semibold">${t.amount.toFixed(2)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
