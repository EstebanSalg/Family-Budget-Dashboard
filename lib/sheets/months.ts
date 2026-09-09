// Pure constants only -- no Sheets API imports. lib/sheets/budgets.ts pulls
// in googleapis (Node-only: net, tls, etc.), so a client component that
// imports MONTH_NAMES from budgets.ts drags the whole Google API client into
// the browser bundle and fails to build. This file is safe for both server
// and client code to import.

// Matches the 3-letter month abbreviation format the sheet's own formulas
// use (Expense Log's Month column is written via
// `date.toLocaleString('en-US', { month: 'short' })` in appendTransaction) --
// keep in sync with that format, not with any other month naming.
export const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

export const MONTH_LABELS: Record<string, string> = {
  Jan: 'January', Feb: 'February', Mar: 'March', Apr: 'April',
  May: 'May', Jun: 'June', Jul: 'July', Aug: 'August',
  Sep: 'September', Oct: 'October', Nov: 'November', Dec: 'December',
};
