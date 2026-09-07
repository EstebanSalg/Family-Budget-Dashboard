// lib/sheets/monthlyTrend.test.ts
import { describe, it, expect } from 'vitest';
import { getSixMonthTrend } from './monthlyTrend';
import type { Transaction } from './expenseLog';

function tx(date: string, category: string, amount: number): Transaction {
  return { date: new Date(date), amount, category, description: '', source: 'Bank', month: '', year: 0 };
}

describe('getSixMonthTrend', () => {
  it('sums spend per month for the given category over the trailing 6 months', () => {
    const transactions = [
      tx('2026-04-02', '🛒 Groceries', 49.23),
      tx('2026-04-04', '🛒 Groceries', 132.0),
      tx('2026-05-08', '🛒 Groceries', 107.84),
      tx('2026-05-08', '🍽️ Dining Out', 40.0), // different category, excluded
      tx('2025-10-01', '🛒 Groceries', 999.0), // outside the 6-month window, excluded
    ];

    const trend = getSixMonthTrend(transactions, '🛒 Groceries', new Date('2026-09-05'));

    expect(trend).toEqual([
      { month: '2026-04', total: 181.23 },
      { month: '2026-05', total: 107.84 },
      { month: '2026-06', total: 0 },
      { month: '2026-07', total: 0 },
      { month: '2026-08', total: 0 },
      { month: '2026-09', total: 0 },
    ]);
  });
});
