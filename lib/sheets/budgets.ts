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

function tabNameOf(range: string): string {
  return range.match(/^'([^']+)'/)?.[1] ?? '';
}

function rangeStartRowOf(range: string): number {
  return Number(range.match(/(\d+)(?=:)/)?.[1] ?? '1');
}

// Replaces cell references of the form "<column-letter(s)><oldRow>" (e.g.
// "B4", "C4") with the same column at newRow, leaving every other number in
// the formula (absolute references like "C2", Expense Log bounds like
// "C10029", or numeric literals like "0.85") untouched. Used to re-anchor a
// template row's row-relative formulas onto the newly inserted row.
function shiftRowRefs(formula: string, oldRow: number, newRow: number): string {
  return formula.replace(/\b([A-Z]{1,2})(\d+)\b/g, (match, col: string, digits: string) => {
    return Number(digits) === oldRow ? `${col}${newRow}` : match;
  });
}

function substituteCategoryLiteral(formula: string, oldLabel: string, newLabel: string): string {
  return formula.split(oldLabel).join(newLabel);
}

// Inserts a new category row immediately above the Monthly Budget tab's
// TOTAL row (via batchUpdate insertDimension, shifting TOTAL down by one),
// writes the new row's Spent/Remaining/%Used/Status as formulas derived from
// an existing category row's live formulas, and rewrites TOTAL's SUM()
// ranges to include the new row.
async function insertMonthlyBudgetRow(
  sheets: Awaited<ReturnType<typeof getSheetsClient>>,
  spreadsheetId: string,
  sheetId: number,
  categoryLabel: string,
  startingBudget: number
): Promise<void> {
  const tabName = tabNameOf(BUDGET_RANGE);
  const rangeStartRow = rangeStartRowOf(BUDGET_RANGE);

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: BUDGET_RANGE,
    valueRenderOption: 'FORMULA',
  });
  const rows = res.data.values ?? [];

  const totalFetchedIndex = rows.findIndex((row) => row[0] === 'TOTAL');
  if (totalFetchedIndex === -1) throw new Error(`Could not find TOTAL row in '${tabName}'`);
  if (rows.length < 2) throw new Error(`No category row found to use as a formula template in '${tabName}'`);

  // Use the first category row (immediately after the header) as the
  // formula template rather than the row directly above TOTAL -- live
  // investigation found the real sheet's last category row before TOTAL
  // ("Online") uses a different Expense Log range bound than every other
  // row (a pre-existing, separately-flagged inconsistency). The first row
  // is the reliable, standard-shape template.
  const templateFetchedIndex = 1;
  const templateRow = rows[templateFetchedIndex];
  const templateCategoryLabel = String(templateRow[0]);
  const templateSheetRow = rangeStartRow + templateFetchedIndex;
  const oldTotalSheetRow = rangeStartRow + totalFetchedIndex;
  const newCategoryRow = oldTotalSheetRow;
  const newTotalRow = oldTotalSheetRow + 1;

  const spentFormula = substituteCategoryLiteral(String(templateRow[2]), templateCategoryLabel, categoryLabel);
  const remainingFormula = shiftRowRefs(String(templateRow[3]), templateSheetRow, newCategoryRow);
  const percentFormula = shiftRowRefs(String(templateRow[4]), templateSheetRow, newCategoryRow);
  const statusFormula = shiftRowRefs(String(templateRow[5]), templateSheetRow, newCategoryRow);

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          insertDimension: {
            range: { sheetId, dimension: 'ROWS', startIndex: newCategoryRow - 1, endIndex: newCategoryRow },
            inheritFromBefore: true,
          },
        },
      ],
    },
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${tabName}'!A${newCategoryRow}:F${newCategoryRow}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[categoryLabel, startingBudget, spentFormula, remainingFormula, percentFormula, statusFormula]],
    },
  });

  // Extend TOTAL's existing SUM formulas by appending the new row as an
  // additional term (e.g. "=SUM(B4:B18)" -> "=SUM(B4:B18)+B20") rather than
  // recomputing the range from scratch (e.g. "=SUM(B4:B20)"). Recomputing
  // from the first category row would silently "fix" any pre-existing gap
  // in the old range (live investigation found exactly such a gap already
  // in the real sheet: the existing TOTAL formula excludes one hand-added
  // category, "Online", from its SUM range -- a separate, already-flagged
  // bug, out of scope for this task). Appending preserves whatever rows the
  // old formula already covered and adds exactly the one new row, so
  // TOTAL's computed value changes by exactly the new row's own value.
  const totalRow = rows[totalFetchedIndex];
  const budgetSumFormula = `${String(totalRow[1])}+B${newCategoryRow}`;
  const spentSumFormula = `${String(totalRow[2])}+C${newCategoryRow}`;
  const remainingSumFormula = `${String(totalRow[3])}+D${newCategoryRow}`;
  const totalPercentFormula = shiftRowRefs(String(totalRow[4]), oldTotalSheetRow, newTotalRow);

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${tabName}'!B${newTotalRow}:E${newTotalRow}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[budgetSumFormula, spentSumFormula, remainingSumFormula, totalPercentFormula]],
    },
  });
}

// Same approach as insertMonthlyBudgetRow, for the Annual Summary tab: 12
// per-month SUMPRODUCT columns (B..M) instead of one Spent column, plus a
// per-category annual TOTAL column (N). There is no Budget column here, so
// no startingBudget is written.
async function insertAnnualSummaryRow(
  sheets: Awaited<ReturnType<typeof getSheetsClient>>,
  spreadsheetId: string,
  sheetId: number,
  categoryLabel: string
): Promise<void> {
  const tabName = tabNameOf(ANNUAL_SUMMARY_RANGE);
  const rangeStartRow = rangeStartRowOf(ANNUAL_SUMMARY_RANGE);

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: ANNUAL_SUMMARY_RANGE,
    valueRenderOption: 'FORMULA',
  });
  const rows = res.data.values ?? [];

  const totalFetchedIndex = rows.findIndex((row) => row[0] === 'TOTAL');
  if (totalFetchedIndex === -1) throw new Error(`Could not find TOTAL row in '${tabName}'`);
  if (rows.length < 2) throw new Error(`No category row found to use as a formula template in '${tabName}'`);

  const templateFetchedIndex = 1;
  const templateRow = rows[templateFetchedIndex];
  const templateCategoryLabel = String(templateRow[0]);
  const templateSheetRow = rangeStartRow + templateFetchedIndex;
  const oldTotalSheetRow = rangeStartRow + totalFetchedIndex;
  const newCategoryRow = oldTotalSheetRow;
  const newTotalRow = oldTotalSheetRow + 1;

  // Columns B..M (indices 1..12) are the 12 month SUMPRODUCT formulas, each
  // filtered by a literal month string (not row-relative) -- only the
  // category-name literal needs to change. Column N (index 13) is the
  // per-category annual TOTAL, "=SUM(B{row}:M{row})", which is row-relative.
  const monthFormulas = templateRow
    .slice(1, 13)
    .map((cell) => substituteCategoryLiteral(String(cell), templateCategoryLabel, categoryLabel));
  const rowTotalFormula = shiftRowRefs(String(templateRow[13]), templateSheetRow, newCategoryRow);

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          insertDimension: {
            range: { sheetId, dimension: 'ROWS', startIndex: newCategoryRow - 1, endIndex: newCategoryRow },
            inheritFromBefore: true,
          },
        },
      ],
    },
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${tabName}'!A${newCategoryRow}:N${newCategoryRow}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[categoryLabel, ...monthFormulas, rowTotalFormula]],
    },
  });

  // Same "extend, don't recompute" strategy as insertMonthlyBudgetRow's
  // TOTAL rewrite -- see the comment there for why.
  const totalRow = rows[totalFetchedIndex];
  const columnLetters = ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'];
  const totalFormulas = columnLetters.map(
    (col, i) => `${String(totalRow[i + 1])}+${col}${newCategoryRow}`
  );

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${tabName}'!B${newTotalRow}:N${newTotalRow}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [totalFormulas] },
  });
}

export async function addCategory(input: { emoji: string; name: string; startingBudget: number }): Promise<void> {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const categoryLabel = `${input.emoji} ${input.name}`;
  const budgetTab = tabNameOf(BUDGET_RANGE);
  const annualTab = tabNameOf(ANNUAL_SUMMARY_RANGE);

  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const tabs = meta.data.sheets ?? [];
  const sheetIdOf = (tabName: string): number => {
    const tab = tabs.find((t) => t.properties?.title === tabName);
    const sheetId = tab?.properties?.sheetId;
    if (sheetId === undefined || sheetId === null) {
      throw new Error(`Could not find sheetId for tab: ${tabName}`);
    }
    return sheetId;
  };

  await insertMonthlyBudgetRow(sheets, spreadsheetId, sheetIdOf(budgetTab), categoryLabel, input.startingBudget);
  await insertAnnualSummaryRow(sheets, spreadsheetId, sheetIdOf(annualTab), categoryLabel);
}
