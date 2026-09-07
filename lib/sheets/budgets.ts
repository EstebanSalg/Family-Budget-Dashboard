import { getSheetsClient, getSpreadsheetId } from './client';
import { BUDGET_RANGE } from './layout';
import { parseCurrency } from './parse';

export type CategoryBudget = {
  category: string;
  budget: number;
  spent: number;
  remaining: number;
  percentUsed: number;
};

export async function getCategoryBudgets(): Promise<CategoryBudget[]> {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: BUDGET_RANGE,
  });

  const rows = res.data.values ?? [];
  const dataRows = rows.filter(
    (row) => row[0] && row[0] !== 'Category' && row[0] !== 'TOTAL'
  );

  return dataRows.map((row) => {
    const budget = parseCurrency(String(row[1] ?? ''));
    const spent = parseCurrency(String(row[2] ?? ''));
    const remaining = parseCurrency(String(row[3] ?? ''));
    const percentUsed = budget > 0 ? (spent / budget) * 100 : 0;
    return { category: String(row[0]), budget, spent, remaining, percentUsed };
  });
}
