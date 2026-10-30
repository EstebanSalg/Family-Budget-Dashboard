// lib/sheets/monthlyTotals.test.ts
import { describe, it, expect } from 'vitest';
import { getSixMonthTotals, getLatestEntriesByCategory } from './monthlyTotals';
import type { Transaction } from './expenseLog';

function tx(date: string, category: string, amount: number, description = ''): Transaction {
  return { date: new Date(date), amount, category, description, source: 'Bank', month: '', year: 0 };
}

describe('getSixMonthTotals', () => {
  it('sums all categories per month, skipping excluded ones and months outside the window', () => {
    const transactions = [
      tx('2026-04-02', '🛒 Groceries', 49.23),
      tx('2026-04-04', '🍽️ Dining Out', 30.0),
      tx('2026-05-08', '💰 Income', 6400), // excluded
      tx('2026-05-09', '💳 Credit Cards', 700), // excluded
      tx('2026-05-10', '🚗 Transport', 52.3),
      tx('2025-10-01', '🛒 Groceries', 999.0), // outside the 6-month window
    ];

    const totals = getSixMonthTotals(transactions, new Date('2026-09-05'), ['💰 Income', '💳 Credit Cards']);

    expect(totals).toEqual([
      { month: '2026-04', total: 79.23 },
      { month: '2026-05', total: 52.3 },
      { month: '2026-06', total: 0 },
      { month: '2026-07', total: 0 },
      { month: '2026-08', total: 0 },
      { month: '2026-09', total: 0 },
    ]);
  });
});

describe('getLatestEntriesByCategory', () => {
  it('returns the newest entries per category for one month, capped at the limit', () => {
    const transactions = [
      tx('2026-10-03', '🛒 Groceries', 10, 'oldest'),
      tx('2026-10-20', '🛒 Groceries', 30, 'newest'),
      tx('2026-10-11', '🛒 Groceries', 20, 'middle'),
      tx('2026-09-30', '🛒 Groceries', 99, 'other month'),
      tx('2026-10-05', '🚗 Transport', 40, 'bus'),
    ];

    const entries = getLatestEntriesByCategory(transactions, '2026-10', 2);

    expect(entries['🛒 Groceries']).toEqual([
      { day: 20, description: 'newest', amount: 30 },
      { day: 11, description: 'middle', amount: 20 },
    ]);
    expect(entries['🚗 Transport']).toEqual([{ day: 5, description: 'bus', amount: 40 }]);
  });
});
