import { getSheetsClient, getSpreadsheetId } from './client';
import { RECURRING_RANGE, RECURRING_HEADER_ROW } from './layout';
import { parseCurrency, parseSheetDate } from './parse';

export type Frequency = 'Weekly' | 'Biweekly' | 'Monthly' | 'Annually';

export type RecurringItem = {
  name: string;
  category: string;
  expectedAmount: number;
  frequency: Frequency;
  nextDueDate: Date;
  autoLogEnabled: boolean;
  lastLoggedDate: Date | null;
};

const REQUIRED_NEW_COLUMNS = ['NextDueDate', 'ExpectedAmount', 'Frequency', 'AutoLogEnabled', 'LastLoggedDate'];

function tabName(): string {
  return RECURRING_RANGE.match(/^'([^']+)'/)?.[1] ?? '';
}

export async function ensureRecurringColumns(): Promise<void> {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const tab = tabName();

  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: `'${tab}'!A${RECURRING_HEADER_ROW}:Z${RECURRING_HEADER_ROW}` });
  const existingHeaders = (res.data.values?.[0] ?? []).map(String);

  const missing = REQUIRED_NEW_COLUMNS.filter((col) => !existingHeaders.includes(col));
  if (missing.length === 0) return;

  const newHeaders = [...existingHeaders, ...missing];
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${tab}'!A${RECURRING_HEADER_ROW}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [newHeaders] },
  });
}

export function advanceNextDueDate(date: Date, frequency: Frequency): Date {
  const d = new Date(date);
  switch (frequency) {
    case 'Weekly':
      d.setUTCDate(d.getUTCDate() + 7);
      break;
    case 'Biweekly':
      d.setUTCDate(d.getUTCDate() + 14);
      break;
    case 'Monthly': {
      // setUTCMonth naively overflows into the next month when the target
      // month is shorter than the current day-of-month (e.g. Jan 31 -> Mar 3
      // instead of Feb 28). Advance by month using the 1st as an anchor, then
      // clamp the day to the target month's actual length.
      const day = d.getUTCDate();
      d.setUTCDate(1);
      d.setUTCMonth(d.getUTCMonth() + 1);
      const daysInTargetMonth = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
      d.setUTCDate(Math.min(day, daysInTargetMonth));
      break;
    }
    case 'Annually':
      d.setUTCFullYear(d.getUTCFullYear() + 1);
      break;
  }
  return d;
}

export async function getRecurringItems(): Promise<RecurringItem[]> {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: RECURRING_RANGE });
  const rows = res.data.values ?? [];
  const header = rows[0] ?? [];
  const dataRows = rows.slice(1).filter((row) => row[0]);

  const idx = (col: string) => header.indexOf(col);

  return dataRows.map((row) => ({
    name: String(row[idx('Item')] ?? ''),
    category: String(row[idx('Category')] ?? ''),
    expectedAmount: parseCurrency(String(row[idx('ExpectedAmount')] ?? '')),
    frequency: (row[idx('Frequency')] as Frequency) ?? 'Monthly',
    nextDueDate: parseSheetDate(String(row[idx('NextDueDate')] ?? '2026-01-01')),
    autoLogEnabled: String(row[idx('AutoLogEnabled')]).toUpperCase() === 'TRUE',
    lastLoggedDate: row[idx('LastLoggedDate')] ? parseSheetDate(String(row[idx('LastLoggedDate')])) : null,
  }));
}

export async function addRecurringItem(input: {
  name: string;
  category: string;
  expectedAmount: number;
  frequency: Frequency;
  nextDueDate: Date;
  autoLogEnabled: boolean;
}): Promise<void> {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const tab = tabName();

  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: `'${tab}'!A${RECURRING_HEADER_ROW}:Z${RECURRING_HEADER_ROW}` });
  const header = (res.data.values?.[0] ?? []).map(String);
  const row = header.map((col) => {
    switch (col) {
      case 'Item': return input.name;
      case 'Category': return input.category;
      case 'ExpectedAmount': return input.expectedAmount;
      case 'Frequency': return input.frequency;
      case 'NextDueDate': return input.nextDueDate.toISOString().slice(0, 10);
      case 'AutoLogEnabled': return input.autoLogEnabled ? 'TRUE' : 'FALSE';
      default: return '';
    }
  });

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `'${tab}'!A:${String.fromCharCode(64 + header.length)}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  });
}
