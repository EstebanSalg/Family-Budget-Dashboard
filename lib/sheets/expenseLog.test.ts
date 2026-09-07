import { describe, it, expect, vi } from 'vitest';

vi.mock('./client', () => ({
  getSheetsClient: vi.fn(async () => ({
    spreadsheets: {
      values: {
        get: vi.fn(async () => ({
          data: {
            values: [
              ['2026-04-15', '2,467.41', '💰 Income', 'Income from Esteban', 'WhatsApp', 'Apr', '2026'],
              ['2026-04-16', '31.28', '🐾 Pet', 'arena', 'WhatsApp', 'Apr', '2026'],
            ],
          },
        })),
      },
    },
  })),
  getSpreadsheetId: vi.fn(() => 'test-id'),
}));

describe('getTransactions', () => {
  it('parses rows into typed transactions', async () => {
    const { getTransactions } = await import('./expenseLog');
    const rows = await getTransactions();

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      amount: 2467.41,
      category: '💰 Income',
      description: 'Income from Esteban',
      source: 'WhatsApp',
      month: 'Apr',
      year: 2026,
    });
    expect(rows[0].date.getUTCDate()).toBe(15);
  });
});
