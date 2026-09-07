// lib/sheets/budgets.test.ts
import { describe, it, expect, vi } from 'vitest';

vi.mock('./client', () => ({
  getSheetsClient: vi.fn(async () => ({
    spreadsheets: {
      values: {
        get: vi.fn(async () => ({
          data: {
            values: [
              ['Category', 'Budget ($)', 'Spent ($)', 'Remaining ($)', '% Used', 'Status'],
              ['🛒 Groceries', '1,100.00', '1,659.71', '-559.71', '150.88%', '🔴 Over'],
              ['🍽️ Dining Out', '400.00', '287.97', '112.03', '71.99%', '🟢 OK'],
            ],
          },
        })),
      },
    },
  })),
  getSpreadsheetId: vi.fn(() => 'test-id'),
}));

describe('getCategoryBudgets', () => {
  it('parses category rows, skipping the header', async () => {
    const { getCategoryBudgets } = await import('./budgets');
    const rows = await getCategoryBudgets();

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      category: '🛒 Groceries',
      budget: 1100,
      spent: 1659.71,
      remaining: -559.71,
    });
  });
});
