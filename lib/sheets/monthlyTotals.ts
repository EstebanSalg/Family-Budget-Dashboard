// lib/sheets/monthlyTotals.ts
//
// Pure helpers (no Sheets API imports) for the Overview page: household-wide
// monthly spend for the trend chart, and the latest entries per category for
// the row detail. Month keys are "YYYY-MM" in UTC, matching monthlyTrend.ts and
// parseSheetDate (which parses sheet dates as UTC midnight).
import type { Transaction } from './expenseLog';

export type MonthlyTotal = { month: string; total: number };
export type EntrySummary = { day: number; description: string; amount: number };

export function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

// Total spend per month for the six months ending at `asOf`, skipping any
// category in `excludeCategories` (Income is not spending; Credit Cards would
// double-count purchases already logged under their real category).
export function getSixMonthTotals(
  transactions: Transaction[],
  asOf: Date,
  excludeCategories: readonly string[]
): MonthlyTotal[] {
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    months.push(monthKey(new Date(Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth() - i, 1))));
  }
  const totals = new Map(months.map((m) => [m, 0]));

  for (const t of transactions) {
    if (excludeCategories.includes(t.category)) continue;
    const key = monthKey(t.date);
    if (totals.has(key)) totals.set(key, (totals.get(key) ?? 0) + t.amount);
  }

  return months.map((month) => ({ month, total: Math.round((totals.get(month) ?? 0) * 100) / 100 }));
}

// The newest `limit` entries per category within one month, newest first.
export function getLatestEntriesByCategory(
  transactions: Transaction[],
  month: string,
  limit: number
): Record<string, EntrySummary[]> {
  const byCategory: Record<string, Transaction[]> = {};
  for (const t of transactions) {
    if (monthKey(t.date) !== month) continue;
    (byCategory[t.category] ??= []).push(t);
  }

  const result: Record<string, EntrySummary[]> = {};
  for (const [category, list] of Object.entries(byCategory)) {
    result[category] = list
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, limit)
      .map((t) => ({ day: t.date.getUTCDate(), description: t.description, amount: t.amount }));
  }
  return result;
}
