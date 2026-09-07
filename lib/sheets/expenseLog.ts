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
