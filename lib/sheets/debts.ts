import { getSheetsClient, getSpreadsheetId } from './client';
import { DEBT_TRACKER_RANGE } from './layout';
import { parseCurrency, parseSheetDate } from './parse';
import type { Transaction } from './expenseLog';

export type Debt = {
  name: string;
  principal: number;
  currentBalance: number;
  payment: number;
  frequency: 'Weekly' | 'Biweekly' | 'Monthly' | 'Annually';
  startDate: Date;
  rate: number;
  keyword: string;
};

const FREQUENCY_DAYS: Record<Debt['frequency'], number> = {
  Weekly: 7,
  Biweekly: 14,
  Monthly: 30,
  Annually: 365,
};

export async function getDebts(): Promise<Debt[]> {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: DEBT_TRACKER_RANGE });
  const rows = (res.data.values ?? []).filter((row) => row[0] && row[0] !== 'Name');

  return rows.map((row) => ({
    name: String(row[0]),
    principal: parseCurrency(String(row[1] ?? '')),
    currentBalance: parseCurrency(String(row[2] ?? '')),
    payment: parseCurrency(String(row[3] ?? '')),
    frequency: (row[4] as Debt['frequency']) ?? 'Monthly',
    startDate: parseSheetDate(String(row[5] ?? '2026-01-01')),
    rate: parseCurrency(String(row[6] ?? '')),
    keyword: String(row[7] ?? ''),
  }));
}

export async function addDebt(input: Debt): Promise<void> {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const tab = DEBT_TRACKER_RANGE.match(/^'([^']+)'/)?.[1] ?? '';
  const dateStr = input.startDate.toISOString().slice(0, 10);

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `'${tab}'!A:H`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[input.name, input.principal, input.currentBalance, input.payment, input.frequency, dateStr, input.rate, input.keyword]],
    },
  });
}

export function matchPayments(debt: Debt, transactions: Transaction[]): Transaction[] {
  if (!debt.keyword) return [];
  const keyword = debt.keyword.toLowerCase();
  return transactions
    .filter((t) => t.description.toLowerCase().includes(keyword))
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

export function estimatePayoffDate(debt: Debt): Date | null {
  if (debt.payment <= 0 || debt.currentBalance <= 0) return null;
  const paymentsRemaining = Math.ceil(debt.currentBalance / debt.payment);
  const daysOut = paymentsRemaining * FREQUENCY_DAYS[debt.frequency];
  return new Date(Date.now() + daysOut * 24 * 60 * 60 * 1000);
}
