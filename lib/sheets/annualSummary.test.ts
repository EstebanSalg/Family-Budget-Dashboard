// lib/sheets/annualSummary.test.ts
import { describe, it, expect, vi } from 'vitest';

vi.mock('./client', () => ({
  getSheetsClient: vi.fn(async () => ({
    spreadsheets: {
      values: {
        get: vi.fn(async () => ({
          data: {
            values: [
              ['Category', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'TOTAL'],
              ['🛒 Groceries', '-', '-', '87.50', '720.70', '327.77', '711.74', '1,226.92', '1,659.71', '51.00', '-', '-', '-', '4,785.34'],
            ],
          },
        })),
      },
    },
  })),
  getSpreadsheetId: vi.fn(() => 'test-id'),
}));

describe('getAnnualSummary', () => {
  it('parses month columns into a numeric array and dashes into zero', async () => {
    const { getAnnualSummary } = await import('./annualSummary');
    const rows = await getAnnualSummary();

    expect(rows).toHaveLength(1);
    expect(rows[0].category).toBe('🛒 Groceries');
    expect(rows[0].months).toEqual([0, 0, 87.5, 720.7, 327.77, 711.74, 1226.92, 1659.71, 51, 0, 0, 0]);
    expect(rows[0].total).toBe(4785.34);
  });
});
