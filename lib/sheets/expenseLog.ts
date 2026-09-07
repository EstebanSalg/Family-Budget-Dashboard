import { getSheetsClient, getSpreadsheetId } from './client';
import { EXPENSE_LOG_RANGE } from './layout';
import { parseCurrency, parseSheetDate } from './parse';

export type Transaction = {
  date: Date;
  amount: number;
  category: string;
  description: string;
  source: string;
  month: string;
  year: number;
};

export async function getTransactions(): Promise<Transaction[]> {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: EXPENSE_LOG_RANGE,
  });

  const rows = res.data.values ?? [];

  return rows
    .filter((row) => row.length >= 7 && row[0])
    .map((row) => ({
      date: parseSheetDate(String(row[0])),
      amount: parseCurrency(String(row[1])),
      category: String(row[2]),
      description: String(row[3]),
      source: String(row[4]),
      month: String(row[5]),
      year: Number(row[6]),
    }));
}

export async function appendTransaction(t: {
  date: Date; amount: number; category: string; description: string; source: string;
}): Promise<void> {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const tab = EXPENSE_LOG_RANGE.match(/^'([^']+)'/)?.[1] ?? '';
  const dateStr = t.date.toISOString().slice(0, 10);
  const month = t.date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  const year = t.date.getUTCFullYear();

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `'${tab}'!A:G`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[dateStr, t.amount, t.category, t.description, t.source, month, year]] },
  });
}
