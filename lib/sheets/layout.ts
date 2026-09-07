// lib/sheets/layout.ts
//
// Populated from `npm run discover-layout` output against the dev copy sheet
// (spreadsheet id from GOOGLE_SPREADSHEET_ID in .env.local), run 2026-09-07.
//
// Resolved ambiguity: the five logical sections are five SEPARATE TABS, not
// stacked regions within one tab. One surprise: the "Debt Tracker" section
// lives in a tab literally named "Loans", not "Debt Tracker". Two of the tabs
// (Monthly Budget, Annual Summary) also have a title row (and, for Monthly
// Budget, a month-selector row) above their real header row, so their header
// row is not row 1.
//
// Update these constants (not the code that uses them) if the sheet is
// restructured — re-run `npm run discover-layout` first to get fresh values.

// --- Expense Log tab ---
// Row 1 is the header (Date, Amount, Category, Description, Source, Month,
// Year). Data starts row 2. Tab has 1029 total grid rows.
export const EXPENSE_LOG_RANGE = "'Expense Log'!A2:G1029";
export const EXPENSE_LOG_HEADER_ROW = 1;

// --- Monthly Budget tab (Categories) ---
// Row 1 is a title ("💰  Monthly Budget Tracker"), row 2 is a month selector
// (label in A2, selected month value in C2), row 3 is the real header
// (Category, Budget ($), Spent ($), Remaining ($), % Used, Status). Category
// rows run 4-19, row 20 is a TOTAL row. Tab has 1001 total grid rows.
export const BUDGET_RANGE = "'Monthly Budget'!A3:F1001";
export const BUDGET_HEADER_ROW = 3;
export const BUDGET_MONTH_SELECTOR_CELL = "'Monthly Budget'!C2";

// --- Annual Summary tab ---
// Row 1 is a title ("📈  Annual Spending by Category"), row 2 is the real
// header (Category, Jan..Dec, TOTAL = 14 columns, A-N). Category rows run
// 3-18, row 19 is a TOTAL row. Tab has 1001 total grid rows.
export const ANNUAL_SUMMARY_RANGE = "'Annual Summary'!A2:N1001";
export const ANNUAL_SUMMARY_HEADER_ROW = 2;

// --- Debt Tracker section -> actually the "Loans" tab ---
// Row 1 is a title (" 💸Debt Tracker"), row 2 is the real header (Name,
// Principal, CurrentBalance, Payment, Frequency, StartDate, Rate, Keyword =
// 8 columns, A-H). No debt rows currently populated. Tab has 1001 total grid
// rows.
export const DEBT_TRACKER_RANGE = "'Loans'!A2:H1001";
export const DEBT_TRACKER_HEADER_ROW = 2;

// --- Recurring Expenses and Subscriptions section -> the "Recurring Expenses" tab ---
// Row 1 is a title (" 💸Recurring Expenses and Subscriptions"), row 2 is the
// real header (Category, Item, ExpectedAmount, Keyword, Type, Notes = 6
// columns, A-F). Data rows run 3-17. Tab has 1001 total grid rows.
export const RECURRING_RANGE = "'Recurring Expenses'!A2:F1001";
export const RECURRING_HEADER_ROW = 2;
