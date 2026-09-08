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

  // BUDGET_RANGE starts AT its header row, which is NOT row 1 — the Monthly
  // Budget tab has a title row and a month-selector row above it, so the header
  // is row 3 (BUDGET_RANGE = "'Monthly Budget'!A3:F1001", BUDGET_HEADER_ROW = 3).
  // rows[0] is therefore the header at sheet row 3, and rows[i] is at sheet row
  // 3 + i. Derive that offset from the range's own starting row rather than
  // hardcoding it, so updating lib/sheets/layout.ts alone stays sufficient.
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

// Context handed to a tab's row-value builders once the shared mechanics
// (fetch, locate TOTAL, pick the template row, compute row numbers) have
// run. `templateRow`/`totalRow` are the raw FORMULA-rendered cell arrays for
// the template category row and the (pre-shift) TOTAL row respectively.
type NewRowContext = {
  templateRow: unknown[];
  templateCategoryLabel: string;
  templateSheetRow: number;
  newCategoryRow: number;
};

type TotalRowContext = {
  totalRow: unknown[];
  oldTotalSheetRow: number;
  newTotalRow: number;
  newCategoryRow: number;
};

// Shared mechanics for inserting a new category row immediately above a
// tab's TOTAL row (via batchUpdate insertDimension, shifting TOTAL down by
// one), writing the new row's formulas, and rewriting TOTAL's formulas to
// include it. Monthly Budget and Annual Summary differ only in column
// layout (6 columns vs. 14, and which columns TOTAL sums) -- that
// difference is captured entirely by `lastColumn`/`totalFirstColumn` and the
// two builder callbacks, which are given the exact same template/TOTAL rows
// and computed row numbers this function already worked out.
async function insertCategoryRowAboveTotal(
  sheets: Awaited<ReturnType<typeof getSheetsClient>>,
  spreadsheetId: string,
  sheetId: number,
  range: string,
  lastColumn: string,
  totalFirstColumn: string,
  totalLastColumn: string,
  buildNewRowValues: (ctx: NewRowContext) => unknown[],
  buildTotalRowValues: (ctx: TotalRowContext) => unknown[]
): Promise<void> {
  const tabName = tabNameOf(range);
  const rangeStartRow = rangeStartRowOf(range);

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
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

  const newRowValues = buildNewRowValues({
    templateRow,
    templateCategoryLabel,
    templateSheetRow,
    newCategoryRow,
  });

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
    range: `'${tabName}'!A${newCategoryRow}:${lastColumn}${newCategoryRow}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [newRowValues] },
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
  const totalRowValues = buildTotalRowValues({
    totalRow,
    oldTotalSheetRow,
    newTotalRow,
    newCategoryRow,
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${tabName}'!${totalFirstColumn}${newTotalRow}:${totalLastColumn}${newTotalRow}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [totalRowValues] },
  });
}

// Monthly Budget tab: Category/Budget (literal) + Spent/Remaining/%Used/Status
// (formulas derived from the template row), columns A-F. TOTAL sums B-E.
async function insertMonthlyBudgetRow(
  sheets: Awaited<ReturnType<typeof getSheetsClient>>,
  spreadsheetId: string,
  sheetId: number,
  categoryLabel: string,
  startingBudget: number
): Promise<void> {
  await insertCategoryRowAboveTotal(
    sheets,
    spreadsheetId,
    sheetId,
    BUDGET_RANGE,
    'F',
    'B',
    'E',
    ({ templateRow, templateCategoryLabel, templateSheetRow, newCategoryRow }) => {
      const spentFormula = substituteCategoryLiteral(String(templateRow[2]), templateCategoryLabel, categoryLabel);
      const remainingFormula = shiftRowRefs(String(templateRow[3]), templateSheetRow, newCategoryRow);
      const percentFormula = shiftRowRefs(String(templateRow[4]), templateSheetRow, newCategoryRow);
      const statusFormula = shiftRowRefs(String(templateRow[5]), templateSheetRow, newCategoryRow);
      return [categoryLabel, startingBudget, spentFormula, remainingFormula, percentFormula, statusFormula];
    },
    ({ totalRow, oldTotalSheetRow, newTotalRow, newCategoryRow }) => {
      const budgetSumFormula = `${String(totalRow[1])}+B${newCategoryRow}`;
      const spentSumFormula = `${String(totalRow[2])}+C${newCategoryRow}`;
      const remainingSumFormula = `${String(totalRow[3])}+D${newCategoryRow}`;
      const totalPercentFormula = shiftRowRefs(String(totalRow[4]), oldTotalSheetRow, newTotalRow);
      return [budgetSumFormula, spentSumFormula, remainingSumFormula, totalPercentFormula];
    }
  );
}

// Annual Summary tab: Category (literal) + 12 per-month SUMPRODUCT columns
// (B-M, each filtered by a literal month string rather than row-relative)
// + a per-category annual TOTAL column (N, row-relative), columns A-N. TOTAL
// sums B-N. There is no Budget column here, so no startingBudget is written.
async function insertAnnualSummaryRow(
  sheets: Awaited<ReturnType<typeof getSheetsClient>>,
  spreadsheetId: string,
  sheetId: number,
  categoryLabel: string
): Promise<void> {
  const columnLetters = ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'];

  await insertCategoryRowAboveTotal(
    sheets,
    spreadsheetId,
    sheetId,
    ANNUAL_SUMMARY_RANGE,
    'N',
    'B',
    'N',
    ({ templateRow, templateCategoryLabel, templateSheetRow, newCategoryRow }) => {
      // Columns B..M (indices 1..12) are the 12 month SUMPRODUCT formulas,
      // each filtered by a literal month string (not row-relative) -- only
      // the category-name literal needs to change. Column N (index 13) is
      // the per-category annual TOTAL, "=SUM(B{row}:M{row})", which is
      // row-relative.
      const monthFormulas = templateRow
        .slice(1, 13)
        .map((cell) => substituteCategoryLiteral(String(cell), templateCategoryLabel, categoryLabel));
      const rowTotalFormula = shiftRowRefs(String(templateRow[13]), templateSheetRow, newCategoryRow);
      return [categoryLabel, ...monthFormulas, rowTotalFormula];
    },
    ({ totalRow, newCategoryRow }) => {
      return columnLetters.map((col, i) => `${String(totalRow[i + 1])}+${col}${newCategoryRow}`);
    }
  );
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
