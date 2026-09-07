import { getSheetsClient, getSpreadsheetId } from './client';
import { ANNUAL_SUMMARY_RANGE, BUDGET_RANGE } from './layout';
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

export async function updateCategoryBudget(category: string, newBudget: number): Promise<void> {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: BUDGET_RANGE });
  const rows = res.data.values ?? [];
  const rowIndex = rows.findIndex((row) => row[0] === category);
  if (rowIndex === -1) throw new Error(`Category not found: ${category}`);

  // BUDGET_RANGE starts at row 1 (header); data row N is at sheet row N+1,
  // and the range itself may start partway down the sheet — derive the sheet
  // row number from the range's own starting row, not a hardcoded offset.
  const rangeStartRow = Number(BUDGET_RANGE.match(/(\d+)(?=:)/)?.[1] ?? '1');
  const sheetRow = rangeStartRow + rowIndex;
  const tabName = BUDGET_RANGE.match(/^'([^']+)'/)?.[1] ?? '';

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${tabName}'!B${sheetRow}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[newBudget]] },
  });
}

export async function addCategory(input: { emoji: string; name: string; startingBudget: number }): Promise<void> {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const categoryLabel = `${input.emoji} ${input.name}`;
  const budgetTab = BUDGET_RANGE.match(/^'([^']+)'/)?.[1] ?? '';
  const annualTab = ANNUAL_SUMMARY_RANGE.match(/^'([^']+)'/)?.[1] ?? '';

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `'${budgetTab}'!A:F`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[categoryLabel, input.startingBudget, 0, input.startingBudget, 0, '⬜ N/A']] },
  });

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `'${annualTab}'!A:N`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[categoryLabel, '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-']] },
  });
}
