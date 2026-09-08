// lib/sheets/annualSummary.ts
import { getSheetsClient, getSpreadsheetId } from './client';
import { ANNUAL_SUMMARY_RANGE } from './layout';
import { parseCurrency } from './parse';

export type AnnualRow = { category: string; months: number[]; total: number };

export async function getAnnualSummary(): Promise<AnnualRow[]> {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: ANNUAL_SUMMARY_RANGE });
  const rows = res.data.values ?? [];
  const dataRows = rows.filter((row) => row[0] && row[0] !== 'Category' && row[0] !== 'TOTAL');

  return dataRows.map((row) => ({
    category: String(row[0]),
    months: row.slice(1, 13).map((cell) => parseCurrency(String(cell))),
    total: parseCurrency(String(row[13] ?? '')),
  }));
}
