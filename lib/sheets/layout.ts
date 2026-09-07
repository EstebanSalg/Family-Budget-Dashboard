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
//
// IMPORTANT: Header-row inclusion inconsistency across ranges
// ═════════════════════════════════════════════════════════════════════════════
// The five *_RANGE constants below do NOT use one uniform convention for
// whether the header row is included in the fetched data:
//   - EXPENSE_LOG_RANGE starts AFTER its header row (row 1 is a data row, not
//     a header row). Every row in the fetched range is a data row.
//   - BUDGET_RANGE, ANNUAL_SUMMARY_RANGE, DEBT_TRACKER_RANGE, and
//     RECURRING_RANGE all start AT their header row (row 1 of the fetched
//     range is the header row).
//
// This inconsistency is safe in the consuming code (currently):
//   - Budget, Annual Summary, and Debt Tracker readers filter rows by checking
//     for known header/total label strings (e.g., skipping any row where the
//     first cell equals 'Category', 'Name', or 'TOTAL') — this filtering works
//     correctly whether or not a header row is present in the fetched range.
//   - Recurring Expenses reader treats the first row of RECURRING_RANGE as the
//     header on purpose, because RECURRING_RANGE is designed to start at the
//     real header row.
//
// Code consuming these ranges must account for this per-range inconsistency,
// not assume uniform behavior across all five ranges.
// ═════════════════════════════════════════════════════════════════════════════

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
// real header. Originally (Task 3 discovery) this was 6 columns (Category,
// Item, ExpectedAmount, Keyword, Type, Notes = A-F). Task 13 ran a live
// migration (`ensureRecurringColumns`) that appended 4 new columns —
// NextDueDate, Frequency, AutoLogEnabled, LastLoggedDate — making the real
// header 10 columns wide (Category, Item, ExpectedAmount, Keyword, Type,
// Notes, NextDueDate, Frequency, AutoLogEnabled, LastLoggedDate = A-J).
// RECURRING_RANGE was extended from A2:F1001 to A2:J1001 in the Task 13
// fix-round to match — it had been left at the pre-migration 6-column width,
// which silently truncated every read of the four new columns. Data rows
// run 3-17. Tab has 1001 total grid rows.
export const RECURRING_RANGE = "'Recurring Expenses'!A2:J1001";
export const RECURRING_HEADER_ROW = 2;
