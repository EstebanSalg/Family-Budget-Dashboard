// lib/sheets/monthlyTrend.ts
import type { Transaction } from './expenseLog';

function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function getSixMonthTrend(
  transactions: Transaction[],
  category: string,
  asOf: Date
): { month: string; total: number }[] {
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth() - i, 1));
    months.push(monthKey(d));
  }

  const totals = new Map(months.map((m) => [m, 0]));

  for (const t of transactions) {
    if (t.category !== category) continue;
    const key = monthKey(t.date);
    if (totals.has(key)) {
      totals.set(key, (totals.get(key) ?? 0) + t.amount);
    }
  }

  return months.map((month) => ({ month, total: Math.round((totals.get(month) ?? 0) * 100) / 100 }));
}
